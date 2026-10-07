import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';

/**
 * ItemDataUpdateMessageParser — a wall item's raw item data string changed (WIN63 header 540), e.g.
 * a stickie's text. Unlike every neighbouring parser the id arrives on the wire as a *string*.
 *
 * Name derived: fully obfuscated in AS3 (class `_SafeCls_2565`); named after its readable consumer
 * `RoomMessageHandler.onItemDataUpdate`.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2184/_SafeCls_2565.as
 */
export class ItemDataUpdateMessageParser implements IMessageParser
{
    // AS3: _SafeCls_2565.as::_SafeStr_4872 (name recovered from `get id()`)
    private _id: number = 0;

    // AS3: _SafeCls_2565.as::_SafeStr_6597 (name recovered from `get itemData()`)
    private _itemData: string = '';

    // AS3: _SafeCls_2565.as::get id()
    get id(): number
    {
        return this._id;
    }

    // AS3: _SafeCls_2565.as::get itemData()
    get itemData(): string
    {
        return this._itemData;
    }

    // AS3: _SafeCls_2565.as::flush()
    flush(): boolean
    {
        this._id = 0;
        this._itemData = '';
        return true;
    }

    // AS3: _SafeCls_2565.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper == null)
        {
            return false;
        }

        // The id is written as a string on the wire and coerced with AS3 int(), i.e.
        // ToInt32(ToNumber(s)) — `Number(s) | 0` reproduces it exactly (non-numeric → 0).
        const idString = wrapper.readString();
        this._id = Number(idString) | 0;
        this._itemData = wrapper.readString();
        return true;
    }
}
