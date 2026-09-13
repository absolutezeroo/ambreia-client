import type {IMessageParser} from '@core/communication/messages/IMessageParser';
import type {IMessageDataWrapper} from '@core/communication/messages/IMessageDataWrapper';
import {VariableFxStatusRemoveData} from '@habbo/room/object/variablefx/VariableFxStatusRemoveData';

/**
 * The statuses the server is retracting, each identified by its packed
 * `"<configId>|<variableId>|<u|f>|<entityId>"` key — the splitting is `VariableFxStatusRemoveData`'s.
 *
 * Class name derived: the AS3 parser is obfuscated (`_SafeCls_3059`) and exists in no other tree.
 *
 * @see sources/AIR-1.0.31/scripts/com/sulake/habbo/communication/messages/parser/userdefinedroomevents/_SafeCls_3059.as
 */
export class VariableFxStatusRemoveParser implements IMessageParser
{
    private _statuses: VariableFxStatusRemoveData[] = [];

    // AS3: .../parser/userdefinedroomevents/_SafeCls_3059.as::get statuses()
    get statuses(): VariableFxStatusRemoveData[]
    {
        return this._statuses;
    }

    // AS3: .../parser/userdefinedroomevents/_SafeCls_3059.as::flush()
    flush(): boolean
    {
        this._statuses = [];
        return true;
    }

    // AS3: .../parser/userdefinedroomevents/_SafeCls_3059.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        const count = wrapper.readInt();

        this._statuses = [];

        for(let i = 0; i < count; i += 1)
        {
            this._statuses.push(new VariableFxStatusRemoveData(wrapper.readString()));
        }

        return true;
    }
}
