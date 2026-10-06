import {MessageEvent} from '@core/communication/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@core/communication/messages/IMessageEvent';
import {SilverBalanceMessageParser} from '../../../parser/inventory/purse/SilverBalanceMessageParser';

/**
 * The player's silver balance (header 3727).
 *
 * AS3: sources/win63_version/habbo/communication/messages/incoming/collectibles/SilverBalanceMessageEvent.as
 * (obfuscated; `_SafeStr_4546[3727] = _SafeCls_2294` in the registry
 * sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/_SafeCls_2046.as, and
 * `HabboCatalog.as::onSilverBalance()` is its only handler. `vortex-emulator` sends it from
 * `GetSilverMessageHandler` and `PlayerWalletModule`.)
 */
export class SilverBalanceMessageEvent extends MessageEvent implements IMessageEvent
{
    // AS3: _SafeCls_2294.as::_SafeCls_2294()
    constructor(callback: MessageEventCallback)
    {
        super(callback, SilverBalanceMessageParser);
    }
}
