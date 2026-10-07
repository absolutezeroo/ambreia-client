import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Save a furniture item's stuff data — the "OBJECT_SAVE_STUFF_DATA" operation, used by the
 * ad-furni branding editor and the infostand's save-stuff-data action.
 *
 * @see sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2136/_SafeCls_3000.as
 *
 * Header 246, from WIN63's registry (`_SafeCls_2046.as::_composers[246]`). Corroborated by
 * vortex-emulator's `SetObjectDataMessageEvent = 246`.
 *
 * **The wire is a flat key/value run, not a map.** AS3 pushes the object id, then
 * `data.length * 2` — the number of *entries*, i.e. twice the key count — and then every key
 * followed by its value. Sending the pair count instead of the entry count would desync the
 * reader by half the payload.
 *
 * The name comes from vortex-emulator; no unobfuscated tree carries this composer
 * (PRODUCTION-201601012205-226667486 predates it).
 */
export class SetObjectDataMessageComposer extends MessageComposer<(string | number)[]>
{
    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2136/_SafeCls_3000.as::getMessageArray() backing fields — the
    // constructor-assigned members. Their AS3 identifiers are obfuscated in every available
    // tree, so there is no real name to trace to.
    private _data: (string | number)[];

    constructor(objectId: number, data: Map<string, string>)
    {
        super();

        this._data = [objectId, data.size * 2];

        for(const [key, value] of data)
        {
            this._data.push(key, value);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2136/_SafeCls_3000.as::getMessageArray()
    getMessageArray(): (string | number)[]
    {
        return this._data;
    }
}
