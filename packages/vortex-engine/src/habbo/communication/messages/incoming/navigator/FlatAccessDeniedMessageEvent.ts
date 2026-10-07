import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {FlatAccessDeniedMessageParser} from '../../parser/navigator/FlatAccessDeniedMessageParser';

/**
 * Event handler for FlatAccessDenied message
 *
 * @see source_as_win63/habbo/communication/messages/incoming/navigator/FlatAccessDeniedMessageEvent.as
 */
export class FlatAccessDeniedMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, FlatAccessDeniedMessageParser);
    }
}
