import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Send unique machine/device identification
 * Message ID: 1390
 *
 * @see source_as_win63/habbo/communication/messages/outgoing/handshake/UniqueIDMessageComposer.as
 */
export class UniqueIDMessageComposer extends MessageComposer<ConstructorParameters<typeof UniqueIDMessageComposer>>
{
    private _data: ConstructorParameters<typeof UniqueIDMessageComposer>;

    constructor(
        machineId: string = '',
        fingerprint: string = '',
        flashVersion: string = ''
    )
    {
        super();

        this._data = [machineId, fingerprint, flashVersion];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/handshake/UniqueIDMessageComposer.as::getMessageArray()
    getMessageArray()
    {
        return this._data;
    }
}
