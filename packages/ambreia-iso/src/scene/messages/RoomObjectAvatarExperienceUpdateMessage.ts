/**
 * RoomObjectAvatarExperienceUpdateMessage
 *
 * Based on AS3: com.sulake.habbo.room.messages.RoomObjectAvatarExperienceUpdateMessage
 *
 * Update message for pet experience gain.
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';

export class RoomObjectAvatarExperienceUpdateMessage extends RoomObjectUpdateMessage
{
    constructor(gainedExperience: number)
    {
        super(null, null);
        this._gainedExperience = gainedExperience;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectAvatarExperienceUpdateMessage.as::_gainedExperience
    private _gainedExperience: number;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectAvatarExperienceUpdateMessage.as::get gainedExperience()
    get gainedExperience(): number
    {
        return this._gainedExperience;
    }
}
