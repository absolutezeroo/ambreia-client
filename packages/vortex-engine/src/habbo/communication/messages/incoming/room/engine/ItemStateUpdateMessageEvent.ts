import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {ItemStateUpdateMessageParser} from '@habbo/communication/messages/parser/room/engine/ItemStateUpdateMessageParser';

/**
 * ItemStateUpdateMessageEvent — a single wall item changed state (WIN63 header 834, from the
 * registry `_SafeStr_4546[834] = _SafeCls_2888`). Consumed by RoomMessageHandler.onItemStateUpdate.
 *
 * Name derived: fully obfuscated in AS3 (class `_SafeCls_2888`); named after its readable consumer.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2102/_SafeCls_2888.as
 */
export class ItemStateUpdateMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, ItemStateUpdateMessageParser);
    }
}
