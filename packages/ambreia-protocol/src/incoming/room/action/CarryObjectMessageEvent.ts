/**
 * CarryObjectMessageEvent
 *
 * Based on AS3: com.sulake.habbo.communication.messages.incoming.room.action.CarryObjectMessageEvent
 */
import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {
    CarryObjectMessageEventParser
} from '../../../parser/room/action/CarryObjectMessageEventParser';

export class CarryObjectMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, CarryObjectMessageEventParser);
    }
}
