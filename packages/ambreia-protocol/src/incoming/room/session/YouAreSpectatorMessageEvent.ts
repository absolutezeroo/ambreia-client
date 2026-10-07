import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {YouAreSpectatorMessageParser} from '../../../parser/room/session/YouAreSpectatorMessageParser';

/**
 * YouAreSpectatorMessageEvent
 *
 * Based on AS3: com.sulake.habbo.communication.messages.incoming.room.session.YouAreSpectatorMessageEvent
 */
export class YouAreSpectatorMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, YouAreSpectatorMessageParser);
    }
}
