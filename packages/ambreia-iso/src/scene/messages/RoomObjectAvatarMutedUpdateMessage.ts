/**
 * RoomObjectAvatarMutedUpdateMessage
 *
 * Based on AS3: com.sulake.habbo.room.messages.RoomObjectAvatarMutedUpdateMessage
 *
 * Update message for avatar muted state.
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';

export class RoomObjectAvatarMutedUpdateMessage extends RoomObjectUpdateMessage
{
    constructor(isMuted: boolean)
    {
        super(null, null);
        this._isMuted = isMuted;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectAvatarMutedUpdateMessage.as::_isMuted
    private _isMuted: boolean;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectAvatarMutedUpdateMessage.as::get isMuted()
    get isMuted(): boolean
    {
        return this._isMuted;
    }
}
