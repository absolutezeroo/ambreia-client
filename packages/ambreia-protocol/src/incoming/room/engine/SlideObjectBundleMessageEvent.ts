/**
 * SlideObjectBundleMessageEvent
 *
 * Based on AS3: com.sulake.habbo.communication.messages.incoming.room.engine.SlideObjectBundleMessageEvent
 */
import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {
    SlideObjectBundleMessageParser
} from '../../../parser/room/engine/SlideObjectBundleMessageParser';

export class SlideObjectBundleMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, SlideObjectBundleMessageParser);
    }
}
