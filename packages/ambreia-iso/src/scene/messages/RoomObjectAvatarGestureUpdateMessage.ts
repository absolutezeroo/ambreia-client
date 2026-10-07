/**
 * RoomObjectAvatarGestureUpdateMessage
 *
 * Based on AS3: com.sulake.habbo.room.messages.RoomObjectAvatarGestureUpdateMessage
 *
 * Update message for avatar gesture (wave, etc.).
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';

export class RoomObjectAvatarGestureUpdateMessage extends RoomObjectUpdateMessage
{
    constructor(gesture: number)
    {
        super(null, null);
        this._gesture = gesture;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectAvatarGestureUpdateMessage.as::_gesture
    private _gesture: number;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectAvatarGestureUpdateMessage.as::get gesture()
    get gesture(): number
    {
        return this._gesture;
    }
}
