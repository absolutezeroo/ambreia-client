/**
 * SpecialSystemChatMessageEvent
 *
 * @see sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2213/_SafeCls_3646.as
 *
 * Header 3102, from WIN63's own registry (`_SafeCls_2046.as::_events[3102]`). Subscribed by
 * `RoomChatHandler`, exactly as in AS3.
 *
 * **Name DERIVED, not recovered** — see {@link SpecialSystemChatMessageParser} for why: the message
 * is in no unobfuscated tree and vortex-emulator has no constant for 3102. It is named for the AS3
 * handler it feeds, `RoomChatHandler.as::onSpecialSystemChat()`.
 */
import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {
    SpecialSystemChatMessageParser
} from '../../../parser/room/chat/SpecialSystemChatMessageParser';

export class SpecialSystemChatMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, SpecialSystemChatMessageParser);
    }
}
