/**
 * ItemStateUpdateData — one entry of the bulk wall-item state update (header 1787). Carries the
 * item id and its raw data string, and derives the numeric state from that string in the ctor.
 *
 * Name derived: fully obfuscated in AS3 (class `_SafeCls_3574`); named after the message it belongs
 * to (`RoomMessageHandler.onItemsStateUpdate`).
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2102/_SafeCls_3574.as
 */
export class ItemStateUpdateData
{
    // AS3: _SafeCls_3574.as::_SafeStr_4872 (name recovered from `get id()`)
    private _id: number = 0;

    // AS3: _SafeCls_3574.as::_SafeStr_6597 (name recovered from `get itemData()`)
    private _itemData: string;

    // AS3: _SafeCls_3574.as::_SafeStr_4597 (name recovered from `get state()`)
    private _state: number = 0;

    // AS3: _SafeCls_3574.as::_SafeCls_3574()
    constructor(id: number, itemData: string)
    {
        this._id = id;
        this._itemData = itemData;

        // Same two-conversion quirk as ItemStateUpdateMessageParser: parseFloat() guards, AS3 int()
        // converts. int("12abc") is ToInt32(NaN) = 0 even though parseFloat("12abc") is 12, so
        // `Number(s) | 0` — not parseFloat — is the faithful coercion. AS3 leaves _state at the int
        // default 0 when the guard fails.
        const asFloat = parseFloat(this._itemData);

        if(!isNaN(asFloat))
        {
            this._state = Number(this._itemData) | 0;
        }
    }

    // AS3: _SafeCls_3574.as::get id()
    get id(): number
    {
        return this._id;
    }

    // AS3: _SafeCls_3574.as::get itemData()
    get itemData(): string
    {
        return this._itemData;
    }

    // AS3: _SafeCls_3574.as::get state()
    get state(): number
    {
        return this._state;
    }
}
