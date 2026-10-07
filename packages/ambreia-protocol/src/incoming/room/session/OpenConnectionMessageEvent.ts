/**
 * OpenConnectionMessageEvent
 *
 * Based on AS3: com.sulake.habbo.communication.messages.incoming.room.session.OpenConnectionMessageEvent
 *
 * Event fired when a room connection is opened.
 */
import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {
    OpenConnectionMessageParser
} from '../../../parser/room/session/OpenConnectionMessageParser';

export class OpenConnectionMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, OpenConnectionMessageParser);
    }
}
