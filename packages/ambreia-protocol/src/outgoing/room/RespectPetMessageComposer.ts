import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Give respect to a pet
 *
 * @see source_as_win63/habbo/communication/messages/outgoing/room/pets/RespectPetMessageComposer.as
 */
export class RespectPetMessageComposer extends MessageComposer<ConstructorParameters<typeof RespectPetMessageComposer>>
{
    private _data: ConstructorParameters<typeof RespectPetMessageComposer>;

    constructor(petId: number)
    {
        super();

        this._data = [petId];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/room/pets/RespectPetMessageComposer.as::getMessageArray()
    getMessageArray()
    {
        return this._data;
    }
}
