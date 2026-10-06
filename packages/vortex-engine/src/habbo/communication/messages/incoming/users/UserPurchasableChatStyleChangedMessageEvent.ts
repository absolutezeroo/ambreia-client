import {MessageEvent} from '@core/communication/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@core/communication/messages/IMessageEvent';
import {UserPurchasableChatStyleChangedMessageParser} from '../../parser/users/UserPurchasableChatStyleChangedMessageParser';

/**
 * Event for purchasable chat style change.
 *
 * @see sources/win63_version/habbo/communication/messages/incoming/nft/UserPurchasableChatStyleChangedMessageEvent.as
 */
export class UserPurchasableChatStyleChangedMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, UserPurchasableChatStyleChangedMessageParser);
    }
}
