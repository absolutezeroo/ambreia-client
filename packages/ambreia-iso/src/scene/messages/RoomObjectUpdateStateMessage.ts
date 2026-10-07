/**
 * RoomObjectUpdateStateMessage
 *
 * Based on AS3: com.sulake.habbo.room.messages.RoomObjectUpdateStateMessage
 *
 * Simple update message that signals a state change.
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';

export class RoomObjectUpdateStateMessage extends RoomObjectUpdateMessage
{
    constructor()
    {
        super(null, null);
    }
}
