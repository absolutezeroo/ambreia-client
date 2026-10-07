import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Request current income/reward status from the server.
 *
 * @see sources/win63_version/habbo/communication/messages/outgoing/vault/IncomeRewardStatusMessageComposer.as
 */
export class IncomeRewardStatusMessageComposer extends MessageComposer<[]>
{
    private _data: [] = [];

    constructor()
    {
        super();
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/vault/IncomeRewardStatusMessageComposer.as::getMessageArray()
    getMessageArray(): []
    {
        return this._data;
    }
}
