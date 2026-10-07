import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';

/**
 * HanditemConfigurationMessageParser
 *
 * Four independent room toggles, each appended by a later server version: only the first is
 * guaranteed present, the rest are read one at a time while bytes remain.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_1744/_SafeCls_3235.as
 */
export class HanditemConfigurationMessageParser implements IMessageParser
{
    // AS3: _SafeCls_3235.as::_SafeStr_7688 (name recovered from `get isHanditemControlBlocked()`)
    private _isHanditemControlBlocked: boolean = false;

    // AS3: _SafeCls_3235.as::_SafeStr_8347 (name recovered from `get chooserDisabled()`)
    private _chooserDisabled: boolean = false;

    // AS3: _SafeCls_3235.as::_SafeStr_8164 (name recovered from `get freeFurniMovementsEnabled()`)
    private _freeFurniMovementsEnabled: boolean = false;

    // AS3: _SafeCls_3235.as::_SafeStr_8260 (name recovered from `get invisibleFurni()`)
    private _invisibleFurni: boolean = false;

    // AS3: _SafeCls_3235.as::get isHanditemControlBlocked()
    get isHanditemControlBlocked(): boolean
    {
        return this._isHanditemControlBlocked;
    }

    // AS3: _SafeCls_3235.as::get chooserDisabled()
    get chooserDisabled(): boolean
    {
        return this._chooserDisabled;
    }

    // AS3: _SafeCls_3235.as::get freeFurniMovementsEnabled()
    get freeFurniMovementsEnabled(): boolean
    {
        return this._freeFurniMovementsEnabled;
    }

    // AS3: _SafeCls_3235.as::get invisibleFurni()
    get invisibleFurni(): boolean
    {
        return this._invisibleFurni;
    }

    // AS3: _SafeCls_3235.as::flush()
    flush(): boolean
    {
        this._isHanditemControlBlocked = false;
        this._chooserDisabled = false;
        this._freeFurniMovementsEnabled = false;
        this._invisibleFurni = false;
        return true;
    }

    // AS3: _SafeCls_3235.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper)
        {
            return false;
        }

        // AS3 reads the first boolean unconditionally and guards each of the next three with its own
        // bytesAvailable check — an older server sends fewer fields and the rest stay false.
        this._isHanditemControlBlocked = wrapper.readBoolean();

        if(wrapper.bytesAvailable > 0)
        {
            this._chooserDisabled = wrapper.readBoolean();
        }

        if(wrapper.bytesAvailable > 0)
        {
            this._freeFurniMovementsEnabled = wrapper.readBoolean();
        }

        if(wrapper.bytesAvailable > 0)
        {
            this._invisibleFurni = wrapper.readBoolean();
        }

        return true;
    }
}
