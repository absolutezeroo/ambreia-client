import {resolveVariableFxRendererById} from './VariableFxRendererType';

/** One row of `variablefx_renderer_mapping`. */
export interface IVariableFxRendererMapping
{
    renderer: string;
    rendererId: number;
    rendererClass: string;
}

/**
 * Reads `variablefx_renderer_mapping`, the server's renderer id → renderer class table.
 *
 * A row is kept only when its `name` matches what this client calls that id. That check is the
 * point of the parser: it means a mapping naming a renderer this build does not have — a newer
 * server, a rolled-back client — is dropped here, where it is harmless, instead of resolving to
 * the wrong renderer later.
 *
 * Class name derived: the AS3 class is obfuscated (`_SafeCls_3974`). Its one readable member is the
 * `ASSET_NAME` constant below.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/_SafeCls_3974.as
 */
export class VariableFxRendererMappingParser
{
    // AS3: .../variablefx/_SafeCls_3974.as::ASSET_NAME
    static readonly ASSET_NAME: string = 'variablefx_renderer_mapping';

    // AS3: .../variablefx/_SafeCls_3974.as::parse()
    static parse(xml: Document | null): IVariableFxRendererMapping[]
    {
        const mappings: IVariableFxRendererMapping[] = [];

        if(xml === null || xml.documentElement === null) return mappings;

        // childNodes filtered to elements, not `.children`: that is what AS3's `children()` means
        // here, and it works on any DOM implementation rather than only the browser's.
        for(const child of Array.from(xml.documentElement.childNodes))
        {
            if(child.nodeType !== 1) continue;

            const node = child as Element;

            const rendererId = parseInt(node.getAttribute('id') ?? '', 10);
            const name = node.getAttribute('name') ?? '';
            const rendererClass = node.getAttribute('rendererClass') ?? '';
            const known = resolveVariableFxRendererById(rendererId);

            if(known !== null && name === known && rendererClass.length > 0)
            {
                mappings.push({renderer: known, rendererId, rendererClass});
            }
        }

        return mappings;
    }
}
