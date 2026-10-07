/**
 * RoomObjectAvatarCarryObjectUpdateMessage
 *
 * Based on AS3: com.sulake.habbo.room.messages.RoomObjectAvatarCarryObjectUpdateMessage
 *
 * Update message for avatar carrying an object (drink, etc.).
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';

export class RoomObjectAvatarCarryObjectUpdateMessage extends RoomObjectUpdateMessage
{
    constructor(itemType: number)
    {
        super(null, null);
        this._itemType = itemType;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectAvatarCarryObjectUpdateMessage.as::_itemType
    private _itemType: number;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectAvatarCarryObjectUpdateMessage.as::get itemType()
    get itemType(): number
    {
        return this._itemType;
    }
}
