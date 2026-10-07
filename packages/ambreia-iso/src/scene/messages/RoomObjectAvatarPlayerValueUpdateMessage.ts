/**
 * RoomObjectAvatarPlayerValueUpdateMessage
 *
 * Based on AS3: com.sulake.habbo.room.messages.RoomObjectAvatarPlayerValueUpdateMessage
 *
 * Update message for avatar player value (game score, etc.).
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';

export class RoomObjectAvatarPlayerValueUpdateMessage extends RoomObjectUpdateMessage
{
    constructor(value: number)
    {
        super(null, null);
        this._value = value;
    }

    // AS3: sources/win63_version/habbo/room/messages/RoomObjectAvatarPlayerValueUpdateMessage.as::_value
    private _value: number;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectAvatarPlayerValueUpdateMessage.as::get value()
    get value(): number
    {
        return this._value;
    }
}
