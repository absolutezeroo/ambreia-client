/**
 * RoomPlaneBitmapMask
 *
 * @see com.sulake.habbo.room.object.visualization.room.RoomPlaneBitmapMask
 *
 * Simple data object storing bitmap mask type and left/right side locations.
 */
export class RoomPlaneBitmapMask
{
    constructor(type: string, leftSideLoc: number, rightSideLoc: number)
    {
        this._type = type;
        this._leftSideLoc = leftSideLoc;
        this._rightSideLoc = rightSideLoc;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/RoomPlaneBitmapMask.as::_type
    private _type: string;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/RoomPlaneBitmapMask.as::get type()
    get type(): string
    {
        return this._type;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/RoomPlaneBitmapMask.as::_leftSideLoc
    private _leftSideLoc: number;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/RoomPlaneBitmapMask.as::get leftSideLoc()
    get leftSideLoc(): number
    {
        return this._leftSideLoc;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/RoomPlaneBitmapMask.as::_rightSideLoc
    private _rightSideLoc: number;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/RoomPlaneBitmapMask.as::get rightSideLoc()
    get rightSideLoc(): number
    {
        return this._rightSideLoc;
    }
}
