import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Request blocked users list.
 *
 * @see sources/win63_version/habbo/communication/messages/outgoing/users/BlockListInitComposer.as
 */
export class BlockListInitComposer extends MessageComposer<ConstructorParameters<typeof BlockListInitComposer>>
{
    private _data: ConstructorParameters<typeof BlockListInitComposer>;

    constructor()
    {
        super();

        this._data = [];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/users/BlockListInitComposer.as::getMessageArray()
    getMessageArray()
    {
        return this._data;
    }
}
