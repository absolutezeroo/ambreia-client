import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {RoomForwardMessageParser} from '../../../parser/room/session/RoomForwardMessageParser';

/**
 * RoomForwardMessageEvent
 *
 * Based on AS3: com.sulake.habbo.communication.messages.incoming.room.session.RoomForwardMessageEvent
 */
export class RoomForwardMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, RoomForwardMessageParser);
    }
}
