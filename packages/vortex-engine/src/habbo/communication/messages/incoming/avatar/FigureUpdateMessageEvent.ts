import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {FigureUpdateMessageParser} from '../../parser/avatar/FigureUpdateMessageParser';

/**
 * Event handler for figure update message
 * Sent when user's avatar appearance changes
 *
 * @see source_as_win63/habbo/communication/messages/incoming/avatar/FigureUpdateEvent.as
 */
export class FigureUpdateMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, FigureUpdateMessageParser);
    }
}
