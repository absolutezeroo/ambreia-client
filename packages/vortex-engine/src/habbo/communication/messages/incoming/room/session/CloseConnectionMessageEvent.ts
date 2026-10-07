/**
 * CloseConnectionMessageEvent
 *
 * Based on AS3: com.sulake.habbo.communication.messages.incoming.room.session.CloseConnectionMessageEvent
 *
 * Sent when the room connection should be closed.
 */
import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {
    CloseConnectionMessageParser
} from '@habbo/communication/messages/parser/room/session/CloseConnectionMessageParser';

export class CloseConnectionMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, CloseConnectionMessageParser);
    }
}
