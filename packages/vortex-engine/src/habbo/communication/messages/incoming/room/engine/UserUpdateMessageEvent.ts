/**
 * UserUpdateMessageEvent
 *
 * Based on AS3: com.sulake.habbo.communication.messages.incoming.room.engine.UserUpdateMessageEvent
 */
import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {UserUpdateMessageParser} from '@habbo/communication/messages/parser/room/engine/UserUpdateMessageParser';

export class UserUpdateMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, UserUpdateMessageParser);
    }
}
