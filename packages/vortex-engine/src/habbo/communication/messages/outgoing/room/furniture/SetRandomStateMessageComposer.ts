import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Use a floor furniture item that cycles to a *random* state rather than the next one.
 *
 * @see sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2609/_SafeCls_3726.as
 *
 * Header 1942, from WIN63's registry (`_SafeCls_2046.as::_composers[1942]`). Corroborated by
 * vortex-emulator's `SetRandomStateMessageEvent = 1942`.
 *
 * This is the `param5 == true` half of `changeRoomObjectState()`; the `false` half sends
 * {@link UseFurnitureMessageComposer} (3353). Same shape, same category-10 gate — only the
 * header differs, which is why the two are easy to conflate.
 *
 * The name comes from vortex-emulator; no unobfuscated tree carries this composer.
 */
export class SetRandomStateMessageComposer extends MessageComposer<[number, number]>
{
    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2609/_SafeCls_3726.as::getMessageArray() backing fields — the
    // constructor-assigned members. Their AS3 identifiers are obfuscated in every available
    // tree, so there is no real name to trace to.
    private _data: [number, number];

    constructor(objectId: number, state: number = 0)
    {
        super();
        this._data = [objectId, state];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2609/_SafeCls_3726.as::getMessageArray()
    getMessageArray(): [number, number]
    {
        return this._data;
    }
}
