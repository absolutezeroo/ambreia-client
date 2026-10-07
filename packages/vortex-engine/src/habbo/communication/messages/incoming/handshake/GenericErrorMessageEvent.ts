import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {GenericErrorMessageParser} from '../../parser/handshake/GenericErrorMessageParser';

/**
 * Event handler for Generic error message
 * Message ID: 598
 *
 * @see source_as_win63/habbo/communication/messages/incoming/handshake/GenericErrorEvent.as
 */
export class GenericErrorMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, GenericErrorMessageParser);
    }
}
