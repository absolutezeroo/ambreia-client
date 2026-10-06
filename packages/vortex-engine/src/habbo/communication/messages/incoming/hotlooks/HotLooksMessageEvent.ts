import {MessageEvent} from '@core/communication/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@core/communication/messages/IMessageEvent';
import {HotLooksMessageParser} from '../../parser/hotlooks/HotLooksMessageParser';

/**
 * The hotel's featured looks, pushed in answer to `GetHotLooksMessageComposer`.
 *
 * Header **3853**, from WIN63's registry (`_SafeStr_4546[3853] = _SafeCls_2812`); the emulator corroborates it as `HotLooksMessageComposer`, which is where the name comes from. Class
 * name DERIVED — the AS3 event class is obfuscated and exists in no other tree.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2813/_SafeCls_2812.as
 */
export class HotLooksMessageEvent extends MessageEvent implements IMessageEvent
{
    // AS3: .../src/unknowns/_SafePkg_2813/_SafeCls_2812.as::_SafeCls_2812()
    constructor(callback: MessageEventCallback)
    {
        super(callback, HotLooksMessageParser);
    }
}
