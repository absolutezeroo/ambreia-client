import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {UserRightsMessageParser} from '../../parser/handshake/UserRightsMessageParser';

/**
 * Event handler for User rights message
 * Message ID: 1416
 *
 * @see source_as_win63/habbo/communication/messages/incoming/handshake/UserRightsMessageEvent.as
 */
export class UserRightsMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, UserRightsMessageParser);
    }
}
