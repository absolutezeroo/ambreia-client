import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {
    AccountSafetyLockStatusChangeMessageEventParser
} from '../../parser/notifications/AccountSafetyLockStatusChangeMessageEventParser';

/**
 * Event for account safety lock status change
 *
 * @see source_as_win63/habbo/communication/messages/incoming/users/AccountSafetyLockStatusChangeMessageEvent.as
 */
export class AccountSafetyLockStatusChangeMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, AccountSafetyLockStatusChangeMessageEventParser);
    }
}
