import {PreEncryptionMessageComposer} from '@ambreia/net/messages/PreEncryptionMessageComposer';

/**
 * Request to start Diffie-Hellman key exchange
 * Message ID: 586
 *
 * @see source_as_win63/habbo/communication/messages/outgoing/handshake/InitDiffieHandshakeMessageComposer.as
 */
export class InitDiffieHandshakeMessageComposer extends PreEncryptionMessageComposer<ConstructorParameters<typeof InitDiffieHandshakeMessageComposer>>
{
    private _data: ConstructorParameters<typeof InitDiffieHandshakeMessageComposer>;

    constructor()
    {
        super();

        this._data = [];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/handshake/InitDiffieHandshakeMessageComposer.as::getMessageArray()
    getMessageArray()
    {
        return this._data;
    }
}
