import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Data class representing a friend request from the server.
 *
 * @see source_as_win63/habbo/communication/messages/incoming/friendlist/FriendRequestData.as
 */
export class FriendRequestData
{
    constructor(wrapper: IMessageDataWrapper)
    {
        this._requestId = wrapper.readInt();
        this._requesterName = wrapper.readString();
        this._figureString = wrapper.readString();
        this._requesterUserId = this._requestId;
    }

    private _requestId: number;

    get requestId(): number
    {
        return this._requestId;
    }

    private _requesterName: string;

    get requesterName(): string
    {
        return this._requesterName;
    }

    private _figureString: string;

    get figureString(): string
    {
        return this._figureString;
    }

    private _requesterUserId: number;

    get requesterUserId(): number
    {
        return this._requesterUserId;
    }
}
