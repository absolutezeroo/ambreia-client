import type {IMessageParser} from '@core/communication/messages/IMessageParser';
import type {IMessageDataWrapper} from '@core/communication/messages/IMessageDataWrapper';

/**
 * The key the server just minted for one wired furni, read or write.
 *
 * `isReadKey` is the same flag the request carried, echoed back: one add-on holds two of these
 * sections and the answers are told apart by it, not by order.
 *
 * Class name derived: the AS3 parser is obfuscated (`_SafeCls_4356`) and exists in no other tree.
 * Named after the add-on handler that consumes it, `VariablesWebApiAddon.onWiredApiKeyResultEvent()`,
 * which is readable in the AIR dump.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/communication/messages/parser/userdefinedroomevents/_SafeCls_4356.as
 */
export class WiredApiKeyResultParser implements IMessageParser
{
    private _wiredId: number = -1;

    private _isReadKey: boolean = false;

    private _key: string = '';

    // AS3: .../parser/userdefinedroomevents/_SafeCls_4356.as::get wiredId()
    get wiredId(): number
    {
        return this._wiredId;
    }

    // AS3: .../parser/userdefinedroomevents/_SafeCls_4356.as::get isReadKey()
    get isReadKey(): boolean
    {
        return this._isReadKey;
    }

    // AS3: .../parser/userdefinedroomevents/_SafeCls_4356.as::get key()
    get key(): string
    {
        return this._key;
    }

    // AS3: .../parser/userdefinedroomevents/_SafeCls_4356.as::flush()
    flush(): boolean
    {
        this._wiredId = -1;
        this._isReadKey = false;
        this._key = '';

        return true;
    }

    // AS3: .../parser/userdefinedroomevents/_SafeCls_4356.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        this._wiredId = wrapper.readInt();
        this._isReadKey = wrapper.readBoolean();
        this._key = wrapper.readString();

        return true;
    }
}
