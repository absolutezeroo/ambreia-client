import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Redeem a credit furni item
 *
 * @see source_as_win63/habbo/communication/messages/outgoing/room/furniture/CreditFurniRedeemMessageComposer.as
 */
export class CreditFurniRedeemMessageComposer extends MessageComposer<ConstructorParameters<typeof CreditFurniRedeemMessageComposer>>
{
    private _data: ConstructorParameters<typeof CreditFurniRedeemMessageComposer>;

    constructor(objectId: number)
    {
        super();
        this._data = [objectId];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/room/furniture/CreditFurniRedeemMessageComposer.as::getMessageArray()
    getMessageArray()
    {
        return this._data;
    }
}
