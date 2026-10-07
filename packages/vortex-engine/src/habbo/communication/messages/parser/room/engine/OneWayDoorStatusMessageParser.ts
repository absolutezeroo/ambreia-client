import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';

/**
 * OneWayDoorStatusMessageParser — the current status of a one-way door (gate) furni: its id and the
 * status value that becomes the object's state. Drives FurnitureOneWayDoorLogic.
 *
 * Name derived: fully obfuscated in AS3 (class `_SafeCls_3016`); named for its role (its consumer is
 * the readable `onOneWayDoorStatus` handler).
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2942/_SafeCls_3016.as
 */
export class OneWayDoorStatusMessageParser implements IMessageParser
{
    // AS3: _SafeCls_3016.as::_SafeStr_4872 (name derived: furni id)
    private _id: number = -1;

    // AS3: _SafeCls_3016.as::_status
    private _status: number = 0;

    // AS3: _SafeCls_3016.as::get id()
    get id(): number
    {
        return this._id;
    }

    // AS3: _SafeCls_3016.as::get status()
    get status(): number
    {
        return this._status;
    }

    // AS3: _SafeCls_3016.as::flush()
    flush(): boolean
    {
        this._id = -1;
        this._status = 0;
        return true;
    }

    // AS3: _SafeCls_3016.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper == null)
        {
            return false;
        }

        this._id = wrapper.readInt();
        this._status = wrapper.readInt();
        return true;
    }
}
