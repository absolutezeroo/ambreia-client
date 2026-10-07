/**
 * ItemsMessageParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.engine.ItemsMessageEventParser
 *
 * Parser for room wall items (initial list).
 */
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {FurnitureWallData} from '../../../incoming/room/engine/FurnitureWallData';
import {WallDataParser} from './WallDataParser';

export class ItemsMessageParser implements IMessageParser
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/messages/parser/room/engine/ItemsMessageParser.as::_items
    private _items: FurnitureWallData[] = [];
    private _ownerMap: Map<number, string> = new Map();

    get itemCount(): number
    {
        return this._items.length;
    }

    getItem(index: number): FurnitureWallData | null
    {
        if(index < 0 || index >= this._items.length)
        {
            return null;
        }

        const data = this._items[index];

        if(data !== null)
        {
            data.setReadOnly();
        }

        return data;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/messages/parser/room/engine/ItemsMessageParser.as::flush()
    flush(): boolean
    {
        this._items.length = 0;
        return true;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/messages/parser/room/engine/ItemsMessageParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper === null)
        {
            return false;
        }

        this._items.length = 0;

        // Read owner name map (reuse field to avoid allocation)
        this._ownerMap.clear();
        const ownerMap = this._ownerMap;
        const ownerCount = wrapper.readInt();

        for(let i = 0; i < ownerCount; i++)
        {
            const ownerId = wrapper.readInt();
            const ownerName = wrapper.readString();
            ownerMap.set(ownerId, ownerName);
        }

        // Read items
        const itemCount = wrapper.readInt();

        for(let i = 0; i < itemCount; i++)
        {
            const data = WallDataParser.parseItemData(wrapper);
            data.ownerName = ownerMap.get(data.ownerId) ?? '';
            this._items.push(data);
        }

        return true;
    }
}
