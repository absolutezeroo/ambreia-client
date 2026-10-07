import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {ItemDataUpdateMessageParser} from '../../../parser/room/engine/ItemDataUpdateMessageParser';

/**
 * ItemDataUpdateMessageEvent — a wall item's raw item data changed (WIN63 header 540, from the
 * registry `_SafeStr_4546[540] = _SafeCls_3547`). Consumed by RoomMessageHandler.onItemDataUpdate.
 *
 * Name derived: fully obfuscated in AS3 (class `_SafeCls_3547`); named after its readable consumer.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2102/_SafeCls_3547.as
 */
export class ItemDataUpdateMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, ItemDataUpdateMessageParser);
    }
}
