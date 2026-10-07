import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * How much longer this player stays muted, in seconds (header 2129). One int.
 *
 * Sent unprompted when the player tries to talk while muted, and again on entering a room they are
 * still muted in.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2918/_SafeCls_4260.as
 * (obfuscated; `secondsRemaining` keeps its real name, and
 * `RoomChatHandler.as::onRemainingMutePeriod()` is its only reader.)
 */
export class RemainingMutePeriodMessageParser implements IMessageParser
{
    // AS3: .../_SafeCls_4260.as::_SafeStr_10119 (name from `get secondsRemaining()`)
    private _secondsRemaining: number = 0;

    // AS3: .../_SafeCls_4260.as::get secondsRemaining()
    get secondsRemaining(): number
    {
        return this._secondsRemaining;
    }

    // AS3: .../_SafeCls_4260.as::flush()
    flush(): boolean
    {
        this._secondsRemaining = 0;

        return true;
    }

    // AS3: .../_SafeCls_4260.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._secondsRemaining = wrapper.readInt();

        return true;
    }
}
