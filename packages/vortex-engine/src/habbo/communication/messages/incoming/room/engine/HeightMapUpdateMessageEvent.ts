/**
 * HeightMapUpdateMessageEvent
 *
 * Based on AS3: com.sulake.habbo.communication.messages.incoming.room.engine.HeightMapUpdateMessageEvent
 */
import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {
    HeightMapUpdateMessageParser
} from '@habbo/communication/messages/parser/room/engine/HeightMapUpdateMessageParser';

export class HeightMapUpdateMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, HeightMapUpdateMessageParser);
    }
}
