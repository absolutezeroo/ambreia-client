import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';

/**
 * ObjectRemoveMultipleMessageParser — a bulk floor-furniture removal: the ids to dispose plus the id
 * of the user who picked them up.
 *
 * Name derived: fully obfuscated in AS3 (class `_SafeCls_3065`); named for its role.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2184/_SafeCls_3065.as
 */
export class ObjectRemoveMultipleMessageParser implements IMessageParser
{
    // AS3: _SafeCls_3065.as::_SafeStr_8282 (name derived: removed furniture ids)
    private _ids: number[] = [];

    // AS3: _SafeCls_3065.as::_SafeStr_8149 (name derived: picker id)
    private _pickerId: number = -1;

    // AS3: _SafeCls_3065.as::get ids()
    get ids(): number[]
    {
        return this._ids;
    }

    // AS3: _SafeCls_3065.as::get pickerId()
    get pickerId(): number
    {
        return this._pickerId;
    }

    // AS3: _SafeCls_3065.as::flush()
    flush(): boolean
    {
        this._ids = [];
        this._pickerId = -1;
        return true;
    }

    // AS3: _SafeCls_3065.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper == null)
        {
            return false;
        }

        const count = wrapper.readInt();
        this._ids = [];

        for(let i = 0; i < count; i++)
        {
            this._ids.push(wrapper.readInt());
        }

        this._pickerId = wrapper.readInt();
        return true;
    }
}
