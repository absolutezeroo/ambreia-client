import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {BlockUserUpdateMessageParser} from '../../parser/users/BlockUserUpdateMessageParser';

/**
 * Event for block/unblock update.
 *
 * @see sources/win63_version/habbo/communication/messages/incoming/users/BlockUserUpdateMessageEvent.as
 */
export class BlockUserUpdateMessageEvent extends MessageEvent implements IMessageEvent
{
    static readonly UNBLOCKED: number = 0;
    static readonly BLOCKED: number = 1;

    constructor(callback: MessageEventCallback)
    {
        super(callback, BlockUserUpdateMessageParser);
    }

    // AS3: sources/win63_version/habbo/communication/messages/incoming/users/BlockUserUpdateMessageEvent.as::get result()
    get result(): number
    {
        return (this._parser as BlockUserUpdateMessageParser).result;
    }

    // AS3: sources/win63_version/habbo/communication/messages/incoming/users/BlockUserUpdateMessageEvent.as::get userId()
    get userId(): number
    {
        return (this._parser as BlockUserUpdateMessageParser).userId;
    }
}
