/**
 * RoomObjectItemDataUpdateMessage
 *
 * @see source_as_win63/habbo/room/messages/RoomObjectItemDataUpdateMessage.as
 *
 * Update message for item data (e.g. stickie content).
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';

export class RoomObjectItemDataUpdateMessage extends RoomObjectUpdateMessage
{
    constructor(itemData: string)
    {
        super(null, null);
        this._itemData = itemData;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectItemDataUpdateMessage.as::_itemData
    private _itemData: string;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectItemDataUpdateMessage.as::get itemData()
    get itemData(): string
    {
        return this._itemData;
    }
}
