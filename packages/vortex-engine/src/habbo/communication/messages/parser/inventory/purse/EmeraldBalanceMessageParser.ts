import type {IMessageParser} from '@core/communication/messages/IMessageParser';
import type {IMessageDataWrapper} from '@core/communication/messages/IMessageDataWrapper';

/**
 * The player's emerald balance (header 583). One int.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/messages/parser/collectibles/_SafeCls_1841.as
 * (obfuscated; `emeraldBalance` keeps its real name, and `HabboCatalog.as::onEmeraldBalance()` is
 * its only reader.)
 */
export class EmeraldBalanceMessageParser implements IMessageParser
{
    // AS3: .../parser/collectibles/_SafeCls_1841.as::_SafeStr_7600 (name from `get emeraldBalance()`)
    private _emeraldBalance: number = 0;

    // AS3: .../parser/collectibles/_SafeCls_1841.as::get emeraldBalance()
    get emeraldBalance(): number
    {
        return this._emeraldBalance;
    }

    // AS3: .../parser/collectibles/_SafeCls_1841.as::flush()
    flush(): boolean
    {
        this._emeraldBalance = 0;

        return true;
    }

    // AS3: .../parser/collectibles/_SafeCls_1841.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._emeraldBalance = wrapper.readInt();

        return true;
    }
}
