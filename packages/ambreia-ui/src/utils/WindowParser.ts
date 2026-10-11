import {platform} from '@ambreia/common/platform/Platform';
import type {IWindowParser} from './IWindowParser';
import type {IWindow} from '../IWindow';
import type {IWindowContextAccess} from '../IWindowContextAccess';
import type {IStaticBitmapWrapperWindow} from '../components/IStaticBitmapWrapperWindow';
import type {IBoxSizerWindow} from '../components/IBoxSizerWindow';
import {PropertyStruct} from './PropertyStruct';
import {TYPE_CODE_TO_NAME, TYPE_NAME_TO_CODE, WindowType} from '../enum/WindowType';
import {PARAM_NAME_TO_FLAG, WindowParam} from '../enum/WindowParam';

type XmlLayoutInput = string | Document | Element;

interface IParsedVar {
    key: string;
    value: unknown;
}

/**
 * XML window parser.
 *
 * Faithful AS3-oriented implementation of `WindowParser`.
 * Parses XML layouts and builds a window tree through `WindowContext.create`.
 *
 * @see sources/win63_version/core/window/utils/WindowParser.as
 */
export class WindowParser implements IWindowParser 
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/WindowParser.as::ELEMENT_TAG_EXCLUDE
    // A window carrying this tag is skipped when the tree is serialized back to
    // XML — it is authoring scaffolding, not part of the layout.
    public static readonly ELEMENT_TAG_EXCLUDE: string = '_EXCLUDE';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/WindowParser.as::ELEMENT_TAG_INCLUDE
    // Declared by AS3 and read nowhere in the tree; kept so the pair is not half
    // present.
    public static readonly ELEMENT_TAG_INCLUDE: string = '_INCLUDE';

    /**
     * Localization resolver callback.
     *
     * When set, `${key}` tokens in captions and string properties
     * are resolved through this function.
     */
    public static localizationResolver: ((key: string) => string | null) | null = null;

    // AS3: .../src/com/sulake/core/window/utils/WindowParser.as::_disposed
    private _disposed: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/WindowParser.as::_context
    // AS3's constructor takes and stores the owning context, independent of whatever `parent` a
    // given parseAndConstruct() call is passed - buildFromXML() calls it with `parent = null`
    // (see HabboWindowManagerComponent.as::buildFromXML()), and this is how the top-level
    // constructed window still resolves a context/theme to build under despite having no parent
    // to read `.context` off of.
    private readonly _context: IWindowContextAccess<IWindow>;

    // DEVIATION: AS3 declares a `_parsedLayoutCache`, allocates it in the constructor and disposes
    //   it in dispose(), and never reads or writes it in between — `parseAndConstruct()`'s
    //   variable set (param3) is a freshly-created instance when null, never this field. It is an
    //   allocation and a disposal around nothing, so the port omits it rather than carrying a
    //   field whose only behaviour is to exist. The name suggests a cache; there is no cache.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/WindowParser.as::_parsedLayoutCache
    public constructor(context: IWindowContextAccess<IWindow>)
    {
        this._context = context;
    }

    // AS3: .../src/com/sulake/core/window/utils/WindowParser.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: .../src/com/sulake/core/window/utils/WindowParser.as::parseAndConstruct()
    public parseAndConstruct(layout: XmlLayoutInput, parent: IWindow | null, namedWindows: Map<string, IWindow> | null): IWindow | null
    {
        const root = this.resolveLayoutRoot(layout);

        if(!root) 
        {
            return null;
        }

        const sharedVars = new Map<string, unknown>();

        if(root.nodeName === 'layout') 
        {
            const variablesNode = getDirectChildByName(root, 'variables');

            if(variablesNode) 
            {
                const vars = this.parseSharedVariables(variablesNode);

                for(const [key, value] of vars) 
                {
                    sharedVars.set(key, value);
                }
            }

            const filtersNode = getDirectChildByName(root, 'filters');

            if(filtersNode) 
            {
                const filters = this.parseFilters(filtersNode, sharedVars);

                if(filters.length > 0 && parent)
                {
                    parent.filters = filters;
                }
            }

            const windowNodes = getDirectChildrenByName(root, 'window');
            const rootChildren = windowNodes.length > 0
                ? windowNodes
                : getDirectChildElements(root).filter((node) => 
                {
                    const nodeName = node.nodeName;

                    return nodeName !== 'variables' && nodeName !== 'filters';
                });

            if(rootChildren.length === 0) 
            {
                return null;
            }

            if(rootChildren.length === 1) 
            {
                return rootChildren[0].nodeName === 'window'
                    ? this.parseAndConstruct(rootChildren[0], parent, namedWindows)
                    : this.parseWindowNodes(rootChildren, parent, sharedVars, namedWindows);
            }

            return this.parseWindowNodes(rootChildren, parent, sharedVars, namedWindows);
        }

        if(root.nodeName === 'window') 
        {
            const children = getDirectChildElements(root).filter((node) => 
            {
                const nodeName = node.nodeName;

                return nodeName !== 'variables' && nodeName !== 'filters';
            });

            if(children.length === 0) 
            {
                return null;
            }

            return this.parseWindowNodes(children, parent, sharedVars, namedWindows);
        }

        return this.parseSingleWindowEntity(root, parent, sharedVars, namedWindows);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/WindowParser.as::windowToXMLString()
    public windowToXMLString(window: IWindow): string
    {
        if(window.dynamicStyle.length < 3)
        {
            window.dynamicStyle = '';
        }

        if(window.dynamicStyle !== '')
        {
            window.setParamFlag(WindowParam.USE_PARENT_GRAPHIC_CONTEXT, false);
        }

        const typeName = TYPE_CODE_TO_NAME[window.type] ?? 'null';
        let xml = '';

        xml += `<${typeName}`;
        xml += ` x="${window.x}"`;
        xml += ` y="${window.y}"`;
        xml += ` width="${window.width}"`;
        xml += ` height="${window.height}"`;
        xml += ` params="${window.param}"`;
        xml += ` style="${window.style}"`;

        if(window.dynamicStyle) 
        {
            xml += ` dynamic_style="${escapeXml(window.dynamicStyle)}"`;
        }

        if(window.name) 
        {
            xml += ` name="${escapeXml(window.name)}"`;
        }

        if(window.caption) 
        {
            xml += ` caption="${escapeXml(window.caption)}"`;
        }

        if(window.id !== 0) 
        {
            xml += ` id="${window.id}"`;
        }

        if(window.color !== 0x00FFFFFF) 
        {
            xml += ` color="0x${window.alpha.toString(16)}${window.color.toString(16)}"`;
        }

        if(window.blend !== 1) 
        {
            xml += ` blend="${window.blend}"`;
        }

        if(!window.visible) 
        {
            xml += ` visible="${window.visible}"`;
        }

        if(!window.clipping) 
        {
            xml += ` clipping="${window.clipping}"`;
        }

        if(window.background) 
        {
            xml += ` background="${window.background}"`;
        }

        if(window.mouseThreshold !== 10) 
        {
            xml += ` treshold="${window.mouseThreshold}"`;
        }

        if(window.tags.length > 0) 
        {
            xml += ` tags="${escapeXml(window.tags.join(','))}"`;
        }

        if(window.limits.minWidth > -2147483648) 
        {
            xml += ` width_min="${window.limits.minWidth}"`;
        }

        if(window.limits.maxWidth < 2147483647) 
        {
            xml += ` width_max="${window.limits.maxWidth}"`;
        }

        if(window.limits.minHeight > -2147483648) 
        {
            xml += ` height_min="${window.limits.minHeight}"`;
        }

        if(window.limits.maxHeight < 2147483647) 
        {
            xml += ` height_max="${window.limits.maxHeight}"`;
        }

        xml += '>\r';

        if(window.filters && window.filters.length > 0) 
        {
            xml += '\t<filters>\r';

            for(const filter of window.filters) 
            {
                const serialized = this.filterToXMLString(filter);

                if(serialized) 
                {
                    xml += `\t\t${serialized}\r`;
                }
            }

            xml += '\t</filters>\r';
        }

        const childrenXml = this.serializeChildren(window);

        if(childrenXml.length > 0)
        {
            xml += `\t<children>\r${childrenXml}\t</children>\r`;
        }

        const properties = window.properties as PropertyStruct[] | null;

        if(properties && properties.length > 0)
        {
            let variablesXml = '\t<variables>\r';
            let hasValid = false;

            for(const property of properties)
            {
                if(property.valid)
                {
                    variablesXml += `\t\t${property.toXMLString()}\r`;
                    hasValid = true;
                }
            }

            variablesXml += '\t</variables>\r';

            if(hasValid)
            {
                xml += variablesXml;
            }
        }

        return `${xml}</${typeName}>\r`;
    }

    // AS3: .../src/com/sulake/core/window/utils/WindowParser.as::dispose()
    public dispose(): void 
    {
        if(!this._disposed) 
        {
            this._disposed = true;
        }
    }

    private parseWindowNodes(
        nodes: Element[],
        parent: IWindow | null,
        sharedVars: Map<string, unknown>,
        namedWindows: Map<string, IWindow> | null
    ): IWindow | null
    {
        let last: IWindow | null = null;

        for(const node of nodes) 
        {
            if(node.nodeName === 'children') 
            {
                for(const child of getDirectChildElements(node)) 
                {
                    const created = this.parseSingleWindowEntity(child, parent, sharedVars, namedWindows);

                    if(created) 
                    {
                        last = created;
                    }
                }

                continue;
            }

            if(node.nodeName === 'window') 
            {
                const created = this.parseAndConstruct(node, parent, namedWindows);

                if(created) 
                {
                    last = created;
                }

                continue;
            }

            const created = this.parseSingleWindowEntity(node, parent, sharedVars, namedWindows);

            if(created) 
            {
                last = created;
            }
        }

        return last;
    }

    // AS3: .../src/com/sulake/core/window/utils/WindowParser.as::parseSingleWindowEntity()
    private parseSingleWindowEntity(
        node: Element,
        parent: IWindow | null,
        sharedVars: Map<string, unknown>,
        namedWindows: Map<string, IWindow> | null
    ): IWindow | null
    {
        const resolvedType = TYPE_NAME_TO_CODE[node.nodeName];
        const typeId = resolvedType !== undefined ? resolvedType : WindowType.NULL;
        const defaultStyle = parent ? parent.style : 0;

        const name = decodeEscaped(String(this.parseAttribute(node, 'name', sharedVars, '')));
        const style = parseInteger(this.parseAttribute(node, 'style', sharedVars, String(defaultStyle)));
        const dynamicStyle = String(this.parseAttribute(node, 'dynamic_style', sharedVars, ''));
        let param = parseInteger(this.parseAttribute(node, 'params', sharedVars, '0'));
        const tagsText = decodeEscaped(String(this.parseAttribute(node, 'tags', sharedVars, '')));
        const x = parseNumber(this.parseAttribute(node, 'x', sharedVars, '0'));
        const y = parseNumber(this.parseAttribute(node, 'y', sharedVars, '0'));
        const width = parseNumber(this.parseAttribute(node, 'width', sharedVars, '0'));
        const height = parseNumber(this.parseAttribute(node, 'height', sharedVars, '0'));
        const visible = String(this.parseAttribute(node, 'visible', sharedVars, 'true')) === 'true';
        const id = parseInteger(this.parseAttribute(node, 'id', sharedVars, '0'));

        const paramsNode = getDirectChildByName(node, 'params');

        if(paramsNode) 
        {
            for(const paramNode of getDirectChildElements(paramsNode)) 
            {
                const paramName = String(this.parseAttribute(paramNode, 'name', sharedVars, '')).toLowerCase();
                const mappedParam = PARAM_NAME_TO_FLAG[paramName];

                if(mappedParam === undefined) 
                {
                    throw new Error(`Unknown window parameter "${paramName}"!`);
                }

                param |= mappedParam;
            }
        }

        let caption = '';

        if((param & WindowParam.INHERIT_CAPTION) !== 0) 
        {
            caption = parent ? parent.caption : '';
        }

        caption = decodeEscaped(String(this.parseAttribute(node, 'caption', sharedVars, caption)));

        let tags: string[] | null = null;

        if(tagsText !== '') 
        {
            tags = tagsText.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0);
        }

        const variablesNode = getDirectChildByName(node, 'variables');
        const properties = this.parseProperties(variablesNode, sharedVars);
        const isInternalLayoutChild = tags !== null && tags.indexOf('_INTERNAL') !== -1;
        const listParent = parent as unknown as {
            addListItemAt?: (item: IWindow, index: number) => IWindow;
            addGridItemAt?: (item: IWindow, index: number) => IWindow;
            numGridItems?: number;
            numListItems?: number;
        } | null;
        // AS3 appends a layout child through the parent's IIterable iterator
        // (`iterator[iterator.length] = child`). That iterator is type-specific:
        // ItemListIterator routes to addListItemAt, ItemGridIterator routes to
        // addGridItemAt. A grid must therefore append cells via its grid logic
        // (columns), not as raw addListItemAt children - otherwise grid items land
        // as side-by-side columns instead of stacking (e.g. Club Center's
        // status_title / status_info). A null parent (the root of a buildFromXML() call - see
        // this class's constructor note) is never itself list/grid-appended.
        const parentIsItemGrid = !isInternalLayoutChild && typeof listParent?.addGridItemAt === 'function';
        const parentIsItemList = !isInternalLayoutChild
            && !parentIsItemGrid
            && typeof listParent?.addListItemAt === 'function';
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/WindowParser.as::parseSingleWindowEntity()
        // `param2 is IIterable` covers plain containers too, not just lists and grids:
        // ContainerController implements it (`get iterator` -> `new ContainerIterator(this)`),
        // so every container/frame child is created parentless and appended afterwards,
        // through `iterator[iterator.length] = child` -> `addChildAt(child, numChildren)`.
        //
        // That detour is what makes `set parent` a *real* parent change. Handing the container
        // to the constructor instead makes it a no-op - `attachToParent()` assigns `_parent`
        // itself (faithfully: AS3 line 140) and `addChild()`'s `child.parent = this` then finds
        // the value already there and returns early, so the setter body never runs: `_parentRect`
        // is never primed off the parent and WE_PARENT_ADDED is never fired. A window whose
        // `_parentRect` stays 0x0 consumes the parent's *entire* size as the delta the first time
        // an incremental relative-scale mode runs - which is how the alert dialog's button list,
        // centred horizontally and MOVE-anchored vertically, landed at y=232 inside a 151-tall
        // content area (the OK button drawn below the frame, i.e. invisible).
        const parentIsContainer = !isInternalLayoutChild
            && !parentIsItemGrid
            && !parentIsItemList
            && typeof (parent as unknown as { iterator?: unknown } | null)?.iterator === 'function';
        const parentIsIterable = parentIsItemList || parentIsItemGrid || parentIsContainer;

        // AS3: falls back to this parser's own constructor-injected context when there's no
        // parent to read `.context` off of (see this class's constructor note).
        const window = (parent ? parent.context : this._context).create(
            name,
            '',
            typeId,
            style,
            param,
            {x, y, width, height},
            null,
            parentIsIterable ? null : parent,
            id,
            tags,
            dynamicStyle,
            properties
        );

        if(!window) 
        {
            return null;
        }

        if(this.hasAttribute(node, 'width_min')) 
        {
            window.limits.minWidth = parseInteger(this.parseAttribute(node, 'width_min', sharedVars, String(window.limits.minWidth)));
        }

        if(this.hasAttribute(node, 'width_max')) 
        {
            window.limits.maxWidth = parseInteger(this.parseAttribute(node, 'width_max', sharedVars, String(window.limits.maxWidth)));
        }

        if(this.hasAttribute(node, 'height_min')) 
        {
            window.limits.minHeight = parseInteger(this.parseAttribute(node, 'height_min', sharedVars, String(window.limits.minHeight)));
        }

        if(this.hasAttribute(node, 'height_max')) 
        {
            window.limits.maxHeight = parseInteger(this.parseAttribute(node, 'height_max', sharedVars, String(window.limits.maxHeight)));
        }

        const limitFn = (window.limits as unknown as { limit?: () => void }).limit;

        if(typeof limitFn === 'function') 
        {
            limitFn.call(window.limits);
        }

        const background = String(this.parseAttribute(node, 'background', sharedVars, String(window.background))) === 'true';
        const blend = parseNumber(this.parseAttribute(node, 'blend', sharedVars, String(window.blend)));
        const clipping = String(this.parseAttribute(node, 'clipping', sharedVars, String(window.clipping))) === 'true';
        const colorRaw = String(this.parseAttribute(node, 'color', sharedVars, String(window.color)));
        const threshold = parseInteger(this.parseAttribute(node, 'treshold', sharedVars, String(window.mouseThreshold)));

        if(window.caption !== caption) 
        {
            window.caption = caption;
        }

        if(window.blend !== blend) 
        {
            window.blend = blend;
        }

        if(window.visible !== visible) 
        {
            window.visible = visible;
        }

        if(window.clipping !== clipping) 
        {
            window.clipping = clipping;
        }

        if(window.background !== background) 
        {
            window.background = background;
        }

        if(window.mouseThreshold !== threshold) 
        {
            window.mouseThreshold = threshold;
        }

        const color = parseColor(colorRaw);

        if(window.color !== color) 
        {
            window.color = color;
        }

        const filtersNode = getDirectChildByName(node, 'filters');

        if(filtersNode) 
        {
            const filters = this.parseFilters(filtersNode, sharedVars);

            if(filters.length > 0) 
            {
                window.filters = filters;
            }
        }

        if(window.type === WindowType.STATIC_BITMAP_WRAPPER) 
        {
            let assetUri: string | null = null;

            for(const property of properties) 
            {
                if(property.key === 'asset_uri' && typeof property.value === 'string') 
                {
                    assetUri = property.value;
                    break;
                }
            }

            if(assetUri) 
            {
                (window as unknown as IStaticBitmapWrapperWindow).assetUri = assetUri;
            }
        }

        if(parentIsIterable)
        {
            // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/WindowParser.as::parseAndConstruct()
            // Flash creates the child of any IIterable parent without a parent and appends it
            // through that parent's iterator. Internal layout children (_ITEMLIST/_SCROLLBAR) are
            // excluded above so ScrollableItemListWindow can build its own structure first.
            // This center-repositioning block applies to every IIterable (container, list, grid).
            if(window.x !== x || window.y !== y || window.width !== width || window.height !== height) 
            {
                if((param & WindowParam.RELATIVE_HORIZONTAL_SCALE_MASK) === WindowParam.RELATIVE_HORIZONTAL_SCALE_CENTER) 
                {
                    window.x = x;
                }

                if((param & WindowParam.RELATIVE_VERTICAL_SCALE_MASK) === WindowParam.RELATIVE_VERTICAL_SCALE_CENTER) 
                {
                    window.y = y;
                }
            }

            if(parentIsContainer)
            {
                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/iterators/ContainerIterator.as::setProperty()
                // `iterator[iterator.length] = child` on a ContainerIterator is
                // `addChildAt(child, numChildren)`. The iterator comes from the parent, and
                // FrameController's override hands out `content.iterator` once it is built - the
                // same redirect `getLayoutChildTarget()` already performs for the children loop,
                // so the resolved target is the container that receives the child either way.
                const target = parent!.getLayoutChildTarget() as unknown as {
                    addChildAt?: (child: IWindow, index: number) => IWindow;
                    addChild?: (child: IWindow) => IWindow;
                    numChildren?: number;
                };

                if(typeof target.addChildAt === 'function')
                {
                    target.addChildAt(window, target.numChildren ?? 0);
                }
                else
                {
                    // AS3 falls back to `param2.addChild(_loc29_)` when the parent hands out no
                    // iterator at all.
                    target.addChild?.(window);
                }
            }
            else if(parentIsItemGrid)
            {
                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/iterators/ItemGridIterator.as::setProperty()
                // The grid's iterator appends via `iterator[iterator.length] = child`, i.e.
                // addGridItemAt(child, numGridItems), placing the child into a column cell
                // (grid layout) rather than adding it as a raw list column.
                listParent.addGridItemAt!(window, listParent.numGridItems ?? 0);
            }
            else if(parentIsItemList)
            {
                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/iterators/ItemListIterator.as::setProperty()
                // Flash appends via `iterator[iterator.length] = child`, which the Proxy's
                // setProperty forwards to addListItemAt(child, index) - NOT addListItem(). That
                // matters: addListItemAt skips addListItem's manual running-height bookkeeping
                // and instead lets a single, full updateScrollAreaRegion() pass (with the child
                // already attached) compute the list's size, matching how the real client avoids
                // committing an under-built intermediate size mid-construction.
                listParent!.addListItemAt!(window, listParent!.numListItems ?? 0);
            }
        }

        if(namedWindows && name) 
        {
            namedWindows.set(name, window);
        }

        const childrenNode = getDirectChildByName(node, 'children');
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/WindowParser.as::parseAndConstruct()
        // setAutoRearrange(false) is only useful while children are being added, but the final
        // setAutoRearrange(true) is unconditional in AS3 - it runs on every BoxSizer, not just ones
        // with a <children> node.
        const boxSizer = window as unknown as IBoxSizerWindow;
        const isBoxSizer = typeof boxSizer.setAutoRearrange === 'function';

        if(childrenNode)
        {
            const childNodes = getDirectChildElements(childrenNode);
            const target = window.getLayoutChildTarget();

            if(isBoxSizer)
            {
                boxSizer.setAutoRearrange(false);
            }

            for(const childNode of childNodes)
            {
                this.parseSingleWindowEntity(childNode, target, sharedVars, namedWindows);
            }
        }

        if(isBoxSizer)
        {
            boxSizer.setAutoRearrange(true);
        }

        return window;
    }

    private resolveLayoutRoot(layout: XmlLayoutInput): Element | null 
    {
        if(layout instanceof Element) 
        {
            return layout;
        }

        if(layout instanceof Document) 
        {
            return layout.documentElement;
        }

        try 
        {
            const doc = platform().parseXml(layout);
            const parserError = doc.getElementsByTagName('parsererror');

            if(parserError.length > 0) 
            {
                throw new Error(parserError[0].textContent ?? 'Failed to parse XML');
            }

            return doc.documentElement;
        }
        catch (error) 
        {
            throw new Error(`WindowParser failed to parse XML layout: ${String(error)}`, {cause: error});
        }
    }

    private parseSharedVariables(variablesNode: Element): Map<string, unknown> 
    {
        const map = new Map<string, unknown>();

        for(const varNode of getDirectChildrenByName(variablesNode, 'var')) 
        {
            const parsed = this.parseVarNode(varNode, map);

            if(parsed.key.length > 0) 
            {
                map.set(parsed.key, parsed.value);
            }
        }

        return map;
    }

    // AS3: .../src/com/sulake/core/window/utils/WindowParser.as::parseProperties()
    private parseProperties(variablesNode: Element | null, sharedVars: Map<string, unknown>): PropertyStruct[] 
    {
        if(!variablesNode) 
        {
            return [];
        }

        const properties: PropertyStruct[] = [];

        for(const varNode of getDirectChildrenByName(variablesNode, 'var')) 
        {
            const parsed = this.parseVarNode(varNode, sharedVars);

            if(parsed.key.length > 0) 
            {
                properties.push(new PropertyStruct(parsed.key, parsed.value));
            }
        }

        return properties;
    }

    private parseVarNode(node: Element, sharedVars: Map<string, unknown>): IParsedVar 
    {
        const key = node.getAttribute('key') ?? node.getAttribute('name') ?? '';
        const type = node.getAttribute('type') ?? '';
        let value: unknown = node.getAttribute('value');
        const children = getDirectChildElements(node);

        if((value === null || value === undefined || value === '') && children.length > 0) 
        {
            let valueNode: Element | null = children[0];

            if(valueNode && valueNode.nodeName === 'value') 
            {
                const wrapped = getDirectChildElements(valueNode);
                valueNode = wrapped.length > 0 ? wrapped[0] : null;
            }

            if(valueNode) 
            {
                switch(valueNode.nodeName) 
                {
                    case 'Point':
                        value = this.parsePoint(valueNode);
                        break;
                    case 'Rectangle':
                        value = this.parseRectangle(valueNode);
                        break;
                    case 'Array':
                        value = getDirectChildrenByName(valueNode, 'var').map((child) => this.parseVarNode(child, sharedVars).value);
                        break;
                    case 'Map': {
                        const mapped: Record<string, unknown> = {};

                        for(const child of getDirectChildrenByName(valueNode, 'var')) 
                        {
                            const parsed = this.parseVarNode(child, sharedVars);
                            mapped[parsed.key] = parsed.value;
                        }

                        value = mapped;
                        break;
                    }
                }
            }
        }

        if(typeof value === 'string' && value.startsWith('$')) 
        {
            const resolved = sharedVars.get(value.slice(1));

            if(resolved !== undefined) 
            {
                value = resolved;
            }
        }

        return {
            key,
            value: castValue(value, type)
        };
    }

    private parsePoint(node: Element): { x: number; y: number } 
    {
        return {
            x: parseNumber(node.getAttribute('x')),
            y: parseNumber(node.getAttribute('y'))
        };
    }

    private parseRectangle(node: Element): { x: number; y: number; width: number; height: number } 
    {
        return {
            x: parseNumber(node.getAttribute('x')),
            y: parseNumber(node.getAttribute('y')),
            width: parseNumber(node.getAttribute('width')),
            height: parseNumber(node.getAttribute('height'))
        };
    }

    private parseFilters(filtersNode: Element, sharedVars: Map<string, unknown>): Record<string, unknown>[] 
    {
        const filters: Record<string, unknown>[] = [];

        for(const filterNode of getDirectChildElements(filtersNode)) 
        {
            const built = this.buildBitmapFilter(filterNode, sharedVars);

            if(built) 
            {
                filters.push(built);
            }
        }

        return filters;
    }

    // AS3: .../src/com/sulake/core/window/utils/WindowParser.as::buildBitmapFilter()
    private buildBitmapFilter(filterNode: Element, sharedVars: Map<string, unknown>): Record<string, unknown> | null 
    {
        if(filterNode.nodeName !== 'DropShadowFilter') 
        {
            return null;
        }

        return {
            type: 'DropShadowFilter',
            distance: parseNumber(this.parseAttribute(filterNode, 'distance', sharedVars, '0')),
            angle: parseNumber(this.parseAttribute(filterNode, 'angle', sharedVars, '45')),
            color: parseColor(String(this.parseAttribute(filterNode, 'color', sharedVars, '0'))),
            alpha: parseNumber(this.parseAttribute(filterNode, 'alpha', sharedVars, '1')),
            blurX: parseNumber(this.parseAttribute(filterNode, 'blurX', sharedVars, '0')),
            blurY: parseNumber(this.parseAttribute(filterNode, 'blurY', sharedVars, '0')),
            strength: parseNumber(this.parseAttribute(filterNode, 'strength', sharedVars, '1')),
            quality: parseInteger(this.parseAttribute(filterNode, 'quality', sharedVars, '1')),
            inner: String(this.parseAttribute(filterNode, 'inner', sharedVars, 'false')) === 'true',
            knockout: String(this.parseAttribute(filterNode, 'knockout', sharedVars, 'false')) === 'true',
            hideObject: String(this.parseAttribute(filterNode, 'hideObject', sharedVars, 'false')) === 'true'
        };
    }

    private filterToXMLString(filter: unknown): string 
    {
        if(!filter || typeof filter !== 'object') 
        {
            return '';
        }

        const data = filter as Record<string, unknown>;

        if(data.type !== 'DropShadowFilter') 
        {
            return '';
        }

        let xml = '<DropShadowFilter';
        xml += data.distance !== 0 ? ` distance="${data.distance}"` : '';
        xml += data.angle !== 45 ? ` angle="${data.angle}"` : '';
        xml += data.color !== 0 ? ` color="${data.color}"` : '';
        xml += data.alpha !== 1 ? ` alpha="${data.alpha}"` : '';
        xml += data.blurX !== 0 ? ` blurX="${data.blurX}"` : '';
        xml += data.blurY !== 0 ? ` blurY="${data.blurY}"` : '';
        xml += data.strength !== 1 ? ` strength="${data.strength}"` : '';
        xml += data.quality !== 1 ? ` quality="${data.quality}"` : '';
        xml += data.inner === true ? ` inner="${data.inner}"` : '';
        xml += data.knockout === true ? ` knockout="${data.knockout}"` : '';
        xml += data.hideObject === true ? ` hideObject="${data.hideObject}"` : '';
        xml += ' />';

        return xml;
    }

    /**
     * The children `windowToXMLString` emits, taken from the window's layout
     * child target rather than the window itself.
     *
     * AS3 branches on `window is IIterable`: an iterable window is walked through
     * `IIterable.get iterator`, which `FrameController` overrides to
     * `content.iterator`, `TabContextController` to `selector.iterator`, and so
     * on — this port's `getLayoutChildTarget()` is that same redirect one level
     * up (the target instead of an iterator over it), and the parse side already
     * goes through it. Only AS3's non-iterable `else` branch had been ported, so
     * a frame serialized its own chrome — all of which is `_EXCLUDE`-tagged —
     * and emitted no `<children>` at all: every frame-rooted layout round-tripped
     * to an empty `<frame/>`, its real content silently dropped.
     *
     * A list or grid target enumerates its *items*, not its raw children: AS3's
     * `ItemListController.iterator` is `new ItemListIterator(this)` and
     * `ItemGridController.iterator` is `new ItemGridIterator(this)`, both of
     * which walk the items. Reading `numChildren` there yields only the
     * `_EXCLUDE`-tagged `_container`, so an `itemlist`-rooted layout serialized
     * as empty exactly like a frame did — `furni_view` has three list items and
     * saved as one bare `<itemlist/>`. These three cases mirror the parse side's
     * own `parentIsContainer` / `parentIsItemList` / `parentIsItemGrid` branches.
     *
     * The `_EXCLUDE` filter stays: AS3 applies it on both branches, and it is
     * what skips excluded items sitting *inside* a content container.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/WindowParser.as::windowToXMLString()
    private serializeChildren(window: IWindow): string 
    {
        const target = window.getLayoutChildTarget() as unknown as {
            numChildren?: number;
            getChildAt?: (index: number) => IWindow | null;
            numListItems?: number;
            getListItemAt?: (index: number) => IWindow | null;
            numGridItems?: number;
            getGridItemAt?: (index: number) => IWindow | null;
        };

        let count = 0;
        let at: ((index: number) => IWindow | null) | null = null;

        if(typeof target.numListItems === 'number' && typeof target.getListItemAt === 'function') 
        {
            count = target.numListItems;
            at = target.getListItemAt.bind(target);
        }
        else if(typeof target.numGridItems === 'number' && typeof target.getGridItemAt === 'function') 
        {
            count = target.numGridItems;
            at = target.getGridItemAt.bind(target);
        }
        else if(typeof target.numChildren === 'number' && typeof target.getChildAt === 'function') 
        {
            count = target.numChildren;
            at = target.getChildAt.bind(target);
        }

        if(!at || count <= 0) 
        {
            return '';
        }

        let xml = '';

        for(let i = 0; i < count; i++) 
        {
            const child = at(i);

            if(!child) 
            {
                continue;
            }

            if(child.tags.indexOf(WindowParser.ELEMENT_TAG_EXCLUDE) !== -1) 
            {
                continue;
            }

            xml += this.windowToXMLString(child);
        }

        return xml;
    }

    // AS3: .../src/com/sulake/core/window/utils/WindowParser.as::parseAttribute()
    private parseAttribute(
        node: Element,
        name: string,
        sharedVars: Map<string, unknown>,
        defaultValue: unknown
    ): unknown 
    {
        if(!node.hasAttribute(name)) 
        {
            return defaultValue;
        }

        const raw = node.getAttribute(name);

        if(raw === null) 
        {
            return defaultValue;
        }

        if(raw.startsWith('$')) 
        {
            const key = raw.slice(1);
            const resolved = sharedVars.get(key);

            if(resolved !== undefined && resolved !== null) 
            {
                return resolved;
            }

            // ${key} localization references are resolved at render time — pass through
            return raw;
        }

        return raw;
    }

    // AS3: .../src/com/sulake/core/window/utils/WindowParser.as::hasAttribute()
    private hasAttribute(node: Element, name: string): boolean 
    {
        return node.hasAttribute(name);
    }
}

function getDirectChildElements(node: Element): Element[] 
{
    return Array.from(node.children);
}

function getDirectChildrenByName(node: Element, name: string): Element[] 
{
    return getDirectChildElements(node).filter((child) => child.nodeName === name);
}

function getDirectChildByName(node: Element, name: string): Element | null 
{
    const children = getDirectChildrenByName(node, name);

    return children.length > 0 ? children[0] : null;
}

function parseInteger(value: unknown): number 
{
    const parsed = Number.parseInt(String(value ?? '0'), 10);

    return Number.isFinite(parsed) ? parsed : 0;
}

function parseNumber(value: unknown): number 
{
    if(value === null || value === undefined) 
    {
        return 0;
    }

    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : 0;
}

function parseColor(value: string): number 
{
    if(!value) 
    {
        return 0;
    }

    if(value.length > 1 && value.charAt(1) === 'x') 
    {
        const parsedHex = Number.parseInt(value, 16);

        return Number.isFinite(parsedHex) ? (parsedHex >>> 0) : 0;
    }

    const parsed = Number.parseInt(value, 10);

    return Number.isFinite(parsed) ? (parsed >>> 0) : 0;
}

function castValue(value: unknown, type: string): unknown 
{
    switch(type.toLowerCase()) 
    {
        case 'boolean':
            return String(value).toLowerCase() === 'true';
        case 'int':
        case 'number':
            return parseNumber(value);
        case 'uint':
            return parseInteger(value) >>> 0;
        case 'hex': {
            const raw = String(value ?? '0');

            return Number.parseInt(raw.replace(/^0x/i, ''), 16) >>> 0;
        }
        case 'array':
            return String(value ?? '').split(',').map((entry) => entry.trim()).filter((entry) => entry.length > 0);
        default: {
            if(typeof value === 'string') 
            {
                return decodeEscaped(value);
            }

            return value;
        }
    }
}

function decodeEscaped(value: string): string 
{
    if(!value) 
    {
        return '';
    }

    let decoded = value;
    let previous = '';

    while(decoded !== previous) 
    {
        previous = decoded;

        try 
        {
            decoded = decodeURIComponent(decoded);
        }
        catch (_) 
        {
            break;
        }
    }

    return decoded;
}

function escapeXml(value: string): string 
{
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * Resolves `${key}` localization tokens in a string.
 *
 * **A token that does not resolve is left as it was written.** It used to collapse to the bare
 * key, and that is what put `wiredchests.withdraw` on a button: a window built before its texts
 * had downloaded — the wired chest's is built the moment its window manager arrives, long before
 * `onLocalizationComplete()` — read an empty table, baked the key into `_caption`, and nothing
 * ever asked again. Keeping the token lets `ButtonController.set caption()` hand it to the
 * `_CAPTION_TEXT` child, whose `TextLabelController.set text()` registers a localization listener
 * for exactly this case: the value is delivered when the texts land, and again on a language
 * change.
 *
 * A key genuinely absent from the texts now shows as `${key}` rather than `key` — the louder of
 * the two failures, and the one that says which it is.
 *
 * @param value - The string potentially containing `${key}` tokens
 * @returns The resolved string, with unresolved tokens left intact
 */
export function resolveLocalizationTokens(value: string): string
{
    if(!value || !WindowParser.localizationResolver)
    {
        return value;
    }

    return value.replace(/\$\{([^}]+)\}/g, (match, key) =>
    {
        const resolved = WindowParser.localizationResolver!(key);

        return resolved ?? match;
    });
}
