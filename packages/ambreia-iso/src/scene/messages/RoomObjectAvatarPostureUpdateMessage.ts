/**
 * RoomObjectAvatarPostureUpdateMessage
 *
 * Based on AS3: com.sulake.habbo.room.messages.RoomObjectAvatarPostureUpdateMessage
 *
 * Update message for avatar posture (sit, lay, std, etc.).
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';

export class RoomObjectAvatarPostureUpdateMessage extends RoomObjectUpdateMessage
{
    constructor(postureType: string, parameter: string = '')
    {
        super(null, null);
        this._postureType = postureType;
        this._parameter = parameter;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectAvatarPostureUpdateMessage.as::_postureType
    private _postureType: string;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectAvatarPostureUpdateMessage.as::get postureType()
    get postureType(): string
    {
        return this._postureType;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectAvatarPostureUpdateMessage.as::_parameter
    private _parameter: string;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectAvatarPostureUpdateMessage.as::get parameter()
    get parameter(): string
    {
        return this._parameter;
    }
}
