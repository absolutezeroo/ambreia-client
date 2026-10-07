import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {GuideSessionStartedMessageParser} from '../../parser/help/GuideSessionStartedMessageParser';

/**
 * Event for guide session started notification.
 * Fired when a new guide session has been established.
 *
 * @see source_as_win63/habbo/communication/messages/incoming/help/GuideSessionStartedMessageEvent.as
 */
export class GuideSessionStartedMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, GuideSessionStartedMessageParser);
    }
}
