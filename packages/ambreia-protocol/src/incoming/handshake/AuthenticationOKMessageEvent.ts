import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {AuthenticationOKMessageParser} from '../../parser/handshake/AuthenticationOKMessageParser';

/**
 * Event handler for AuthenticationOK message
 *
 * @see source_as_win63/habbo/communication/messages/incoming/handshake/AuthenticationOKMessageEvent.as
 */
export class AuthenticationOKMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, AuthenticationOKMessageParser);
    }

    // AS3: sources/win63_version/habbo/communication/messages/incoming/handshake/AuthenticationOKMessageEvent.as::get suggestedLoginActions()
    get suggestedLoginActions(): number[]
    {
        return this.getParser<AuthenticationOKMessageParser>().suggestedLoginActions;
    }
}
