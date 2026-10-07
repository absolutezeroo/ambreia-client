import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Remove a saddle from a pet
 *
 * Based on AS3: com.sulake.habbo.communication.messages.outgoing.room.pet.RemoveSaddleFromPetComposer
 */
export class RemoveSaddleFromPetComposer extends MessageComposer<ConstructorParameters<typeof RemoveSaddleFromPetComposer>>
{
    private _data: ConstructorParameters<typeof RemoveSaddleFromPetComposer>;

    constructor(petId: number)
    {
        super();
        this._data = [petId];
    }

    getMessageArray()
    {
        return this._data;
    }
}
