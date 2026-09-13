import type {IMessageParser} from '@core/communication/messages/IMessageParser';
import type {IMessageDataWrapper} from '@core/communication/messages/IMessageDataWrapper';
import {OrderedMap} from '@core/utils/OrderedMap';
import {VariableFxStatusUpdateData} from '@habbo/room/object/variablefx/VariableFxStatusUpdateData';

/**
 * The live VariableFx values for a room — one entry per (config, variable, entity).
 *
 * Two things in the wire shape are easy to lose:
 *
 *   - the packet opens with a **single** `isInitialize` boolean that applies to every entry, and
 *     each entry's own flag is OR'd with it, not replaced by it. Reading the per-entry flag alone
 *     turns a whole-room initial sync into a stream of incremental updates.
 *   - the override bounds are behind a presence flag and are longs. When the flag is false they
 *     are absent from the packet entirely — reading them anyway desyncs everything after.
 *
 * Class name derived: the AS3 parser is obfuscated (`_SafeCls_2687`) and exists in no other tree.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/communication/messages/parser/userdefinedroomevents/_SafeCls_2687.as
 */
export class VariableFxStatusUpdateParser implements IMessageParser
{
    private _statuses: VariableFxStatusUpdateData[] = [];

    // AS3: .../parser/userdefinedroomevents/_SafeCls_2687.as::get statuses()
    get statuses(): VariableFxStatusUpdateData[]
    {
        return this._statuses;
    }

    // AS3: .../parser/userdefinedroomevents/_SafeCls_2687.as::flush()
    flush(): boolean
    {
        this._statuses = [];
        return true;
    }

    // AS3: .../parser/userdefinedroomevents/_SafeCls_2687.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        const initializeAll = wrapper.readBoolean();
        const count = wrapper.readInt();

        this._statuses = [];

        for(let i = 0; i < count; i += 1)
        {
            const statusKey = wrapper.readString();
            const isInitialize = wrapper.readBoolean() || initializeAll;
            const isUserEntity = wrapper.readBoolean();
            const entityId = wrapper.readInt();
            const value = wrapper.readLong();

            let overrideMinValue: number | null = null;
            let overrideMaxValue: number | null = null;

            if(wrapper.readBoolean())
            {
                overrideMinValue = wrapper.readLong();
                overrideMaxValue = wrapper.readLong();
            }

            const extra = new OrderedMap<string, string>();
            const extraCount = wrapper.readInt();

            for(let j = 0; j < extraCount; j += 1)
            {
                extra.add(wrapper.readString(), wrapper.readString());
            }

            this._statuses.push(new VariableFxStatusUpdateData(
                statusKey,
                isInitialize,
                isUserEntity,
                entityId,
                value,
                overrideMinValue,
                overrideMaxValue,
                extra
            ));
        }

        return true;
    }
}
