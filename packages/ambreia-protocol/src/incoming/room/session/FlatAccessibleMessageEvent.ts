/**
 * FlatAccessibleMessageEvent
 *
 * Based on AS3: com.sulake.habbo.communication.messages.incoming.room.session.FlatAccessibleMessageEvent
 *
 * Sent when access to a room is granted (e.g., doorbell answered).
 */
import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {
    FlatAccessibleMessageParser
} from '../../../parser/room/session/FlatAccessibleMessageParser';

export class FlatAccessibleMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, FlatAccessibleMessageParser);
    }
}
