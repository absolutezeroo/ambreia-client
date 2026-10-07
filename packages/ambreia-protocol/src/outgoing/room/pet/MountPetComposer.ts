import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Mount or dismount a pet in the room.
 *
 * AS3 has a single composer with a `mount` boolean flag — there is no separate
 * dismount message, the server does not toggle state on its own.
 *
 * @see sources/win63_version/habbo/communication/messages/outgoing/room/engine/MountPetMessageComposer.as
 */
export class MountPetComposer extends MessageComposer<[number, boolean]>
{
    private _data: [number, boolean];

    constructor(petId: number, mount: boolean)
    {
        super();
        this._data = [petId, mount];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/room/engine/MountPetMessageComposer.as::getMessageArray()
    getMessageArray(): [number, boolean]
    {
        return this._data;
    }
}
