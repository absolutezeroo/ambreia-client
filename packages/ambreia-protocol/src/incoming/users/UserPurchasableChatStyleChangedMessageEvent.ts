import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
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
