/**
 * ObjectDataUpdateMessageEvent
 *
 * Based on AS3: com.sulake.habbo.communication.messages.incoming.room.engine.ObjectDataUpdateMessageEvent
 */
import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {
    ObjectDataUpdateMessageParser
} from '../../../parser/room/engine/ObjectDataUpdateMessageParser';

export class ObjectDataUpdateMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, ObjectDataUpdateMessageParser);
    }
}
