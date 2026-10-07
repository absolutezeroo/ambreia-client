import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import {ItemStateUpdateData} from '../../../incoming/room/engine/ItemStateUpdateData';

/**
 * ItemsStateUpdateMessageParser — bulk wall-item state update (WIN63 header 1787): a count followed
 * by (id, itemData) pairs, each wrapped in an ItemStateUpdateData that derives the numeric state.
 *
 * Name derived: fully obfuscated in AS3 (class `_SafeCls_3562`); named after its readable consumer
 * `RoomMessageHandler.onItemsStateUpdate`.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2184/_SafeCls_3562.as
 */
export class ItemsStateUpdateMessageParser implements IMessageParser
{
    // AS3: _SafeCls_3562.as::_items
    private _items: ItemStateUpdateData[] = [];

    // AS3: _SafeCls_3562.as::get itemCount()
    get itemCount(): number
    {
        return this._items.length;
    }

    // AS3: _SafeCls_3562.as::getItemData()
    getItemData(index: number): ItemStateUpdateData | null
    {
        if(index < 0 || index >= this.itemCount)
        {
            return null;
        }

        return this._items[index];
    }

    // AS3: _SafeCls_3562.as::flush()
    flush(): boolean
    {
        this._items = [];
        return true;
    }

    // AS3: _SafeCls_3562.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper == null)
        {
            return false;
        }

        const count = wrapper.readInt();

        for(let i = 0; i < count; i++)
        {
            const id = wrapper.readInt();
            const itemData = wrapper.readString();
            this._items.push(new ItemStateUpdateData(id, itemData));
        }

        return true;
    }
}
