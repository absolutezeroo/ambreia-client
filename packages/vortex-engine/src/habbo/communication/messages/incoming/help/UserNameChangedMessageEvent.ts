import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {UserNameChangedMessageParser} from '../../parser/help/UserNameChangedMessageParser';

/**
 * Event for user name changed notification.
 * Fired when a user's name has been successfully changed.
 *
 * @see source_as_win63/habbo/communication/messages/incoming/users/UserNameChangedMessageEvent.as
 */
export class UserNameChangedMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, UserNameChangedMessageParser);
    }
}
