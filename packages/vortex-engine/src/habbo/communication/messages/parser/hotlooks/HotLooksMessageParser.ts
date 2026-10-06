import type {IMessageParser} from '@core/communication/messages/IMessageParser';
import type {IMessageDataWrapper} from '@core/communication/messages/IMessageDataWrapper';
import {HotLookItem} from './HotLookItem';

/**
 * The hotel's featured looks: a count, then that many `HotLookItem` records. No state flag, unlike
 * the wardrobe.
 *
 * Class name DERIVED: the AS3 parser is `_SafeCls_4180.as`; named after the emulator's
 * `HotLooksMessageComposer` (header 3853).
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_4181/_SafeCls_4180.as
 */
export class HotLooksMessageParser implements IMessageParser
{
    // AS3: .../src/unknowns/_SafePkg_4181/_SafeCls_4180.as::_hotLooks
    // Name DERIVED (`_SafeStr_5498`): the field behind `get hotLooks()`. AS3 leaves it
    // **uninitialised** until `flush()` runs, so a parse before the first flush would throw there;
    // initialised here, which is what every other ported parser does.
    private _hotLooks: HotLookItem[] = [];

    // AS3: .../src/unknowns/_SafePkg_4181/_SafeCls_4180.as::get hotLooks()
    get hotLooks(): HotLookItem[]
    {
        return this._hotLooks;
    }

    // AS3: .../src/unknowns/_SafePkg_4181/_SafeCls_4180.as::flush()
    flush(): boolean
    {
        this._hotLooks = [];

        return true;
    }

    // AS3: .../src/unknowns/_SafePkg_4181/_SafeCls_4180.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        const count = wrapper.readInt();

        for(let index = 0; index < count; index++)
        {
            this._hotLooks.push(new HotLookItem(wrapper));
        }

        return true;
    }
}
