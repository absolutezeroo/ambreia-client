import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Toggle riding permission for a pet
 *
 * Based on AS3: com.sulake.habbo.communication.messages.outgoing.room.pet.TogglePetRidingPermissionComposer
 */
export class TogglePetRidingPermissionComposer extends MessageComposer<ConstructorParameters<typeof TogglePetRidingPermissionComposer>>
{
    private _data: ConstructorParameters<typeof TogglePetRidingPermissionComposer>;

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
