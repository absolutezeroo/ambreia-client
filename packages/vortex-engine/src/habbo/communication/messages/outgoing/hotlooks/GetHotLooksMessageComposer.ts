import {MessageComposer} from '@core/communication/messages/MessageComposer';
import {Byte} from '@core/communication/util/Byte';

/**
 * "Send me up to N featured looks." The server answers with `HotLooksMessageEvent`.
 *
 * The count goes on the wire as a **byte**, not an integer — `HotLooksModel` asks for 20, which
 * fits, but anything past 255 would not. Header **3834**, from WIN63's registry
 * (`_composers[3834] = _SafeCls_2572`); the emulator corroborates it as
 * `GetHotLooksMessageEvent`, which is where the name comes from. Class name DERIVED.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2573/_SafeCls_2572.as
 */
export class GetHotLooksMessageComposer extends MessageComposer<[Byte]>
{
    // AS3: .../src/unknowns/_SafePkg_2573/_SafeCls_2572.as::_data
    // Name DERIVED (`_SafeStr_4642`).
    private _data: [Byte];

    // AS3: .../src/unknowns/_SafePkg_2573/_SafeCls_2572.as::_SafeCls_2572()
    constructor(count: number)
    {
        super();

        this._data = [new Byte(count)];
    }

    // AS3: .../src/unknowns/_SafePkg_2573/_SafeCls_2572.as::getMessageArray()
    getMessageArray(): [Byte]
    {
        return this._data;
    }
}
