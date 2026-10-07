/**
 * ItemUpdateMessageParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.engine.ItemUpdateMessageEventParser
 *
 * Parser for updating a wall item position.
 */
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {FurnitureWallData} from '../../../incoming/room/engine/FurnitureWallData';
import {WallDataParser} from './WallDataParser';

export class ItemUpdateMessageParser implements IMessageParser
{
    private _data: FurnitureWallData | null = null;

    get data(): FurnitureWallData | null
    {
        if(this._data !== null)
        {
            this._data.setReadOnly();
        }
        return this._data;
    }

    flush(): boolean
    {
        this._data = null;
        return true;
    }

    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper === null)
        {
            return false;
        }

        this._data = WallDataParser.parseItemData(wrapper);

        return true;
    }
}
