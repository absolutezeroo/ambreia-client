/**
 * RoomObjectAvatarBlockedUpdateMessage
 *
 * Carries an avatar's blocked state to `AvatarLogic`, which stores it on the model as the
 * `blocked` variable. Produced by `RoomEngine.updateObjectUserBlocked()`, itself driven by
 * the `onBlockUserUpdate` room message.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/messages/RoomObjectAvatarBlockedUpdateMessage.as
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';

export class RoomObjectAvatarBlockedUpdateMessage extends RoomObjectUpdateMessage
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/messages/RoomObjectAvatarBlockedUpdateMessage.as::RoomObjectAvatarBlockedUpdateMessage()
    constructor(isBlocked: boolean)
    {
        super(null, null);
        this._isBlocked = isBlocked;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/messages/RoomObjectAvatarBlockedUpdateMessage.as::_isBlocked
    // Derived name: obfuscated in the primary tree; the accessor it backs is readable.
    private _isBlocked: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/messages/RoomObjectAvatarBlockedUpdateMessage.as::get isBlocked()
    get isBlocked(): boolean
    {
        return this._isBlocked;
    }
}
