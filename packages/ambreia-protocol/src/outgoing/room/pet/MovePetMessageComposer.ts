import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Moves a pet already in the room to another tile (header 432) — what dragging a monster plant
 * sends, in place of the MoveObject message ordinary furniture uses.
 *
 * Body is (petWebId, x, y, direction), all ints.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2136/_SafeCls_2560.as
 * (obfuscated in the primary dump; `_composers[432] = _SafeCls_2560` in the registry
 * sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/_SafeCls_2046.as:1088, and
 * sent from habbo/room/_SafeCls_1821.as::sendMoveUserObjectMessage() on the "monsterplant" branch.
 * The class name is recovered from
 * sources/win63_version/habbo/communication/messages/outgoing/room/engine/MovePetMessageComposer.as.)
 */
export class MovePetMessageComposer extends MessageComposer<ConstructorParameters<typeof MovePetMessageComposer>>
{
    private _data: ConstructorParameters<typeof MovePetMessageComposer>;

    constructor(petWebId: number, x: number, y: number, direction: number)
    {
        super();
        this._data = [petWebId, x, y, direction];
    }

    // AS3: .../src/unknowns/_SafePkg_2136/_SafeCls_2560.as::getMessageArray()
    getMessageArray()
    {
        return this._data;
    }
}
