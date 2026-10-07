import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Use a wall item — the category-20 branch of `changeRoomObjectState()`.
 *
 * @see sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2136/_SafeCls_3754.as
 *
 * Header 3590, from WIN63's registry (`_SafeCls_2046.as::_composers[3590]`).
 *
 * **The emulator disagrees, and the registry wins.** vortex-emulator declares
 * `UseWallItemMessageEvent = 1540` with the comment *"UNRESOLVED: no distinct AS3 backing
 * found — room engine modifyWallItemData() sends the only composer for this action"*. That
 * conclusion is wrong: `modifyWallItemData()` (3498, SetItemData) writes a wall item's colour
 * and text, which is a different action from *using* one. `changeRoomObjectState()` has a
 * distinct `param3 == 20` branch sending `_SafeCls_3754`, and the registry gives it 3590.
 * Header source-of-truth order is the WIN63 registry first, the emulator as corroboration only.
 *
 * Practical consequence: the server currently listens on 1540 and will not act on this. The
 * client is nonetheless correct, and the fix belongs in vortex-emulator's Headers.cs.
 *
 * The name comes from vortex-emulator; no unobfuscated tree carries this composer.
 */
export class UseWallItemMessageComposer extends MessageComposer<[number, number]>
{
    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2136/_SafeCls_3754.as::getMessageArray() backing fields — the
    // constructor-assigned members. Their AS3 identifiers are obfuscated in every available
    // tree, so there is no real name to trace to.
    private _data: [number, number];

    constructor(objectId: number, state: number = 0)
    {
        super();
        this._data = [objectId, state];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2136/_SafeCls_3754.as::getMessageArray()
    getMessageArray(): [number, number]
    {
        return this._data;
    }
}
