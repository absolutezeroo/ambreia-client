/**
 * RoomObjectRoomFloorHoleUpdateMessage
 *
 * @see source_as_win63/habbo/room/messages/RoomObjectRoomFloorHoleUpdateMessage.as
 *
 * Update message for floor hole additions and removals.
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';

export class RoomObjectRoomFloorHoleUpdateMessage extends RoomObjectUpdateMessage
{
    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomFloorHoleUpdateMessage.as::ADD_HOLE
    public static readonly ADD_HOLE = 'RORPFHUM_ADD';
    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomFloorHoleUpdateMessage.as::REMOVE_HOLE
    public static readonly REMOVE_HOLE = 'RORPFHUM_REMOVE';

    constructor(
        type: string,
        id: number,
        x: number = 0,
        y: number = 0,
        width: number = 0,
        height: number = 0,
        invert: boolean = false
    )
    {
        super(null, null);
        this._type = type;
        this._id = id;
        this._x = x;
        this._y = y;
        this._width = width;
        this._height = height;
        this._invert = invert;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectRoomFloorHoleUpdateMessage.as::_type
    private _type: string = '';

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomFloorHoleUpdateMessage.as::get type()
    get type(): string
    {
        return this._type;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectRoomFloorHoleUpdateMessage.as::_id
    private _id: number;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomFloorHoleUpdateMessage.as::get id()
    get id(): number
    {
        return this._id;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectRoomFloorHoleUpdateMessage.as::_x
    private _x: number;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomFloorHoleUpdateMessage.as::get x()
    get x(): number
    {
        return this._x;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectRoomFloorHoleUpdateMessage.as::_y
    private _y: number;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomFloorHoleUpdateMessage.as::get y()
    get y(): number
    {
        return this._y;
    }

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomFloorHoleUpdateMessage.as::_width
    private _width: number;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomFloorHoleUpdateMessage.as::get width()
    get width(): number
    {
        return this._width;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectRoomFloorHoleUpdateMessage.as::_height
    private _height: number;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomFloorHoleUpdateMessage.as::get height()
    get height(): number
    {
        return this._height;
    }

    private _invert: boolean;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomFloorHoleUpdateMessage.as::get invert()
    get invert(): boolean
    {
        return this._invert;
    }
}
