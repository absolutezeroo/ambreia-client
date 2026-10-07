import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Asks the server for a pet's full info (header 3899) — answered with PetInfoMessageEvent (3192).
 *
 * This is what UserDataManager.requestPetInfo() sends, and therefore the first link in the whole
 * pet-infostand chain: clicking a pet routes to InfoStandWidgetHandler.handleGetPetInfoMessage(),
 * which calls requestPetInfo() and waits for 3192 to come back.
 *
 * Body is a single int (the pet's web id), matching Revision20260701's GetPetInfoMessageParser
 * (`PetId = packet.PopInt()`), which is handled for real by GetPetInfoMessageHandler.
 *
 * @see sources/win63_version/habbo/communication/messages/outgoing/room/pets/GetPetInfoMessageComposer.as
 */
export class GetPetInfoMessageComposer extends MessageComposer<ConstructorParameters<typeof GetPetInfoMessageComposer>>
{
    private _data: ConstructorParameters<typeof GetPetInfoMessageComposer>;

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/room/pets/GetPetInfoMessageComposer.as::GetPetInfoMessageComposer()
    constructor(petId: number)
    {
        super();
        this._data = [petId];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/room/pets/GetPetInfoMessageComposer.as::getMessageArray()
    getMessageArray()
    {
        return this._data;
    }
}
