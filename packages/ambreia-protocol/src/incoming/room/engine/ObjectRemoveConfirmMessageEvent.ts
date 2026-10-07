import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {ObjectRemoveConfirmMessageParser} from '../../../parser/room/engine/ObjectRemoveConfirmMessageParser';

/**
 * ObjectRemoveConfirmMessageEvent — the server wants the pick-up confirmed before it happens (WIN63
 * header 3643, from the registry `_SafeStr_4546[3643] = _SafeCls_3548`). Consumed by
 * RoomMessageHandler.onObjectRemoveConfirm.
 *
 * Name derived: fully obfuscated in AS3 (class `_SafeCls_3548`); named after its readable consumer.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2102/_SafeCls_3548.as
 */
export class ObjectRemoveConfirmMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, ObjectRemoveConfirmMessageParser);
    }
}
