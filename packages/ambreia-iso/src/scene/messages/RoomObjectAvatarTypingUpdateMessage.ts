/**
 * RoomObjectAvatarTypingUpdateMessage
 *
 * Based on AS3: com.sulake.habbo.room.messages.RoomObjectAvatarTypingUpdateMessage
 *
 * Update message for avatar typing indicator.
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';

export class RoomObjectAvatarTypingUpdateMessage extends RoomObjectUpdateMessage
{
    constructor(isTyping: boolean)
    {
        super(null, null);
        this._isTyping = isTyping;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectAvatarTypingUpdateMessage.as::_isTyping
    private _isTyping: boolean;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectAvatarTypingUpdateMessage.as::get isTyping()
    get isTyping(): boolean
    {
        return this._isTyping;
    }
}
