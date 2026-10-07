import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {ElementPointerMessageEventParser} from '../../parser/notifications/ElementPointerMessageEventParser';

/**
 * Server message event for element pointer (hint) targeting.
 *
 * The server sends a key identifying which UI element the hint arrow
 * should point at. An empty key hides the current hint.
 *
 * @see sources/win63_version/habbo/communication/messages/incoming/notifications/ElementPointerMessageEvent.as
 */
export class ElementPointerMessageEvent extends MessageEvent implements IMessageEvent
{
    // AS3: sources/win63_version/habbo/communication/messages/incoming/notifications/ElementPointerMessageEvent.as::ElementPointerMessageEvent()
    constructor(callback: MessageEventCallback)
    {
        super(callback, ElementPointerMessageEventParser);
    }

    // AS3: sources/win63_version/habbo/communication/messages/incoming/notifications/ElementPointerMessageEvent.as::getParser()
    public get key(): string
    {
        return (this._parser as ElementPointerMessageEventParser).key;
    }
}
