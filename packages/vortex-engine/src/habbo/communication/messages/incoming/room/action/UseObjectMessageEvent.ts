/**
 * UseObjectMessageEvent
 *
 * Based on AS3: com.sulake.habbo.communication.messages.incoming.room.action.UseObjectMessageEvent
 */
import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {
    UseObjectMessageEventParser
} from '@habbo/communication/messages/parser/room/action/UseObjectMessageEventParser';

export class UseObjectMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, UseObjectMessageEventParser);
    }
}
