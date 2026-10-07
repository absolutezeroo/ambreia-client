import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {IdentityAccountsEventParser} from '../../parser/handshake/IdentityAccountsEventParser';

/**
 * Identity accounts event (multi-avatar selection)
 *
 * @see source_as_win63/habbo/communication/messages/incoming/handshake/IdentityAccountsEvent.as
 */
export class IdentityAccountsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, IdentityAccountsEventParser);
    }
}
