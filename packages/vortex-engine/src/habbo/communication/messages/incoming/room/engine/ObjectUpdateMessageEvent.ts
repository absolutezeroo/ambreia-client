/**
 * ObjectUpdateMessageEvent
 *
 * Based on AS3: com.sulake.habbo.communication.messages.incoming.room.engine.ObjectUpdateMessageEvent
 */
import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {ObjectUpdateMessageParser} from '@habbo/communication/messages/parser/room/engine/ObjectUpdateMessageParser';

export class ObjectUpdateMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, ObjectUpdateMessageParser);
    }
}
