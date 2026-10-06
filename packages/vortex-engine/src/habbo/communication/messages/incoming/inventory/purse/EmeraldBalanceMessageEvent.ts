import {MessageEvent} from '@core/communication/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@core/communication/messages/IMessageEvent';
import {EmeraldBalanceMessageParser} from '../../../parser/inventory/purse/EmeraldBalanceMessageParser';

/**
 * The player's emerald balance (header 583).
 *
 * AS3: sources/win63_version/habbo/communication/messages/incoming/collectibles/EmeraldBalanceMessageEvent.as
 * (obfuscated; `_SafeStr_4546[583] = _SafeCls_2126` in the registry
 * sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/_SafeCls_2046.as, and
 * `HabboCatalog.as::onEmeraldBalance()` is its only handler. `vortex-emulator` sends it from
 * `GetNftCreditsMessageHandler` and `PlayerWalletModule`.)
 */
export class EmeraldBalanceMessageEvent extends MessageEvent implements IMessageEvent
{
    // AS3: _SafeCls_2126.as::_SafeCls_2126()
    constructor(callback: MessageEventCallback)
    {
        super(callback, EmeraldBalanceMessageParser);
    }
}
