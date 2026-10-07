/**
 * RoomObjectAvatarChatUpdateMessage
 *
 * Based on AS3: com.sulake.habbo.room.messages.RoomObjectAvatarChatUpdateMessage
 *
 * Update message for avatar chat (triggers talk animation).
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';

export class RoomObjectAvatarChatUpdateMessage extends RoomObjectUpdateMessage
{
    constructor(numberOfWords: number)
    {
        super(null, null);
        this._numberOfWords = numberOfWords;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectAvatarChatUpdateMessage.as::_numberOfWords
    private _numberOfWords: number;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectAvatarChatUpdateMessage.as::get numberOfWords()
    get numberOfWords(): number
    {
        return this._numberOfWords;
    }
}
