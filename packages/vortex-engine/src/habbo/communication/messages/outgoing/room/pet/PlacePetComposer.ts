import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Place a pet from the inventory directly into the room at a tile.
 *
 * Used by a guest (non room-owner, where pets are allowed) — the room owner instead drags the pet
 * in via RoomEngine.initializeRoomObjectInsert(). AS3 always sends x=0, y=0; the server resolves
 * the actual drop tile.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2136/_SafeCls_2777.as
 * (obfuscated; sent from PetsModel.placePetToRoom() as `new _SafeCls_2777(pet.id, 0, 0)`).
 * Wire format [petId, x, y] — matches the emulator's PlacePetMessageParser (header 1018).
 */
export class PlacePetComposer extends MessageComposer<ConstructorParameters<typeof PlacePetComposer>>
{
    private _data: ConstructorParameters<typeof PlacePetComposer>;

    // AS3: _SafeCls_2777.as::_SafeCls_2777()
    constructor(petId: number, x: number, y: number)
    {
        super();
        this._data = [petId, x, y];
    }

    // AS3: _SafeCls_2777.as::getMessageArray()
    getMessageArray()
    {
        return this._data;
    }
}
