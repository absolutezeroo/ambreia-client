/**
 * RoomObjectVisibilityUpdateMessage
 *
 * @see source_as_win63/habbo/room/messages/RoomObjectVisibilityUpdateMessage.as
 *
 * Update message for object visibility changes.
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';

export class RoomObjectVisibilityUpdateMessage extends RoomObjectUpdateMessage
{
    public static readonly ENABLED = 'ROVUM_ENABLED';
    public static readonly DISABLED = 'ROVUM_DISABLED';

    constructor(type: string)
    {
        super(null, null);
        this._type = type;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectVisibilityUpdateMessage.as::_type
    private _type: string;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectVisibilityUpdateMessage.as::get type()
    get type(): string
    {
        return this._type;
    }
}
