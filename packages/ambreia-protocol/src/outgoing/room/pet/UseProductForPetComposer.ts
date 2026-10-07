import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Use a product (item) on a pet
 *
 * Based on AS3: com.sulake.habbo.communication.messages.outgoing.room.pet.UseProductForPetComposer
 */
export class UseProductForPetComposer extends MessageComposer<ConstructorParameters<typeof UseProductForPetComposer>>
{
    private _data: ConstructorParameters<typeof UseProductForPetComposer>;

    constructor(petId: number, productId: number)
    {
        super();
        this._data = [petId, productId];
    }

    getMessageArray()
    {
        return this._data;
    }
}
