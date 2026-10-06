import type {IMessageParser} from '@core/communication/messages/IMessageParser';
import type {IMessageDataWrapper} from '@core/communication/messages/IMessageDataWrapper';

/**
 * The player's silver balance (header 3727). One int.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/messages/parser/collectibles/_SafeCls_2074.as
 * (obfuscated; `silverBalance` keeps its real name, which is what identifies it, and
 * `HabboCatalog.as::onSilverBalance()` is its only reader.)
 */
export class SilverBalanceMessageParser implements IMessageParser
{
    // AS3: .../parser/collectibles/_SafeCls_2074.as::_SafeStr_7998 (name from `get silverBalance()`)
    private _silverBalance: number = 0;

    // AS3: .../parser/collectibles/_SafeCls_2074.as::get silverBalance()
    get silverBalance(): number
    {
        return this._silverBalance;
    }

    // AS3: .../parser/collectibles/_SafeCls_2074.as::flush()
    flush(): boolean
    {
        this._silverBalance = 0;

        return true;
    }

    // AS3: .../parser/collectibles/_SafeCls_2074.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._silverBalance = wrapper.readInt();

        return true;
    }
}
