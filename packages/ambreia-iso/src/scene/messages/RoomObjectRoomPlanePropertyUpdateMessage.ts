/**
 * RoomObjectRoomPlanePropertyUpdateMessage
 *
 * @see source_as_win63/habbo/room/messages/RoomObjectRoomPlanePropertyUpdateMessage.as
 *
 * Update message for room plane properties (wall/floor thickness).
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';

export class RoomObjectRoomPlanePropertyUpdateMessage extends RoomObjectUpdateMessage
{
    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomPlanePropertyUpdateMessage.as::WALL_THICKNESS
    public static readonly WALL_THICKNESS = 'RORPPUM_WALL_THICKNESS';
    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomPlanePropertyUpdateMessage.as::FLOOR_THICKNESS
    public static readonly FLOOR_THICKNESS = 'RORPVUM_FLOOR_THICKNESS';

    constructor(type: string, value: number)
    {
        super(null, null);
        this._type = type;
        this._value = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectRoomPlanePropertyUpdateMessage.as::_type
    private _type: string = '';

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomPlanePropertyUpdateMessage.as::get type()
    get type(): string
    {
        return this._type;
    }

    // AS3: sources/win63_version/habbo/room/messages/RoomObjectRoomPlanePropertyUpdateMessage.as::_value
    private _value: number = 0;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomPlanePropertyUpdateMessage.as::get value()
    get value(): number
    {
        return this._value;
    }
}
