/**
 * HeightMapMessageEvent
 *
 * Based on AS3: com.sulake.habbo.communication.messages.incoming.room.engine.HeightMapMessageEvent
 */
import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {HeightMapMessageParser} from '@habbo/communication/messages/parser/room/engine/HeightMapMessageParser';

export class HeightMapMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, HeightMapMessageParser);
    }
}
