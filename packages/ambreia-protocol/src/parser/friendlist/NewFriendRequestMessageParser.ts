import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import {FriendRequestData} from './FriendRequestData';

/**
 * Parser for a new incoming friend request notification.
 *
 * @see source_as_win63/habbo/communication/messages/parser/friendlist/NewFriendRequestMessageParser.as
 */
export class NewFriendRequestMessageParser implements IMessageParser
{
    private _req: FriendRequestData | null = null;

    get req(): FriendRequestData | null
    {
        return this._req;
    }

    flush(): boolean
    {
        this._req = null;
        return true;
    }

    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._req = new FriendRequestData(wrapper);

        return true;
    }
}
