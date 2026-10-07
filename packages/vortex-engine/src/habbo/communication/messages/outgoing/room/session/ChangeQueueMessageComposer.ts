import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Change queue position
 *
 * @see source_as_win63/habbo/communication/messages/outgoing/room/session/ChangeQueueMessageComposer.as
 */
export class ChangeQueueMessageComposer extends MessageComposer<ConstructorParameters<typeof ChangeQueueMessageComposer>>
{
    private _data: ConstructorParameters<typeof ChangeQueueMessageComposer>;

    constructor(targetQueue: number)
    {
        super();
        this._data = [targetQueue];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/room/session/ChangeQueueMessageComposer.as::getMessageArray()
    getMessageArray()
    {
        return this._data;
    }
}
