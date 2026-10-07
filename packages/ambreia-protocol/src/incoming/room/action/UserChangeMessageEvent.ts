/**
 * UserChangeMessageEvent
 *
 * Based on AS3: com.sulake.habbo.communication.messages.incoming.room.engine.UserChangeMessageEvent
 *
 * Fired when a user's figure/info changes (different from UserUpdateMessageEvent which handles position)
 */
import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {
    UserChangeMessageEventParser
} from '../../../parser/room/action/UserChangeMessageEventParser';

export class UserChangeMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, UserChangeMessageEventParser);
    }
}
