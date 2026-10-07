import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {NotificationDialogMessageEventParser} from '../../parser/notifications/NotificationDialogMessageEventParser';

/**
 * Event for notification dialog message
 *
 * @see source_as_win63/habbo/communication/messages/incoming/notifications/NotificationDialogMessageEvent.as
 */
export class NotificationDialogMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, NotificationDialogMessageEventParser);
    }
}
