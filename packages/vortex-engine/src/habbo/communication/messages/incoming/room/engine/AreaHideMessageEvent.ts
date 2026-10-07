import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {AreaHideMessageParser} from '@habbo/communication/messages/parser/room/engine/AreaHideMessageParser';

/**
 * AreaHideMessageEvent — an area-hide furni switched its zone on or off (WIN63 header 1131, from the
 * registry `_SafeStr_4546[1131] = _SafeCls_3881`). Consumed by RoomMessageHandler.onAreaHide.
 *
 * Name derived: fully obfuscated in AS3 (class `_SafeCls_3881`); named after the readable
 * AreaHideMessageData it carries.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2437/_SafeCls_3881.as
 */
export class AreaHideMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, AreaHideMessageParser);
    }
}
