import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Replenish daily respect allowance.
 *
 * @see sources/win63_version/habbo/communication/messages/outgoing/users/ReplenishRespectMessageComposer.as
 */
export class ReplenishRespectMessageComposer extends MessageComposer<ConstructorParameters<typeof ReplenishRespectMessageComposer>>
{
    private _data: ConstructorParameters<typeof ReplenishRespectMessageComposer>;

    constructor()
    {
        super();

        this._data = [];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/users/ReplenishRespectMessageComposer.as::getMessageArray()
    getMessageArray()
    {
        return this._data;
    }
}
