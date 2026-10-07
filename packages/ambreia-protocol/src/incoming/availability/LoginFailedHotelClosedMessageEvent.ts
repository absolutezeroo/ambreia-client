import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {
    LoginFailedHotelClosedMessageEventParser
} from '../../parser/availability/LoginFailedHotelClosedMessageEventParser';

/**
 * Login failed - hotel is closed
 *
 * @see source_as_win63/habbo/communication/messages/incoming/availability/LoginFailedHotelClosedMessageEvent.as
 */
export class LoginFailedHotelClosedMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, LoginFailedHotelClosedMessageEventParser);
    }
}
