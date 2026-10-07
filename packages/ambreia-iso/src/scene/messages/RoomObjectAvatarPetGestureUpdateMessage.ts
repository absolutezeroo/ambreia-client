/**
 * RoomObjectAvatarPetGestureUpdateMessage
 *
 * Based on AS3: com.sulake.habbo.room.messages.RoomObjectAvatarPetGestureUpdateMessage
 *
 * Update message for pet gesture.
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';

export class RoomObjectAvatarPetGestureUpdateMessage extends RoomObjectUpdateMessage
{
    constructor(gesture: string)
    {
        super(null, null);
        this._gesture = gesture;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectAvatarPetGestureUpdateMessage.as::_gesture
    private _gesture: string;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectAvatarPetGestureUpdateMessage.as::get gesture()
    get gesture(): string
    {
        return this._gesture;
    }
}
