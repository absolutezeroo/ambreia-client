import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';

/**
 * SpecialRoomEffectMessageParser — a room-wide special effect was triggered (WIN63 header 536).
 * A single id selects which one: 0 rotate, 1 shake, 2 zoom out, 3 disco.
 *
 * Name derived: fully obfuscated in AS3 (class `_SafeCls_2762`); named after its readable consumer
 * `RoomMessageHandler.onSpecialRoomEvent` and its only field.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2184/_SafeCls_2762.as
 */
export class SpecialRoomEffectMessageParser implements IMessageParser
{
    // AS3: _SafeCls_2762.as::_SafeStr_7207 (name recovered from `get effectId()`)
    private _effectId: number = -1;

    // AS3: _SafeCls_2762.as::get effectId()
    get effectId(): number
    {
        return this._effectId;
    }

    // AS3: _SafeCls_2762.as::flush()
    flush(): boolean
    {
        this._effectId = -1;
        return true;
    }

    // AS3: _SafeCls_2762.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        // AS3 has no null guard on this parser, unlike every neighbour — preserved verbatim.
        this._effectId = wrapper.readInt();
        return true;
    }
}
