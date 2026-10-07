import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Blank a dice furni (ROFCAE_DICE_OFF).
 *
 * @see sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2609/_SafeCls_3356.as
 *
 * Header 259, from WIN63's registry (`_SafeCls_2046.as::_composers[259]`). Corroborated by vortex-emulator's `DiceOffMessageEvent`.
 */
export class DiceOffMessageComposer extends MessageComposer<ConstructorParameters<typeof DiceOffMessageComposer>>
{
    private _data: ConstructorParameters<typeof DiceOffMessageComposer>;

    constructor(objectId: number)
    {
        super();
        this._data = [objectId];
    }

    // AS3: .../src/unknowns/_SafePkg_2609/_SafeCls_3356.as::getMessageArray()
    getMessageArray()
    {
        return this._data;
    }
}
