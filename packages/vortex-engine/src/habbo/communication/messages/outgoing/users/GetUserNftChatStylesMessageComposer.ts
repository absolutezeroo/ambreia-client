import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Request owned NFT chat styles.
 *
 * @see sources/win63_version/habbo/communication/messages/outgoing/users/GetUserNftChatStylesMessageComposer.as
 */
export class GetUserNftChatStylesMessageComposer extends MessageComposer<ConstructorParameters<typeof GetUserNftChatStylesMessageComposer>>
{
    private _data: ConstructorParameters<typeof GetUserNftChatStylesMessageComposer>;

    constructor()
    {
        super();

        this._data = [];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/users/GetUserNftChatStylesMessageComposer.as::getMessageArray()
    getMessageArray()
    {
        return this._data;
    }
}
