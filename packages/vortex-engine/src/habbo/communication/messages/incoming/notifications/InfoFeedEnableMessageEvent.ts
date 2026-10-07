import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {InfoFeedEnableMessageParser} from '../../parser/notifications/InfoFeedEnableMessageParser';

/**
 * Event handler for InfoFeedEnable message
 *
 * @see source_as_win63/habbo/communication/messages/incoming/notifications/InfoFeedEnableMessageEvent.as
 */
export class InfoFeedEnableMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, InfoFeedEnableMessageParser);
    }
}
