import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Write a wall item's colour and text — the stickie save path.
 *
 * @see sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2136/_SafeCls_2735.as
 *
 * Header 3498, from WIN63's registry (`_SafeCls_2046.as::_composers[3498]`). Corroborated by
 * vortex-emulator's `SetItemDataMessageEvent`.
 *
 * **The wire order is (objectId, colorHex, text), which is not the constructor order in AS3.**
 * `_SafeCls_2735(param1, param2, param3)` assigns `param3` to the text field and `param2` to the
 * colour field, then `getMessageArray()` returns `[objectId, colour, text]`. This port takes the
 * arguments in wire order to remove the trap; `modifyWallItemData()` is the only caller and passes
 * them the same way AS3 does.
 */
export class SetItemDataMessageComposer extends MessageComposer<ConstructorParameters<typeof SetItemDataMessageComposer>>
{
    private _data: ConstructorParameters<typeof SetItemDataMessageComposer>;

    constructor(objectId: number, colorHex: string = '', text: string = '')
    {
        super();
        this._data = [objectId, colorHex, text];
    }

    // AS3: .../src/unknowns/_SafePkg_2136/_SafeCls_2735.as::getMessageArray()
    getMessageArray()
    {
        return this._data;
    }
}
