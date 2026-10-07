import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {FigureSetIdsMessageParser} from '../../parser/inventory/FigureSetIdsMessageParser';

/**
 * Event handler for FigureSetIds message
 *
 * @see source_as_win63/habbo/communication/messages/incoming/inventory/clothing/FigureSetIdsEvent.as
 */
export class FigureSetIdsMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, FigureSetIdsMessageParser);
    }
}
