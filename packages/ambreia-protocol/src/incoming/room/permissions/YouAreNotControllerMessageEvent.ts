/**
 * YouAreNotControllerMessageEvent
 *
 * Based on AS3: com.sulake.habbo.communication.messages.incoming.room.permissions.YouAreNotControllerMessageEvent
 */
import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {
    YouAreNotControllerMessageParser
} from '../../../parser/room/permissions/YouAreNotControllerMessageParser';

export class YouAreNotControllerMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, YouAreNotControllerMessageParser);
    }
}
