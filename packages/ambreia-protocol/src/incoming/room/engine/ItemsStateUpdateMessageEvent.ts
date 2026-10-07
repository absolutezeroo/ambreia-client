import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {ItemsStateUpdateMessageParser} from '../../../parser/room/engine/ItemsStateUpdateMessageParser';

/**
 * ItemsStateUpdateMessageEvent — bulk wall-item state update (WIN63 header 1787, from the registry
 * `_SafeStr_4546[1787] = _SafeCls_3283`). Consumed by RoomMessageHandler.onItemsStateUpdate.
 *
 * Name derived: fully obfuscated in AS3 (class `_SafeCls_3283`); named after its readable consumer.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2102/_SafeCls_3283.as
 */
export class ItemsStateUpdateMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, ItemsStateUpdateMessageParser);
    }
}
