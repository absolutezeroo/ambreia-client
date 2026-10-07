/**
 * RoomObjectAvatarSleepUpdateMessage
 *
 * Based on AS3: com.sulake.habbo.room.messages.RoomObjectAvatarSleepUpdateMessage
 *
 * Update message for avatar sleep state.
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';

export class RoomObjectAvatarSleepUpdateMessage extends RoomObjectUpdateMessage
{
    constructor(isSleeping: boolean)
    {
        super(null, null);
        this._isSleeping = isSleeping;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectAvatarSleepUpdateMessage.as::_isSleeping
    private _isSleeping: boolean;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectAvatarSleepUpdateMessage.as::get isSleeping()
    get isSleeping(): boolean
    {
        return this._isSleeping;
    }
}
