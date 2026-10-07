import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {PingMessageParser} from '../../parser/handshake/PingMessageParser';

/**
 * Event handler for Ping message (keep-alive)
 * Message ID: 658
 *
 * @see source_as_win63/habbo/communication/messages/incoming/handshake/PingMessageEvent.as
 */
export class PingMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, PingMessageParser);
    }
}
