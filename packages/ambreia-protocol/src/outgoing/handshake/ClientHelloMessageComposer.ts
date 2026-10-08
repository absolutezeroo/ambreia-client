import {PreEncryptionMessageComposer} from '@ambreia/net/messages/PreEncryptionMessageComposer';
import {REVISION} from '../../Headers.generated';

/**
 * First message sent to server to initiate connection. Its id stays 4000 in every revision: the
 * server reads it before it knows which id table the client speaks, and picks that table from
 * `releaseVersion` (spec 2026-10-08-random-header-revisions §4.3).
 *
 * @see source_as_win63/habbo/communication/messages/outgoing/handshake/ClientHelloMessageComposer.as
 */
export class ClientHelloMessageComposer extends PreEncryptionMessageComposer<ConstructorParameters<typeof ClientHelloMessageComposer>>
{
    private _data: ConstructorParameters<typeof ClientHelloMessageComposer>;

    constructor(
        releaseVersion: string = REVISION,
        type: string = 'FLASH20',
        platform: number = 6,
        category: number = 4
    )
    {
        super();

        this._data = [releaseVersion, type, platform, category];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/handshake/ClientHelloMessageComposer.as::getMessageArray()
    getMessageArray()
    {
        return this._data;
    }
}
