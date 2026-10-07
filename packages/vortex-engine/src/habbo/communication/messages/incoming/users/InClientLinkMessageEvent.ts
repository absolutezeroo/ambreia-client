import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {InClientLinkMessageParser} from '../../parser/users/InClientLinkMessageParser';

/**
 * Event for in-client link messages sent by the server
 *
 * The server sends a link string that should be routed to the appropriate
 * link event tracker via ComponentContext.createLinkEvent().
 *
 * @see source_as_win63/habbo/communication/messages/incoming/users/InClientLinkMessageEvent.as
 */
export class InClientLinkMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, InClientLinkMessageParser);
    }

    // AS3: sources/win63_version/habbo/communication/messages/incoming/users/InClientLinkMessageEvent.as::get link()
    get link(): string
    {
        return (this._parser as InClientLinkMessageParser).link;
    }
}
