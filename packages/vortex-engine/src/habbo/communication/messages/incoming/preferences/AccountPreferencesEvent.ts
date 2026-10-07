import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {AccountPreferencesParser} from '../../parser/preferences/AccountPreferencesParser';

/**
 * Event for account preferences
 *
 * @see source_as_win63/habbo/communication/messages/incoming/preferences/AccountPreferencesEvent.as
 */
export class AccountPreferencesEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, AccountPreferencesParser);
    }
}
