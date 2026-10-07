/**
 * SleepMessageEvent
 *
 * Based on AS3: com.sulake.habbo.communication.messages.incoming.room.action.SleepMessageEvent
 */
import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {SleepMessageEventParser} from '../../../parser/room/action/SleepMessageEventParser';

export class SleepMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, SleepMessageEventParser);
    }
}
