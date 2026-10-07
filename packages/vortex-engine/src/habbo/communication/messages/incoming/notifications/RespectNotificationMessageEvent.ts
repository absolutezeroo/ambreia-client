import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {RespectNotificationMessageEventParser} from '../../parser/notifications/RespectNotificationMessageEventParser';

/**
 * Event for respect notification message
 *
 * @see source_as_win63/habbo/communication/messages/incoming/users/RespectNotificationMessageEvent.as
 */
export class RespectNotificationMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, RespectNotificationMessageEventParser);
    }
}
