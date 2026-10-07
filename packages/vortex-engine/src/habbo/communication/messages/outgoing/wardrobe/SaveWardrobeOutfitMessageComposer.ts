import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Saves one outfit into a wardrobe slot.
 *
 * Header **116**, from WIN63's registry (`_composers[116] = _SafeCls_2780`); the emulator
 * corroborates it as `SaveWardrobeOutfitMessageEvent`, which is where the name comes from. Class
 * name DERIVED — the AS3 composer is obfuscated.
 *
 * The wire order is the constructor's own — slot, figure, gender. Worth stating because its
 * neighbour `UpdateFigureDataMessageComposer` takes `(figure, gender)` and pushes them
 * **reversed**; this one does not swap.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2781/_SafeCls_2780.as
 */
export class SaveWardrobeOutfitMessageComposer extends MessageComposer<[number, string, string]>
{
    // AS3: .../src/unknowns/_SafePkg_2781/_SafeCls_2780.as::_data
    // Name DERIVED (`_SafeStr_4556`): the array AS3 pushes the three arguments into.
    private _data: [number, string, string];

    // AS3: .../src/unknowns/_SafePkg_2781/_SafeCls_2780.as::_SafeCls_2780()
    constructor(slotId: number, figure: string, gender: string)
    {
        super();

        this._data = [slotId, figure, gender];
    }

    // AS3: .../src/unknowns/_SafePkg_2781/_SafeCls_2780.as::getMessageArray()
    getMessageArray(): [number, string, string]
    {
        return this._data;
    }
}
