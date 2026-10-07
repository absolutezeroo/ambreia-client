import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Walk into a one-way door (ROFCAE_ENTER_ONEWAYDOOR).
 *
 * @see sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2609/_SafeCls_3749.as
 *
 * Header 1753, from WIN63's registry (`_SafeCls_2046.as::_composers[1753]`). Corroborated by vortex-emulator's `EnterOneWayDoorMessageEvent`.
 */
export class EnterOneWayDoorMessageComposer extends MessageComposer<ConstructorParameters<typeof EnterOneWayDoorMessageComposer>>
{
    private _data: ConstructorParameters<typeof EnterOneWayDoorMessageComposer>;

    constructor(objectId: number)
    {
        super();
        this._data = [objectId];
    }

    // AS3: .../src/unknowns/_SafePkg_2609/_SafeCls_3749.as::getMessageArray()
    getMessageArray()
    {
        return this._data;
    }
}
