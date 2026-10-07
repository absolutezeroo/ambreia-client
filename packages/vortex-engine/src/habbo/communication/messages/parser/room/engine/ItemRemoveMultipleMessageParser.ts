import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';

/**
 * ItemRemoveMultipleMessageParser — a bulk wall-item removal: the ids to dispose plus the id of the
 * user who picked them up.
 *
 * Name derived: fully obfuscated in AS3 (class `_SafeCls_3216`); named for its role.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2184/_SafeCls_3216.as
 */
export class ItemRemoveMultipleMessageParser implements IMessageParser
{
    // AS3: _SafeCls_3216.as::_SafeStr_7567 (name derived: removed wall-item ids)
    private _itemIds: number[] = [];

    // AS3: _SafeCls_3216.as::_SafeStr_8149 (name derived: picker id)
    private _pickerId: number = -1;

    // AS3: _SafeCls_3216.as::get itemIds()
    get itemIds(): number[]
    {
        return this._itemIds;
    }

    // AS3: _SafeCls_3216.as::get pickerId()
    get pickerId(): number
    {
        return this._pickerId;
    }

    // AS3: _SafeCls_3216.as::flush()
    flush(): boolean
    {
        this._itemIds = [];
        this._pickerId = -1;
        return true;
    }

    // AS3: _SafeCls_3216.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper == null)
        {
            return false;
        }

        const count = wrapper.readInt();
        this._itemIds = [];

        for(let i = 0; i < count; i++)
        {
            this._itemIds.push(wrapper.readInt());
        }

        this._pickerId = wrapper.readInt();
        return true;
    }
}
