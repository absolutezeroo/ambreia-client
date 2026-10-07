import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Withdraw credits from the credit vault.
 *
 * @see sources/win63_version/habbo/communication/messages/outgoing/vault/WithdrawCreditVaultMessageComposer.as
 */
export class WithdrawCreditVaultMessageComposer extends MessageComposer<[]>
{
    private _data: [] = [];

    constructor()
    {
        super();
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/vault/WithdrawCreditVaultMessageComposer.as::getMessageArray()
    getMessageArray(): []
    {
        return this._data;
    }
}
