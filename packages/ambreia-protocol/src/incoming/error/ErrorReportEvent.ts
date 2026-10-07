import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {ErrorReportEventParser} from '../../parser/error/ErrorReportEventParser';

/**
 * Error report event from server
 *
 * @see source_as_win63/habbo/communication/messages/incoming/error/ErrorReportEvent.as
 */
export class ErrorReportEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, ErrorReportEventParser);
    }
}
