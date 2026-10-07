import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {UserNftChatStylesMessageParser} from '../../parser/users/UserNftChatStylesMessageParser';

/**
 * Event for user NFT chat styles
 *
 * @see source_as_win63/habbo/communication/messages/incoming/nft/UserNftChatStylesMessageEvent.as
 */
export class UserNftChatStylesMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, UserNftChatStylesMessageParser);
    }
}
