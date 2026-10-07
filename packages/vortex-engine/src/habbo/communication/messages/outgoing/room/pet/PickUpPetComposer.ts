import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Pick up a pet from the room and return it to inventory
 *
 * Based on AS3: com.sulake.habbo.communication.messages.outgoing.room.pet.PickUpPetComposer
 */
export class PickUpPetComposer extends MessageComposer<ConstructorParameters<typeof PickUpPetComposer>>
{
    private _data: ConstructorParameters<typeof PickUpPetComposer>;

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
