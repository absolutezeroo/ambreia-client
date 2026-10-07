/**
 * RoomObjectAvatarSignUpdateMessage
 *
 * Based on AS3: com.sulake.habbo.room.messages.RoomObjectAvatarSignUpdateMessage
 *
 * Update message for avatar holding a sign.
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';

export class RoomObjectAvatarSignUpdateMessage extends RoomObjectUpdateMessage
{
    constructor(signType: number)
    {
        super(null, null);
        this._signType = signType;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectAvatarSignUpdateMessage.as::_signType
    private _signType: number;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectAvatarSignUpdateMessage.as::get signType()
    get signType(): number
    {
        return this._signType;
    }
}
