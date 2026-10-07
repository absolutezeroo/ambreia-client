import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {BlockListMessageParser} from '../../parser/users/BlockListMessageParser';

/**
 * Event for blocked users list.
 *
 * @see sources/win63_version/habbo/communication/messages/incoming/users/BlockListMessageEvent.as
 */
export class BlockListMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, BlockListMessageParser);
    }

    // AS3: sources/win63_version/habbo/communication/messages/incoming/users/BlockListMessageEvent.as::get blockedUserIds()
    get blockedUserIds(): number[]
    {
        return (this._parser as BlockListMessageParser).blockedUsers;
    }
}
