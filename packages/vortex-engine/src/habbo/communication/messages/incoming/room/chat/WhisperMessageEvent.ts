/**
 * WhisperMessageEvent
 *
 * Based on AS3: com.sulake.habbo.communication.messages.incoming.room.chat.WhisperMessageEvent
 */
import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {ChatMessageEventParser} from '@habbo/communication/messages/parser/room/chat/ChatMessageEventParser';

export class WhisperMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, ChatMessageEventParser);
    }
}
