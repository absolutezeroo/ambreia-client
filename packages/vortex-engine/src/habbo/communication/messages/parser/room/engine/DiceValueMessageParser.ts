import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';

/**
 * DiceValueMessageParser — the rolled value of a dice furni: the furni id and the face value the
 * server settled on. Drives FurnitureDiceLogic's state.
 *
 * Name derived: fully obfuscated in AS3 (class `_SafeCls_2957`); named for its role (its consumer is
 * the readable `onDiceValue` handler).
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2942/_SafeCls_2957.as
 */
export class DiceValueMessageParser implements IMessageParser
{
    // AS3: _SafeCls_2957.as::_SafeStr_4872 (name derived: furni id)
    private _id: number = -1;

    // AS3: _SafeCls_2957.as::_SafeStr_4717 (name derived: rolled value)
    private _value: number = 0;

    // AS3: _SafeCls_2957.as::get id()
    get id(): number
    {
        return this._id;
    }

    // AS3: _SafeCls_2957.as::get value()
    get value(): number
    {
        return this._value;
    }

    // AS3: _SafeCls_2957.as::flush()
    flush(): boolean
    {
        this._id = -1;
        this._value = 0;
        return true;
    }

    // AS3: _SafeCls_2957.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper == null)
        {
            return false;
        }

        this._id = wrapper.readInt();
        this._value = wrapper.readInt();
        return true;
    }
}
