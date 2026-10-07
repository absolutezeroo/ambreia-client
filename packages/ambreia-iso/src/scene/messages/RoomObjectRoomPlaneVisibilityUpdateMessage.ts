/**
 * RoomObjectRoomPlaneVisibilityUpdateMessage
 *
 * @see source_as_win63/habbo/room/messages/RoomObjectRoomPlaneVisibilityUpdateMessage.as
 *
 * Update message for room plane visibility (wall/floor visibility toggle).
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';

export class RoomObjectRoomPlaneVisibilityUpdateMessage extends RoomObjectUpdateMessage
{
    public static readonly WALL_VISIBILITY = 'RORPVUM_WALL_VISIBILITY';
    public static readonly FLOOR_VISIBILITY = 'RORPVUM_FLOOR_VISIBILITY';

    constructor(type: string, visible: boolean)
    {
        super(null, null);
        this._type = type;
        this._visible = visible;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectRoomPlaneVisibilityUpdateMessage.as::_type
    private _type: string = '';

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomPlaneVisibilityUpdateMessage.as::get type()
    get type(): string
    {
        return this._type;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectRoomPlaneVisibilityUpdateMessage.as::_visible
    private _visible: boolean = false;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomPlaneVisibilityUpdateMessage.as::get visible()
    get visible(): boolean
    {
        return this._visible;
    }
}
