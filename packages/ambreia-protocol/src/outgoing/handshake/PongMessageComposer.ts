import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Response to server ping (keep-alive)
 *
 * @see source_as_win63/habbo/communication/messages/outgoing/handshake/PongMessageComposer.as
 */
export class PongMessageComposer extends MessageComposer<ConstructorParameters<typeof PongMessageComposer>>
{
    private _data: ConstructorParameters<typeof PongMessageComposer>;

    constructor()
    {
        super();

        this._data = [];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/handshake/PongMessageComposer.as::getMessageArray()
    getMessageArray()
    {
        return this._data;
    }
}
