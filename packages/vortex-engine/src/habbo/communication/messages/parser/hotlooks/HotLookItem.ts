import type {IMessageDataWrapper} from '@core/communication/messages/IMessageDataWrapper';

/**
 * One of the hotel's featured looks: a gender and the figure string to wear.
 *
 * Note the read order — **gender first**, then the figure. Its sibling `WardrobeOutfit` reads the
 * figure before the gender; the two are easy to confuse.
 *
 * Class name DERIVED: the AS3 file is `_SafeCls_4357.as` and the identifier exists in no tree.
 * Named after `HotLooksModel`, its only consumer, and the emulator's `HotLooksMessageComposer`.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2813/_SafeCls_4357.as
 */
export class HotLookItem
{
    // AS3: .../src/unknowns/_SafePkg_2813/_SafeCls_4357.as::_gender
    // Name DERIVED (`_SafeStr_4645`).
    private _gender: string;

    // AS3: .../src/unknowns/_SafePkg_2813/_SafeCls_4357.as::_figureString
    private _figureString: string;

    // AS3: .../src/unknowns/_SafePkg_2813/_SafeCls_4357.as::_SafeCls_4357()
    constructor(wrapper: IMessageDataWrapper)
    {
        this._gender = wrapper.readString();
        this._figureString = wrapper.readString();
    }

    // AS3: .../src/unknowns/_SafePkg_2813/_SafeCls_4357.as::get gender()
    get gender(): string
    {
        return this._gender;
    }

    // AS3: .../src/unknowns/_SafePkg_2813/_SafeCls_4357.as::get figureString()
    get figureString(): string
    {
        return this._figureString;
    }
}
