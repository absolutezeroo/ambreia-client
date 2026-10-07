import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {SpecialRoomEffectMessageParser} from '@habbo/communication/messages/parser/room/engine/SpecialRoomEffectMessageParser';

/**
 * SpecialRoomEffectMessageEvent — a room-wide special effect was triggered (WIN63 header 536, from
 * the registry `_SafeStr_4546[536] = _SafeCls_3228`). Consumed by
 * RoomMessageHandler.onSpecialRoomEvent.
 *
 * Name derived: fully obfuscated in AS3 (class `_SafeCls_3228`); named after its readable consumer.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2102/_SafeCls_3228.as
 */
export class SpecialRoomEffectMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, SpecialRoomEffectMessageParser);
    }
}
