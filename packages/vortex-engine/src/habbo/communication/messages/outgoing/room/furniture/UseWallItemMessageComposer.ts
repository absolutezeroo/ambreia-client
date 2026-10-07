import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Use a wall item — the category-20 branch of `changeRoomObjectState()`.
 *
 * @see sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2136/_SafeCls_3754.as
 *
 * Header 3590, from WIN63's registry (`_SafeCls_2046.as::_composers[3590]`).
 *
 * The emulator once declared 1540 for this message; since its commit 975b08e8f (2026-10-07) it
 * listens on 3590 as well, with the same `(objectId, param)` payload.
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
