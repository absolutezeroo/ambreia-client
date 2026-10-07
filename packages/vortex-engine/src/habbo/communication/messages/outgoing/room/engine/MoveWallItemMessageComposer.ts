import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Move an already-placed wall item to a new spot on a wall.
 *
 * @see sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2136/_SafeCls_2682.as
 *
 * Header 2999, from WIN63's own registry (`_SafeCls_2046.as::_composers[2999]`). Corroborated by
 * vortex-emulator's `MoveWallItemMessageEvent = 2999`, whose parser reads an int and a string.
 *
 * The AS3 constructor takes three arguments — `(objectId, category, locationString)` — but pushes
 * only the first and the third. The category is accepted and dropped; it is never on the wire, and
 * the constructor here keeps it so the call site reads like AS3's.
 *
 * The location is the legacy wall-location string from
 * `LegacyWallGeometry.getOldLocationString()`, the same encode a category-20 placement sends.
 *
 * The name comes from vortex-emulator; no unobfuscated tree carries this composer.
 */
export class MoveWallItemMessageComposer extends MessageComposer<[number, string]>
{
    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2136/_SafeCls_2682.as::getMessageArray()
    // backing field — AS3 builds the array in the constructor rather than keeping the arguments.
    // Its identifier is obfuscated in every available tree, so there is no real name to trace to.
    private _data: [number, string];

    constructor(objectId: number, _category: number, wallLocation: string)
    {
        super();

        this._data = [objectId, wallLocation];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2136/_SafeCls_2682.as::getMessageArray()
    getMessageArray(): [number, string]
    {
        return this._data;
    }
}
