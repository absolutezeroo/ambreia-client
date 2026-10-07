import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Requests user classification data for a peer user.
 *
 * @see source_as_win63/habbo/communication/messages/outgoing/userclassification/PeerUsersClassificationMessageComposer.as
 */
export class PeerUsersClassificationMessageComposer extends MessageComposer<ConstructorParameters<typeof PeerUsersClassificationMessageComposer>>
{
    private _data: ConstructorParameters<typeof PeerUsersClassificationMessageComposer>;

    constructor(userName: string)
    {
        super();
        this._data = [userName];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/userclassification/PeerUsersClassificationMessageComposer.as::getMessageArray()
    getMessageArray()
    {
        return this._data;
    }
}
