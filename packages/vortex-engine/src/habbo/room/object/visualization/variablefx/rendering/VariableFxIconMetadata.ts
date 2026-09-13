import type {IVariableFxAssetProvider} from '../IVariableFxAssetProvider';
import {VariableFxIconDefinition} from './VariableFxIconDefinition';

/**
 * Turns an icon NAME from a config into the asset that draws it and the offset that places it.
 *
 * The asset name is built, not looked up: `variablefx_icon_` plus the name with dots turned into
 * underscores. The metadata file only supplies offsets, and an icon absent from it still resolves —
 * to its asset with a zero offset — because a missing offset is a placement problem, not a missing
 * icon.
 *
 * Class name derived: the AS3 class is obfuscated (`_SafeCls_4629`); its `METADATA_ASSET_NAME`
 * constant and `resolve()` are readable.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/rendering/_SafeCls_4629.as
 */
export class VariableFxIconMetadata
{
    // AS3: .../variablefx/rendering/_SafeCls_4629.as::METADATA_ASSET_NAME
    static readonly METADATA_ASSET_NAME: string = 'variablefx_icon_metadata';

    // AS3: .../variablefx/rendering/_SafeCls_4629.as::ICON_ASSET_PREFIX
    private static readonly ICON_ASSET_PREFIX: string = 'variablefx_icon_';

    // AS3: .../variablefx/rendering/_SafeCls_4629.as::resolve()
    static resolve(assetProvider: IVariableFxAssetProvider | null, name: string): VariableFxIconDefinition
    {
        const trimmed = VariableFxIconMetadata.trim(name);
        const metadata = VariableFxIconMetadata.resolveMetadata(assetProvider);
        const entry = metadata.get(trimmed) ?? null;

        return new VariableFxIconDefinition(
            trimmed,
            VariableFxIconMetadata.ICON_ASSET_PREFIX + trimmed.replace(/\./g, '_'),
            // AS3 reads `_loc5_?.offsetX` into an `int` parameter: absent becomes 0, and so does a
            // NaN from an unparseable attribute.
            entry?.offsetX ?? 0,
            entry?.offsetY ?? 0
        );
    }

    // AS3: .../variablefx/rendering/_SafeCls_4629.as::resolveMetadata()
    private static resolveMetadata(assetProvider: IVariableFxAssetProvider | null): Map<string, {offsetX: number; offsetY: number}>
    {
        const metadata = new Map<string, {offsetX: number; offsetY: number}>();
        const xml = assetProvider === null ? null : assetProvider.getXml(VariableFxIconMetadata.METADATA_ASSET_NAME);

        if(xml === null || xml.documentElement === null) return metadata;

        for(const child of Array.from(xml.documentElement.childNodes))
        {
            if(child.nodeType !== 1) continue;

            const node = child as Element;
            const name = VariableFxIconMetadata.trim(node.getAttribute('name') ?? '');

            if(name.length === 0) continue;

            metadata.set(name, {
                offsetX: VariableFxIconMetadata.parseOffset(node.getAttribute('x')),
                offsetY: VariableFxIconMetadata.parseOffset(node.getAttribute('y'))
            });
        }

        return metadata;
    }

    /** AS3's `parseInt` of a missing attribute is NaN, which its `int` parameter then makes 0. */
    // AS3: .../variablefx/rendering/_SafeCls_4629.as::resolveMetadata()
    private static parseOffset(value: string | null): number
    {
        const parsed = parseInt(value ?? '', 10);

        return Number.isFinite(parsed) ? parsed : 0;
    }

    // AS3: .../variablefx/rendering/_SafeCls_4629.as::trim()
    private static trim(value: string | null): string
    {
        return value === null ? '' : value.trim();
    }
}
