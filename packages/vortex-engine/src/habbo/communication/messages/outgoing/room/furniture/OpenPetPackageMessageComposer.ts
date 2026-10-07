import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Open a pet package furni to name and release the pet
 *
 * @see source_as_win63/habbo/communication/messages/outgoing/room/furniture/OpenPetPackageMessageComposer.as
 */
export class OpenPetPackageMessageComposer extends MessageComposer<ConstructorParameters<typeof OpenPetPackageMessageComposer>>
{
    private _data: ConstructorParameters<typeof OpenPetPackageMessageComposer>;

    constructor(objectId: number, name: string)
    {
        super();
        this._data = [objectId, name];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/room/furniture/OpenPetPackageMessageComposer.as::getMessageArray()
    getMessageArray()
    {
        return this._data;
    }
}
