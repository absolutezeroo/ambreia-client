/**
 * FloodControlMessageEvent
 *
 * @see sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2213/_SafeCls_3307.as
 *
 * Header 3614, from WIN63's own registry (`_SafeCls_2046.as::_events[3614]`). Corroborated by
 * vortex-emulator's `FloodControlMessageComposer = 3614`. Subscribed by `RoomChatHandler`, exactly
 * as in AS3.
 *
 * The name comes from vortex-emulator; no unobfuscated tree carries this event.
 */
import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {FloodControlMessageParser} from '@habbo/communication/messages/parser/room/chat/FloodControlMessageParser';

export class FloodControlMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, FloodControlMessageParser);
    }
}
