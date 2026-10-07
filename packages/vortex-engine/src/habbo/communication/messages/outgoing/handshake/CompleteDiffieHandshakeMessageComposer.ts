import {PreEncryptionMessageComposer} from '@ambreia/net/messages/PreEncryptionMessageComposer';

/**
 * Complete Diffie-Hellman key exchange with our public key
 * Message ID: 2616
 *
 * @see source_as_win63/habbo/communication/messages/outgoing/handshake/CompleteDiffieHandshakeMessageComposer.as
 */
export class CompleteDiffieHandshakeMessageComposer extends PreEncryptionMessageComposer<ConstructorParameters<typeof CompleteDiffieHandshakeMessageComposer>>
{
    private _data: ConstructorParameters<typeof CompleteDiffieHandshakeMessageComposer>;

    constructor(publicKey: string)
    {
        super();

        this._data = [publicKey];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/handshake/CompleteDiffieHandshakeMessageComposer.as::getMessageArray()
    getMessageArray()
    {
        return this._data;
    }
}
