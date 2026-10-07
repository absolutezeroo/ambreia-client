/**
 * DanceMessageEvent
 *
 * Based on AS3: com.sulake.habbo.communication.messages.incoming.room.action.DanceMessageEvent
 */
import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {DanceMessageEventParser} from '../../../parser/room/action/DanceMessageEventParser';

export class DanceMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, DanceMessageEventParser);
    }
}
