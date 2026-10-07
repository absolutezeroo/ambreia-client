/**
 * ExpressionMessageEvent
 *
 * Based on AS3: com.sulake.habbo.communication.messages.incoming.room.action.ExpressionMessageEvent
 */
import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {
    ExpressionMessageEventParser
} from '@habbo/communication/messages/parser/room/action/ExpressionMessageEventParser';

export class ExpressionMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, ExpressionMessageEventParser);
    }
}
