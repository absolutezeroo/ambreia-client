/**
 * UserRemoveMessageEvent
 *
 * Based on AS3: com.sulake.habbo.communication.messages.incoming.room.engine.UserRemoveMessageEvent
 */
import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {UserRemoveMessageParser} from '@habbo/communication/messages/parser/room/engine/UserRemoveMessageParser';

export class UserRemoveMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, UserRemoveMessageParser);
    }
}
