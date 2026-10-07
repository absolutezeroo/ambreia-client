import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Roll a dice furni (ROFCAE_DICE_ACTIVATE).
 *
 * @see sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2609/_SafeCls_3154.as
 *
 * Header 1673, from WIN63's registry (`_SafeCls_2046.as::_composers[1673]`). Corroborated by vortex-emulator's `ThrowDiceMessageEvent`.
 */
export class ThrowDiceMessageComposer extends MessageComposer<ConstructorParameters<typeof ThrowDiceMessageComposer>>
{
    private _data: ConstructorParameters<typeof ThrowDiceMessageComposer>;

    constructor(objectId: number)
    {
        super();
        this._data = [objectId];
    }

    // AS3: .../src/unknowns/_SafePkg_2609/_SafeCls_3154.as::getMessageArray()
    getMessageArray()
    {
        return this._data;
    }
}
