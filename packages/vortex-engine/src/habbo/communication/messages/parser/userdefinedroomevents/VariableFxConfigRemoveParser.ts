import type {IMessageParser} from '@core/communication/messages/IMessageParser';
import type {IMessageDataWrapper} from '@core/communication/messages/IMessageDataWrapper';

/**
 * The config ids the server is retracting. Without this message a config lives for the session.
 *
 * Class name derived: the AS3 parser is obfuscated (`_SafeCls_3360`) and exists in no other tree.
 * Its one member, `configIds`, is readable.
 *
 * @see sources/AIR-1.0.31/scripts/com/sulake/habbo/communication/messages/parser/userdefinedroomevents/_SafeCls_3360.as
 */
export class VariableFxConfigRemoveParser implements IMessageParser
{
    private _configIds: number[] = [];

    // AS3: .../parser/userdefinedroomevents/_SafeCls_3360.as::get configIds()
    get configIds(): number[]
    {
        return this._configIds;
    }

    // AS3: .../parser/userdefinedroomevents/_SafeCls_3360.as::flush()
    flush(): boolean
    {
        this._configIds = [];
        return true;
    }

    // AS3: .../parser/userdefinedroomevents/_SafeCls_3360.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        const count = wrapper.readInt();

        this._configIds = [];

        for(let i = 0; i < count; i += 1)
        {
            this._configIds.push(wrapper.readInt());
        }

        return true;
    }
}
