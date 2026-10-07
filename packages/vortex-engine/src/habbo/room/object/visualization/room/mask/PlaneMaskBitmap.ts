/**
 * PlaneMaskBitmap
 *
 * @see com.sulake.habbo.room.object.visualization.room.mask.PlaneMaskBitmap
 *
 * Data object storing one bitmap mask with normalized coordinate bounds.
 */
import type {IGraphicAsset} from '@ambreia/common/graphics/IGraphicAsset';

export class PlaneMaskBitmap
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/mask/PlaneMaskBitmap.as::MIN_NORMAL_COORDINATE_VALUE
    public static readonly MIN_NORMAL_COORDINATE_VALUE: number = -1;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/mask/PlaneMaskBitmap.as::MAX_NORMAL_COORDINATE_VALUE
    public static readonly MAX_NORMAL_COORDINATE_VALUE: number = 1;

    constructor(
        asset: IGraphicAsset,
        normalMinX: number = -1,
        normalMaxX: number = 1,
        normalMinY: number = -1,
        normalMaxY: number = 1
    )
    {
        this._asset = asset;
        this._normalMinX = normalMinX;
        this._normalMaxX = normalMaxX;
        this._normalMinY = normalMinY;
        this._normalMaxY = normalMaxY;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/mask/PlaneMaskBitmap.as::_normalMinX
    private _normalMinX: number;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/mask/PlaneMaskBitmap.as::get normalMinX()
    get normalMinX(): number
    {
        return this._normalMinX;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/mask/PlaneMaskBitmap.as::_normalMaxX
    private _normalMaxX: number;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/mask/PlaneMaskBitmap.as::get normalMaxX()
    get normalMaxX(): number
    {
        return this._normalMaxX;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/mask/PlaneMaskBitmap.as::_normalMinY
    private _normalMinY: number;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/mask/PlaneMaskBitmap.as::get normalMinY()
    get normalMinY(): number
    {
        return this._normalMinY;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/mask/PlaneMaskBitmap.as::_normalMaxY
    private _normalMaxY: number;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/mask/PlaneMaskBitmap.as::get normalMaxY()
    get normalMaxY(): number
    {
        return this._normalMaxY;
    }

    // AS3: sources/win63_version/habbo/room/object/visualization/room/mask/PlaneMaskBitmap.as::_asset
    private _asset: IGraphicAsset | null;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/mask/PlaneMaskBitmap.as::get asset()
    get asset(): IGraphicAsset | null
    {
        return this._asset;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/mask/PlaneMaskBitmap.as::dispose()
    dispose(): void
    {
        this._asset = null;
    }
}
