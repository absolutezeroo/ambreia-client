/**
 * RoomPlaneMaskData
 *
 * Based on AS3: com.sulake.habbo.room.object.RoomPlaneMaskData
 */
export class RoomPlaneMaskData
{
    constructor(leftSideLoc: number, rightSideLoc: number, leftSideLength: number, rightSideLength: number)
    {
        this._leftSideLoc = leftSideLoc;
        this._rightSideLoc = rightSideLoc;
        this._leftSideLength = leftSideLength;
        this._rightSideLength = rightSideLength;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/RoomPlaneMaskData.as::_leftSideLoc
    private _leftSideLoc: number;

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneMaskData.as::get leftSideLoc()
    get leftSideLoc(): number
    {
        return this._leftSideLoc;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/RoomPlaneMaskData.as::_rightSideLoc
    private _rightSideLoc: number;

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneMaskData.as::get rightSideLoc()
    get rightSideLoc(): number
    {
        return this._rightSideLoc;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneMaskData.as::_leftSideLength
    private _leftSideLength: number;

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneMaskData.as::get leftSideLength()
    get leftSideLength(): number
    {
        return this._leftSideLength;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneMaskData.as::_rightSideLength
    private _rightSideLength: number;

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneMaskData.as::get rightSideLength()
    get rightSideLength(): number
    {
        return this._rightSideLength;
    }
}
