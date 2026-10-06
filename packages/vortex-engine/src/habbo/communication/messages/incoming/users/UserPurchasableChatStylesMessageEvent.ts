import {MessageEvent} from '@core/communication/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@core/communication/messages/IMessageEvent';
import {UserPurchasableChatStylesMessageParser} from '../../parser/users/UserPurchasableChatStylesMessageParser';

/**
 * Event for purchasable chat styles.
 *
 * @see sources/win63_version/habbo/communication/messages/incoming/nft/UserPurchasableChatStylesMessageEvent.as
 */
export class UserPurchasableChatStylesMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, UserPurchasableChatStylesMessageParser);
    }
}
