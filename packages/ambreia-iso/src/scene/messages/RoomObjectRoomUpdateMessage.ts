/**
 * RoomObjectRoomUpdateMessage
 *
 * @see source_as_win63/habbo/room/messages/RoomObjectRoomUpdateMessage.as
 *
 * Update message for room wall/floor/landscape texture changes.
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';

export class RoomObjectRoomUpdateMessage extends RoomObjectUpdateMessage
{
    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomUpdateMessage.as::ROOM_WALL_UPDATE
    public static readonly ROOM_WALL_UPDATE = 'RORUM_ROOM_WALL_UPDATE';
    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomUpdateMessage.as::ROOM_FLOOR_UPDATE
    public static readonly ROOM_FLOOR_UPDATE = 'RORUM_ROOM_FLOOR_UPDATE';
    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomUpdateMessage.as::ROOM_LANDSCAPE_UPDATE
    public static readonly ROOM_LANDSCAPE_UPDATE = 'RORUM_ROOM_LANDSCAPE_UPDATE';

    constructor(type: string, value: string)
    {
        super(null, null);
        this._type = type;
        this._value = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectRoomUpdateMessage.as::_type
    private _type: string = '';

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomUpdateMessage.as::get type()
    get type(): string
    {
        return this._type;
    }

    // AS3: sources/win63_version/habbo/room/messages/RoomObjectRoomUpdateMessage.as::_value
    private _value: string = '';

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomUpdateMessage.as::get value()
    get value(): string
    {
        return this._value;
    }
}
