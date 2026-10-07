/**
 * RoomObjectAvatarFlatControlUpdateMessage
 *
 * Based on AS3: com.sulake.habbo.room.messages.RoomObjectAvatarFlatControlUpdateMessage
 *
 * Update message for avatar flat control level (room rights).
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';

export class RoomObjectAvatarFlatControlUpdateMessage extends RoomObjectUpdateMessage
{
    // AS3 passes `null` here from `onUserUpdate()`'s pre-loop reset — an AS3 String is
    // nullable, so the type has to be too. `AvatarLogic` parses it and falls to 0 on NaN,
    // which is how the marker clears.
    constructor(rawData: string | null)
    {
        super(null, null);
        this._rawData = rawData;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectAvatarFlatControlUpdateMessage.as::_rawData
    private _rawData: string | null;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectAvatarFlatControlUpdateMessage.as::get rawData()
    get rawData(): string | null
    {
        return this._rawData;
    }
}
