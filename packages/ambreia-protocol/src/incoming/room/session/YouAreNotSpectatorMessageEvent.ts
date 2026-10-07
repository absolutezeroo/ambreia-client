import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {YouAreNotSpectatorMessageParser} from '../../../parser/room/session/YouAreNotSpectatorMessageParser';

/**
 * YouAreNotSpectatorMessageEvent
 *
 * Based on AS3: com.sulake.habbo.communication.messages.incoming.room.session.YouAreNotSpectatorMessageEvent
 */
export class YouAreNotSpectatorMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, YouAreNotSpectatorMessageParser);
    }
}
