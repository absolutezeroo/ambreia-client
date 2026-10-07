import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {UserObjectMessageParser} from '../../parser/handshake/UserObjectMessageParser';

/**
 * Event handler for User object data message
 *
 * @see source_as_win63/habbo/communication/messages/incoming/handshake/UserObjectEvent.as
 */
export class UserObjectMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, UserObjectMessageParser);
    }
}
