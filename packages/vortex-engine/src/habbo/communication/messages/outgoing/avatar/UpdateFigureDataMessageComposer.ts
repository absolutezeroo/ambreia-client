import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Saves the avatar's figure and gender.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_3022/_SafeCls_3021.as
 * Sent by AS3: `AvatarEditor.saveOutfit()` — `new _SafeCls_3021(getFigure(), gender.toLowerCase())`.
 *
 * The wire order is GENDER FIRST, then the figure: the AS3 constructor takes `(figure, gender)` but
 * pushes `param2` before `param1`. Swapping them puts a figure string where the server reads a
 * gender and the save is rejected.
 *
 * Header 3339, from WIN63's registry (`_composers[3339] = _SafeCls_3021`); the emulator corroborates
 * it as `UpdateFigureDataMessageEvent`, which is also where the name comes from.
 */
export class UpdateFigureDataMessageComposer extends MessageComposer<[string, string]>
{
    private _data: [string, string];

    constructor(figure: string, gender: string)
    {
        super();

        this._data = [gender, figure];
    }

    // AS3: .../src/unknowns/_SafePkg_3022/_SafeCls_3021.as::getMessageArray()
    getMessageArray(): [string, string]
    {
        return this._data;
    }
}
