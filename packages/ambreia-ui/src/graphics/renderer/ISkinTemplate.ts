import type {IChildEntity} from '../../utils/IChildEntity';
import type {IChildEntityArray} from '../../utils/IChildEntityArray';

/**
 * A named atlas plus the regions cut out of it.
 *
 * AS3 types `asset` as the asset-library entry the atlas came from; the port
 * holds the decoded bitmap instead, so `SkinTemplate` exposes `atlas:
 * ImageBitmap` and does not declare `implements ISkinTemplate` — it also keeps
 * its entities in `entities`/`addEntity()` rather than the `IChildEntityArray`
 * contract. The interface is declared because AS3 has it and the skin parser is
 * typed against it.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ISkinTemplate.as
 */
export interface ISkinTemplate extends IChildEntityArray, IChildEntity
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ISkinTemplate.as::get asset()
    readonly asset: unknown;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ISkinTemplate.as::dispose()
    dispose(): void;
}
