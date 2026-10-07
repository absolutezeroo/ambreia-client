import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {ItemRemoveMultipleMessageParser} from '@habbo/communication/messages/parser/room/engine/ItemRemoveMultipleMessageParser';

/**
 * ItemRemoveMultipleMessageEvent — incoming bulk wall-item removal (WIN63 header 254, from the registry
 * `_SafeStr_4546[254] = _SafeCls_2465`).
 *
 * Name derived: fully obfuscated in AS3 (class `_SafeCls_2465`); named for its role.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2102/_SafeCls_2465.as
 */
export class ItemRemoveMultipleMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, ItemRemoveMultipleMessageParser);
    }
}
