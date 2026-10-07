import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Spin the Habbo wheel (ROFCAE_USE_HABBOWHEEL).
 *
 * @see sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2609/_SafeCls_3425.as
 *
 * Header 3625, from WIN63's registry (`_SafeCls_2046.as::_composers[3625]`). Corroborated by vortex-emulator's `SpinWheelOfFortuneMessageEvent`.
 */
export class SpinWheelOfFortuneMessageComposer extends MessageComposer<ConstructorParameters<typeof SpinWheelOfFortuneMessageComposer>>
{
    private _data: ConstructorParameters<typeof SpinWheelOfFortuneMessageComposer>;

    constructor(objectId: number)
    {
        super();
        this._data = [objectId];
    }

    // AS3: .../src/unknowns/_SafePkg_2609/_SafeCls_3425.as::getMessageArray()
    getMessageArray()
    {
        return this._data;
    }
}
