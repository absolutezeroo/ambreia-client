import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {YouArePlayingGameMessageParser} from '../../../parser/room/session/YouArePlayingGameMessageParser';

/**
 * YouArePlayingGameMessageEvent
 *
 * Based on AS3: com.sulake.habbo.communication.messages.incoming.room.session.YouArePlayingGameMessageEvent
 */
export class YouArePlayingGameMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, YouArePlayingGameMessageParser);
    }
}
