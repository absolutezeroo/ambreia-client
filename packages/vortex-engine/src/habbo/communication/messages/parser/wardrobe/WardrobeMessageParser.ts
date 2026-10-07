import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import {WardrobeOutfit} from './WardrobeOutfit';

/**
 * The user's saved outfits: a state flag, then a count, then that many `WardrobeOutfit` records.
 *
 * Class name DERIVED: the AS3 parser is `_SafeCls_4255.as`; named after the emulator's
 * `WardrobeMessageComposer` (header 1484), which is what sends it.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_1869/_SafeCls_4255.as
 */
export class WardrobeMessageParser implements IMessageParser
{
    // AS3: .../src/unknowns/_SafePkg_1869/_SafeCls_4255.as::_state
    // Name DERIVED (`_SafeStr_4597`): the field behind `get state()`. The two known values are
    // declared on the *event* rather than here — see `WardrobeMessageEvent`.
    private _state: number = 0;

    // AS3: .../src/unknowns/_SafePkg_1869/_SafeCls_4255.as::_outfits
    // Name DERIVED (`_SafeStr_8751`).
    private _outfits: WardrobeOutfit[] = [];

    // AS3: .../src/unknowns/_SafePkg_1869/_SafeCls_4255.as::get state()
    get state(): number
    {
        return this._state;
    }

    // AS3: .../src/unknowns/_SafePkg_1869/_SafeCls_4255.as::get outfits()
    get outfits(): WardrobeOutfit[]
    {
        return this._outfits;
    }

    // AS3: .../src/unknowns/_SafePkg_1869/_SafeCls_4255.as::flush()
    flush(): boolean
    {
        this._state = 0;
        this._outfits = [];

        return true;
    }

    // AS3: .../src/unknowns/_SafePkg_1869/_SafeCls_4255.as::parse()
    // The state comes *before* the count, so a reader that starts with the count is a byte out.
    parse(wrapper: IMessageDataWrapper): boolean
    {
        this._state = wrapper.readInt();

        const count = wrapper.readInt();

        for(let index = 0; index < count; index++)
        {
            this._outfits.push(new WardrobeOutfit(wrapper));
        }

        return true;
    }
}
