/**
 * PlaneBitmapData
 *
 * Based on AS3: com.sulake.habbo.room.object.visualization.room.utils.PlaneBitmapData
 *
 * Wrapper for a rendered plane bitmap + timestamp.
 */
export class PlaneBitmapData
{
    constructor(bitmap: HTMLCanvasElement | null, timeStamp: number)
    {
        this._bitmap = bitmap;
        this._timeStamp = timeStamp;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/utils/PlaneBitmapData.as::_bitmap
    private _bitmap: HTMLCanvasElement | null;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/utils/PlaneBitmapData.as::get bitmap()
    get bitmap(): HTMLCanvasElement | null
    {
        return this._bitmap;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/utils/PlaneBitmapData.as::_timeStamp
    private _timeStamp: number;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/utils/PlaneBitmapData.as::get timeStamp()
    get timeStamp(): number
    {
        return this._timeStamp;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/utils/PlaneBitmapData.as::dispose()
    dispose(): void
    {
        this._bitmap = null;
    }
}
