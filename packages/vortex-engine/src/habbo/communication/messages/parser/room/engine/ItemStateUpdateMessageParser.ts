import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';

/**
 * ItemStateUpdateMessageParser — a single wall item's state change (WIN63 header 834). The server
 * only sends the raw item data string; the numeric state is derived from it client-side.
 *
 * Name derived: fully obfuscated in AS3 (class `_SafeCls_3716`); named after its readable consumer
 * `RoomMessageHandler.onItemStateUpdate`.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2184/_SafeCls_3716.as
 */
export class ItemStateUpdateMessageParser implements IMessageParser
{
    // AS3: _SafeCls_3716.as::_SafeStr_4872 (name recovered from `get id()`)
    private _id: number = 0;

    // AS3: _SafeCls_3716.as::_SafeStr_6597 (name recovered from `get itemData()`)
    private _itemData: string = '';

    // AS3: _SafeCls_3716.as::_SafeStr_4597 (name recovered from `get state()`)
    private _state: number = 0;

    // AS3: _SafeCls_3716.as::get id()
    get id(): number
    {
        return this._id;
    }

    // AS3: _SafeCls_3716.as::get itemData()
    get itemData(): string
    {
        return this._itemData;
    }

    // AS3: _SafeCls_3716.as::get state()
    get state(): number
    {
        return this._state;
    }

    // AS3: _SafeCls_3716.as::flush()
    flush(): boolean
    {
        this._id = 0;
        this._itemData = '';
        this._state = 0;
        return true;
    }

    // AS3: _SafeCls_3716.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper == null)
        {
            return false;
        }

        this._id = wrapper.readInt();
        this._itemData = wrapper.readString();
        this._state = 0;

        // AS3 guards the coercion with parseFloat(), then coerces with int() — two *different*
        // string→number conversions, and the mismatch is load-bearing. parseFloat("12abc") is 12
        // (guard passes) while AS3 int("12abc") is ToInt32(ToNumber("12abc")) = ToInt32(NaN) = 0,
        // so trailing-garbage data yields state 0, not 12. `Number(s) | 0` is exactly ToInt32∘
        // ToNumber, so this reproduces the quirk verbatim — do not "fix" it to parseFloat.
        const asFloat = parseFloat(this._itemData);

        if(!isNaN(asFloat))
        {
            this._state = Number(this._itemData) | 0;
        }

        return true;
    }
}
