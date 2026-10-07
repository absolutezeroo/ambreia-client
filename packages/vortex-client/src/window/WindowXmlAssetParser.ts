import {TYPE_NAME_TO_CODE} from '@ambreia/ui/enum/WindowType';
import type {ISkinData} from '@ambreia/ui/graphics/renderer/BitmapSkinParser';
import {SkinLayoutEntity} from '@ambreia/ui/graphics/renderer/SkinLayoutEntity';
import type {IElementDescriptionData} from '@ambreia/ui/kit/IElementDescriptor';

// TS-only: AS3 kept a layout in the `IAsset` it was loaded from and handed the XML straight
//   to `WindowParser`; the port carries the same three fields to the same place.
export interface IWindowLayoutXmlData {
    name: string;
    source: string;
    xml: string;
}

// AS3 switches on the lowercased attribute and has no default case, so a spelling it does
// not list leaves the entity's `scaleH`/`scaleV` at the uint default, 0 = FIXED.
// DEVIATION: `stretch` is not one of those cases — only the `strech` typo is. The two
//   `header_center` entities in `habbo_skin_header_3_xml` and `habbo_skin_header_7_xml`
//   are the only 2 of the 2,066 scale attributes in the shipped skins spelt that way, so
//   Flash held the header's centre segment fixed and left a gap across any wide style-3/7
//   window. The port maps the spelling to STRECH and those two headers fill.
// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/_SafeCls_4380.as::parseLayoutEntity()
const SCALE_TYPE: Record<string, number> =
    {
        fixed: SkinLayoutEntity.SCALE_TYPE_FIXED,
        move: SkinLayoutEntity.SCALE_TYPE_MOVE,
        strech: SkinLayoutEntity.SCALE_TYPE_STRECH,
        stretch: SkinLayoutEntity.SCALE_TYPE_STRECH,
        tiled: SkinLayoutEntity.SCALE_TYPE_TILED,
        center: SkinLayoutEntity.SCALE_TYPE_CENTER
    };

// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/_SafeCls_1859.as::parse()
export function parseElementDescriptionXml(
    xml: string,
    assetId: string,
    source: string
): IElementDescriptionData 
{
    const doc = parseXmlDocument(xml, source);
    const windows = Array.from(doc.getElementsByTagName('window'));

    const elements = windows.map((windowNode) => 
    {
        const attrs = readAttributes(windowNode);
        const typeName = attrs.type ?? '';
        // AS3 fills one table — `TypeCodeTable.fillTables()` — and hands the lookup straight
        // to `addSkinRenderer(param1:uint, …)`, so a tag the table does not list arrives as
        // `uint(undefined)` = 0, not as an error. `WindowParser` fills that same table, so
        // the layout and the descriptor agree on the id and the element still finds its
        // skin: `frame_pointer_down` is in no type table but is both a tag in
        // `habbo_window_layout_frame_7_xml` and a style-7 descriptor here, and that is the
        // only reason the style-7 frame's pointer renders at all. Dropping it at -1 sent
        // that lookup to the style-0 fallback — `habbo_skin_frame_xml`, a whole frame where
        // a 16×12 arrow belongs.
        //
        // Reading `TYPE_NAME_TO_CODE` is what makes "the same table" true. The private copy
        // this replaces had no `iconbutton`, so the two `iconbutton` descriptors here (plus
        // at style 3, minus at style 4) registered under type 0 while the 8 `<iconbutton>`
        // in the shipped layouts asked `ElementRegistry` for type 79 and got nothing.
        const typeId = TYPE_NAME_TO_CODE[typeName] ?? 0;
        const statesNode = getChildElements(windowNode, 'states')[0] ?? null;
        const states = getChildElements(statesNode, 'state').map((stateNode) => 
        {
            const stateAttrs = readAttributes(stateNode);

            return {
                name: stateAttrs.name ?? '',
                layout: stateAttrs.layout ?? '',
                template: stateAttrs.template ?? ''
            };
        });

        return {
            type: typeName,
            typeId,
            intent: attrs.intent ?? '',
            style: parseNumber(attrs.style, 0),
            renderer: attrs.renderer ?? '',
            asset: attrs.asset ?? '',
            layout: attrs.layout ?? '',
            windowLayout: attrs.window_layout ?? '',
            defaults:
                {
                    threshold: parseNumber(attrs.treshold, 10),
                    background: attrs.background === 'true',
                    blend: parseNumber(attrs.blend, 1),
                    color: parseNumber(attrs.color, 0xffffff),
                    widthMin: parseNumber(attrs.width_min, -2147483648),
                    widthMax: parseNumber(attrs.width_max, 2147483647),
                    heightMin: parseNumber(attrs.height_min, -2147483648),
                    heightMax: parseNumber(attrs.height_max, 2147483647)
                },
            states
        };
    });

    return {
        id: assetId,
        source,
        elements
    };
}

// DEVIATION: AS3 pushes into an ISkinRenderer as it parses — parseLayout()/parseState() call
//   `addLayout()`/`registerLayoutForRenderState()` per node — so it needs one static helper per
//   nesting level. This parser returns plain `ISkinData` and the renderer is built from it
//   afterwards, so parseLayout(), parseLayoutEntityList(), parseTemplateEntityList() and
//   parseState() are the `.map()` bodies below rather than four more functions. The eight
//   state-name constants that go with them live on the engine's `BitmapSkinParser`, which is the
//   real port of this AS3 class and now cites it member by member, and parseState()'s name→bit
//   switch is that class's `STATE_FLAGS`, keyed off those same constants.
// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/_SafeCls_4380.as::parseSkinDescription()
export function parseSkinXml(
    xml: string,
    assetId: string,
    source: string
): ISkinData | null 
{
    const doc = parseXmlDocument(xml, source);
    const skinNode = doc.getElementsByTagName('skin')[0] ?? null;

    if(!skinNode) 
    {
        return null;
    }

    const vars = parseSkinVariables(skinNode);
    const skinName = skinNode.getAttribute('name') ?? '';

    return {
        id: assetId,
        name: skinName,
        source,
        variables: vars,
        templates: parseSkinTemplates(skinNode, vars),
        layouts: parseSkinLayouts(skinNode, vars),
        states: parseSkinStates(skinNode, vars)
    };
}

// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/WindowParser.as::parseAndConstruct()
export function parseWindowLayoutXml(
    xml: string,
    layoutName: string,
    source: string
): IWindowLayoutXmlData[] 
{
    const layoutRoot = parseXmlDocument(xml, source).documentElement;

    if(!layoutRoot)
    {
        return [];
    }

    // One <window> per layout asset — all 784 shipped ones. AS3 does accept a file with
    // several, but parses them all into the same parent and returns the last
    // (WindowParser.as::parseAndConstruct), which WindowParser.ts already mirrors; the
    // `name#i` split this replaces invented asset names nothing could look up.
    if(layoutRoot.nodeName !== 'window' && getChildElements(layoutRoot, 'window').length === 0)
    {
        return [];
    }

    return [{
        name: layoutName,
        source,
        xml: new XMLSerializer().serializeToString(layoutRoot)
    }];
}

// TS-only: E4X parsed XML as a language primitive, so AS3 has no counterpart to this.
function parseXmlDocument(xml: string, source: string = 'unknown'): XMLDocument 
{
    const normalized = normalizeXmlContent(xml);
    let doc = new DOMParser().parseFromString(normalized, 'text/xml');
    let parserError = getParserError(doc);

    if(parserError)
    {
        // Some extracted XML assets contain missing spaces between attributes:
        // e.g. name="foo"id="0". AS3 tolerated these resources.
        const repaired = repairMalformedAttributeSpacing(normalized);

        if(repaired !== normalized)
        {
            doc = new DOMParser().parseFromString(repaired, 'text/xml');
            parserError = getParserError(doc);
        }
    }

    if(parserError) 
    {
        throw new Error(`[WindowXmlAssetParser] Failed to parse ${source}: ${parserError.textContent ?? 'Unknown XML parse error'}`);
    }

    return doc;
}

// Matching control characters is the point: the extracted assets contain them and XML 1.0
// forbids them, so DOMParser would reject a document over one stray byte.
/* eslint-disable no-control-regex */
// TS-only: Flash parsed these assets with E4X, which never saw the raw bytes DOMParser rejects.
function normalizeXmlContent(xml: string): string
{
    return xml
        .replace(/^\uFEFF/, '')
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
        .trim();
}
/* eslint-enable no-control-regex */

// TS-only: DOMParser reports a failure as a `parsererror` node instead of throwing; E4X threw.
function getParserError(doc: XMLDocument): Element | null 
{
    const root = doc.documentElement;

    if(root && root.nodeName === 'parsererror') 
    {
        return root;
    }

    const errors = doc.getElementsByTagName('parsererror');

    if(errors.length > 0) 
    {
        return errors[0];
    }

    return null;
}

// TS-only: E4X tolerated `name="value"id="0"` in the extracted assets; DOMParser does not.
function repairMalformedAttributeSpacing(xml: string): string 
{
    return xml.replace(/<[^>]+>/g, (tag) => tag.replace(/"(?=[A-Za-z_][\w:.-]*=)/g, '" '));
}

// TS-only: E4X read an attribute as `node.@name`; the port collects them once per node.
function readAttributes(element: Element | null): Record<string, string> 
{
    if(!element)
    {
        return {};
    }

    return Object.fromEntries(Array.from(element.attributes, (attr) => [attr.name, attr.value]));
}

// TS-only: stands in for E4X's `node.child("name")`, which has no DOM equivalent.
function getChildElements(node: Element | null, name?: string): Element[] 
{
    if(!node)
    {
        return [];
    }

    const children = Array.from(node.children);

    return name ? children.filter((child) => child.nodeName === name) : children;
}

// TS-only: AS3 defaulted per attribute with `@attr[0] ? uint(@attr[0]) : fallback`, which
//   turns on the attribute being ABSENT — not on its value being falsy. This keeps that.
function parseNumber(value: string | number | null, fallback: number): number
{
    if(value === undefined || value === null || value === '') 
    {
        return fallback;
    }

    const str = String(value);

    if(str.startsWith('0x') || str.startsWith('0X')) 
    {
        const parsedHex = Number.parseInt(str, 16);

        return Number.isNaN(parsedHex) ? fallback : parsedHex;
    }

    const parsed = Number(str);

    return Number.isNaN(parsed) ? fallback : parsed;
}

// TS-only: AS3 asked the asset library for the linkage name verbatim. The port's bundle keys
//   images by bare filename, so the extension suffix the skins carry has to come off here.
function normalizeAssetName(assetKey: string): string 
{
    if(!assetKey) 
    {
        return '';
    }

    return assetKey.replace(/_(png|jpg|jpeg|gif|swf|xml)$/i, '');
}

// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/_SafeCls_4380.as::parseLayoutEntity()
function resolveVar(value: string | null, vars: Record<string, string>): string
{
    if(!value) 
    {
        return '';
    }

    if(value.startsWith('$')) 
    {
        const key = value.slice(1);

        return vars[key] ?? '';
    }

    return value;
}

// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/_SafeCls_4380.as::parseLayoutEntity()
function parseScaleValue(value: string): number 
{
    if(!value)
    {
        return SkinLayoutEntity.SCALE_TYPE_FIXED;
    }

    const lowered = value.toLowerCase();

    return SCALE_TYPE[lowered] ?? SkinLayoutEntity.SCALE_TYPE_FIXED;
}

// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/_SafeCls_4380.as::parseLayoutEntity()
function parseRectangle(regionNode: Element | null, vars: Record<string, string>): {
    x: number;
    y: number;
    width: number;
    height: number
} 
{
    const rectNode = getChildElements(regionNode, 'Rectangle')[0] ?? null;

    if(!rectNode) 
    {
        return {x: 0, y: 0, width: 0, height: 0};
    }

    const attrs = readAttributes(rectNode);

    return {
        x: parseNumber(resolveVar(attrs.x, vars), 0),
        y: parseNumber(resolveVar(attrs.y, vars), 0),
        width: parseNumber(resolveVar(attrs.width, vars), 0),
        height: parseNumber(resolveVar(attrs.height, vars), 0)
    };
}

// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/utils/_SafeCls_3252.as::parseVariableList()
function parseSkinVariables(skinNode: Element): Record<string, string> 
{
    const vars: Record<string, string> = {};
    const variablesNode = getChildElements(skinNode, 'variables')[0] ?? null;

    if(!variablesNode) 
    {
        return vars;
    }

    for(const variable of getChildElements(variablesNode, 'variable')) 
    {
        const attrs = readAttributes(variable);
        const key = attrs.key ?? attrs.name;
        let value = attrs.value ?? '';

        if(key === 'asset') 
        {
            value = normalizeAssetName(value);
        }

        if(key) 
        {
            vars[key] = value;
        }
    }

    return vars;
}

// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/_SafeCls_4380.as::parseTemplateList()
function parseSkinTemplates(skinNode: Element, vars: Record<string, string>): ISkinData['templates'] 
{
    const templatesNode = getChildElements(skinNode, 'templates')[0] ?? null;

    if(!templatesNode) 
    {
        return [];
    }

    return getChildElements(templatesNode, 'template').map((templateNode) => 
    {
        const attrs = readAttributes(templateNode);
        const entitiesNode = getChildElements(templateNode, 'entities')[0] ?? null;
        const entities = getChildElements(entitiesNode, 'entity').map((entityNode) => 
        {
            const entityAttrs = readAttributes(entityNode);
            const regionNode = getChildElements(entityNode, 'region')[0] ?? null;

            return {
                id: parseNumber(resolveVar(entityAttrs.id, vars), 0),
                name: resolveVar(entityAttrs.name, vars),
                type: resolveVar(entityAttrs.type, vars),
                region: parseRectangle(regionNode, vars)
            };
        });

        return {
            name: resolveVar(attrs.name, vars),
            asset: normalizeAssetName(resolveVar(attrs.asset, vars)),
            entities
        };
    });
}

// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/_SafeCls_4380.as::parseLayoutList()
function parseSkinLayouts(skinNode: Element, vars: Record<string, string>): ISkinData['layouts'] 
{
    const layoutsNode = getChildElements(skinNode, 'layouts')[0] ?? null;

    if(!layoutsNode) 
    {
        return [];
    }

    return getChildElements(layoutsNode, 'layout').map((layoutNode) => 
    {
        const attrs = readAttributes(layoutNode);
        const entitiesNode = getChildElements(layoutNode, 'entities')[0] ?? null;
        const entities = getChildElements(entitiesNode, 'entity').map((entityNode) => 
        {
            const entityAttrs = readAttributes(entityNode);
            const colorNode = getChildElements(entityNode, 'color')[0] ?? null;
            const blendNode = getChildElements(entityNode, 'blend')[0] ?? null;
            const scaleNode = getChildElements(entityNode, 'scale')[0] ?? null;
            const regionNode = getChildElements(entityNode, 'region')[0] ?? null;
            const scaleAttrs = readAttributes(scaleNode);
            const colorValue = colorNode?.textContent?.trim() ?? '';
            const blendValue = blendNode?.textContent?.trim() ?? '';
            const colorizeValue = entityAttrs.colorize;

            return {
                id: parseNumber(resolveVar(entityAttrs.id, vars), 0),
                name: resolveVar(entityAttrs.name, vars),
                colorize: colorizeValue === '' || colorizeValue === undefined ? true : colorizeValue === 'true',
                color: parseNumber(resolveVar(colorValue, vars), 0),
                blend: parseNumber(resolveVar(blendValue, vars), 0xffffffff),
                scaleH: parseScaleValue(resolveVar(scaleAttrs.horizontal, vars)),
                scaleV: parseScaleValue(resolveVar(scaleAttrs.vertical, vars)),
                region: parseRectangle(regionNode, vars)
            };
        });

        return {
            name: resolveVar(attrs.name, vars),
            transparent: attrs.transparent === 'true',
            blendMode: attrs.blendMode ?? '',
            entities
        };
    });
}

// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/_SafeCls_4380.as::parseRenderStateList()
function parseSkinStates(skinNode: Element, vars: Record<string, string>): ISkinData['states'] 
{
    const statesNode = getChildElements(skinNode, 'states')[0] ?? null;

    if(!statesNode) 
    {
        return [];
    }

    return getChildElements(statesNode, 'state').map((stateNode) => 
    {
        const attrs = readAttributes(stateNode);

        return {
            name: resolveVar(attrs.name, vars),
            layout: resolveVar(attrs.layout, vars),
            template: resolveVar(attrs.template, vars)
        };
    });
}
