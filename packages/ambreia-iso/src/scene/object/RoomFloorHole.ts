/**
 * RoomFloorHole
 *
 * Based on AS3: com.sulake.habbo.room.object.RoomFloorHole
 */
export class RoomFloorHole
{
    constructor(x: number, y: number, width: number, height: number)
    {
        this._x = x;
        this._y = y;
        this._width = width;
        this._height = height;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/RoomFloorHole.as::_x
    private _x: number;

    // AS3: .../src/com/sulake/habbo/room/object/RoomFloorHole.as::get x()
    get x(): number
    {
        return this._x;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/RoomFloorHole.as::_y
    private _y: number;

    // AS3: .../src/com/sulake/habbo/room/object/RoomFloorHole.as::get y()
    get y(): number
    {
        return this._y;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomFloorHole.as::_width
    private _width: number;

    // AS3: .../src/com/sulake/habbo/room/object/RoomFloorHole.as::get width()
    get width(): number
    {
        return this._width;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/RoomFloorHole.as::_height
    private _height: number;

    // AS3: .../src/com/sulake/habbo/room/object/RoomFloorHole.as::get height()
    get height(): number
    {
        return this._height;
    }
}
