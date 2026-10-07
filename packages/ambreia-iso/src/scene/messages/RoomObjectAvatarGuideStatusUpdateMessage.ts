/**
 * RoomObjectAvatarGuideStatusUpdateMessage
 *
 * Based on AS3: com.sulake.habbo.room.messages.RoomObjectAvatarGuideStatusUpdateMessage
 *
 * Update message for avatar guide status.
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';

export class RoomObjectAvatarGuideStatusUpdateMessage extends RoomObjectUpdateMessage
{
    constructor(guideStatus: number)
    {
        super(null, null);
        this._guideStatus = guideStatus;
    }

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectAvatarGuideStatusUpdateMessage.as::_guideStatus
    private _guideStatus: number;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectAvatarGuideStatusUpdateMessage.as::get guideStatus()
    get guideStatus(): number
    {
        return this._guideStatus;
    }
}
