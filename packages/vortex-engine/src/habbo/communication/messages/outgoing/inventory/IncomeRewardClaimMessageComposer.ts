import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Claim a daily income reward.
 *
 * @see sources/win63_version/habbo/communication/messages/outgoing/vault/IncomeRewardClaimMessageComposer.as
 */
export class IncomeRewardClaimMessageComposer extends MessageComposer<[number]>
{
    private _data: [number];

    constructor(rewardId: number)
    {
        super();
        this._data = [rewardId];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/vault/IncomeRewardClaimMessageComposer.as::getMessageArray()
    getMessageArray(): [number]
    {
        return this._data;
    }
}
