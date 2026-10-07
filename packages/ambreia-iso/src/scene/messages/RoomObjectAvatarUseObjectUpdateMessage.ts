/**
 * RoomObjectAvatarUseObjectUpdateMessage
 *
 * Based on AS3: com.sulake.habbo.room.messages.RoomObjectAvatarUseObjectUpdateMessage
 *
 * Update message for avatar using a carried object.
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';

export class RoomObjectAvatarUseObjectUpdateMessage extends RoomObjectUpdateMessage
{
    constructor(itemType: number)
    {
        super(null, null);
        this._itemType = itemType;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectAvatarUseObjectUpdateMessage.as::_itemType
    private _itemType: number;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectAvatarUseObjectUpdateMessage.as::get itemType()
    get itemType(): number
    {
        return this._itemType;
    }
}
