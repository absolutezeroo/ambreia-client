/**
 * RoomObjectAvatarOwnMessage
 *
 * Based on AS3: com.sulake.habbo.room.messages.RoomObjectAvatarOwnMessage
 *
 * Update message marking avatar as the current user's own avatar.
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';

export class RoomObjectAvatarOwnMessage extends RoomObjectUpdateMessage
{
    constructor()
    {
        super(null, null);
    }
}
