import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Send event log for tracking.
 *
 * Header 3809, from WIN63's registry (`_composers[3809] = _SafeCls_2175`), which is what
 * `HabboMessages` registers; the emulator corroborates it as `EventLogMessageEvent`. The
 * "Message ID: 2297" this comment used to carry matched no registration in either tree.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2176/_SafeCls_2175.as
 * @see sources/win63_version/habbo/communication/messages/outgoing/tracking/EventLogMessageComposer.as (EventLogMessageComposer)
 */
export class EventLogMessageComposer extends MessageComposer<ConstructorParameters<typeof EventLogMessageComposer>>
{
    private _data: ConstructorParameters<typeof EventLogMessageComposer>;

    constructor(
        category: string,
        type: string,
        action: string,
        extraString: string = '',
        extraInt: number = 0
    )
    {
        super();

        this._data = [category, type, action, extraString, extraInt];
    }

    // AS3: .../src/unknowns/_SafePkg_2176/_SafeCls_2175.as::getMessageArray()
    getMessageArray()
    {
        return this._data;
    }
}
