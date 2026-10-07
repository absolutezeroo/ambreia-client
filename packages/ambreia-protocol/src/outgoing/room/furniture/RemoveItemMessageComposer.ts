import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Delete a wall item — the stickie delete path.
 *
 * @see sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2136/_SafeCls_2734.as
 *
 * Header 141, from WIN63's registry (`_SafeCls_2046.as::_composers[141]`). Corroborated by
 * vortex-emulator's `RemoveItemMessageEvent`, whose comment traces it to `deleteWallItem()` —
 * the same call site this composer serves here.
 */
export class RemoveItemMessageComposer extends MessageComposer<ConstructorParameters<typeof RemoveItemMessageComposer>>
{
    private _data: ConstructorParameters<typeof RemoveItemMessageComposer>;

    constructor(objectId: number)
    {
        super();
        this._data = [objectId];
    }

    // AS3: .../src/unknowns/_SafePkg_2136/_SafeCls_2734.as::getMessageArray()
    getMessageArray()
    {
        return this._data;
    }
}
