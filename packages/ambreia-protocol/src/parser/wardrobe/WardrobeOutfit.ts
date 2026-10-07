import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * One saved wardrobe slot: its number, the figure string in it, and the gender that figure was
 * built for.
 *
 * Class name DERIVED: the AS3 file is `_SafeCls_4212.as` and the identifier exists in no tree. The
 * three member names are real, and the emulator calls the message carrying these
 * `WardrobeMessageComposer`.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_1759/_SafeCls_4212.as
 */
export class WardrobeOutfit
{
    // AS3: .../src/unknowns/_SafePkg_1759/_SafeCls_4212.as::_slotId
    // Name DERIVED (`_SafeStr_8125`): the field behind `get slotId()`.
    private _slotId: number;

    // AS3: .../src/unknowns/_SafePkg_1759/_SafeCls_4212.as::_figureString
    private _figureString: string;

    // AS3: .../src/unknowns/_SafePkg_1759/_SafeCls_4212.as::_gender
    // Name DERIVED (`_SafeStr_4645`).
    private _gender: string;

    // AS3: .../src/unknowns/_SafePkg_1759/_SafeCls_4212.as::_SafeCls_4212()
    // Reads itself out of the wrapper, as in AS3 — there is no separate parse step.
    constructor(wrapper: IMessageDataWrapper)
    {
        this._slotId = wrapper.readInt();
        this._figureString = wrapper.readString();
        this._gender = wrapper.readString();
    }

    // AS3: .../src/unknowns/_SafePkg_1759/_SafeCls_4212.as::get slotId()
    get slotId(): number
    {
        return this._slotId;
    }

    // AS3: .../src/unknowns/_SafePkg_1759/_SafeCls_4212.as::get figureString()
    get figureString(): string
    {
        return this._figureString;
    }

    // AS3: .../src/unknowns/_SafePkg_1759/_SafeCls_4212.as::get gender()
    get gender(): string
    {
        return this._gender;
    }
}
