/**
 * PlaneTextureBitmap
 *
 * Based on AS3: com.sulake.habbo.room.object.visualization.room.rasterizer.basic.PlaneTextureBitmap
 *
 * Holds a single bitmap texture with normal range constraints.
 */
export class PlaneTextureBitmap
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneTextureBitmap.as::MIN_NORMAL_COORDINATE_VALUE
    public static readonly MIN_NORMAL_COORDINATE_VALUE: number = -1;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneTextureBitmap.as::MAX_NORMAL_COORDINATE_VALUE
    public static readonly MAX_NORMAL_COORDINATE_VALUE: number = 1;

    constructor(
        bitmap: HTMLCanvasElement,
        normalMinX: number = -1,
        normalMaxX: number = 1,
        normalMinY: number = -1,
        normalMaxY: number = 1,
        assetName: string | null = null
    )
    {
        this._bitmap = bitmap;
        this._normalMinX = normalMinX;
        this._normalMaxX = normalMaxX;
        this._normalMinY = normalMinY;
        this._normalMaxY = normalMaxY;
        this._assetName = assetName;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneTextureBitmap.as::_bitmap
    private _bitmap: HTMLCanvasElement;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneTextureBitmap.as::get bitmap()
    get bitmap(): HTMLCanvasElement
    {
        return this._bitmap;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneTextureBitmap.as::_normalMinX
    private _normalMinX: number;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneTextureBitmap.as::get normalMinX()
    get normalMinX(): number
    {
        return this._normalMinX;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneTextureBitmap.as::_normalMaxX
    private _normalMaxX: number;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneTextureBitmap.as::get normalMaxX()
    get normalMaxX(): number
    {
        return this._normalMaxX;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneTextureBitmap.as::_normalMinY
    private _normalMinY: number;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneTextureBitmap.as::get normalMinY()
    get normalMinY(): number
    {
        return this._normalMinY;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneTextureBitmap.as::_normalMaxY
    private _normalMaxY: number;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneTextureBitmap.as::get normalMaxY()
    get normalMaxY(): number
    {
        return this._normalMaxY;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneTextureBitmap.as::_assetName
    private _assetName: string | null;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneTextureBitmap.as::get assetName()
    get assetName(): string | null
    {
        return this._assetName;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneTextureBitmap.as::dispose()
    dispose(): void
    {
        // Canvas will be GC'd
    }
}
