/**
 * ItemRemoveMessageParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.engine.ItemRemoveMessageEventParser
 *
 * Parser for removing a wall item.
 */
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

export class ItemRemoveMessageParser implements IMessageParser
{
    private _itemId: number = 0;

    get itemId(): number
    {
        return this._itemId;
    }

    private _pickerId: number = -1;

    get pickerId(): number
    {
        return this._pickerId;
    }

    flush(): boolean
    {
        this._itemId = 0;
        this._pickerId = -1;
        return true;
    }

    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper === null)
        {
            return false;
        }

        this._itemId = parseInt(wrapper.readString(), 10);
        this._pickerId = wrapper.readInt();

        return true;
    }
}
