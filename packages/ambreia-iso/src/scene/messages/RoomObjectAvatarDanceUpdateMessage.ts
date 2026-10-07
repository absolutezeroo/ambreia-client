/**
 * RoomObjectAvatarDanceUpdateMessage
 *
 * Based on AS3: com.sulake.habbo.room.messages.RoomObjectAvatarDanceUpdateMessage
 *
 * Update message for avatar dance style.
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';

export class RoomObjectAvatarDanceUpdateMessage extends RoomObjectUpdateMessage
{
    constructor(danceStyle: number)
    {
        super(null, null);
        this._danceStyle = danceStyle;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectAvatarDanceUpdateMessage.as::_danceStyle
    private _danceStyle: number;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectAvatarDanceUpdateMessage.as::get danceStyle()
    get danceStyle(): number
    {
        return this._danceStyle;
    }
}
