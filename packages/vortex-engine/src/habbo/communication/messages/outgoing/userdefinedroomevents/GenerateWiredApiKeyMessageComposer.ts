import {MessageComposer} from '@core/communication/messages/MessageComposer';

/**
 * Asks the server to mint (or re-mint) one of a wired furni's two web-API keys. `readKey` picks
 * which of the two, and comes back on the answer so the add-on knows which field to fill.
 *
 * Class name derived: the AS3 composer is obfuscated (`_SafeCls_2768`) and exists in no other
 * tree. Named for what its two call sites do — `VariablesWebApiAddon.onClickGeneratedReadKey()`
 * and `onClickGeneratedWriteKey()`, both readable in the AIR dump.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/communication/messages/outgoing/userdefinedroomevents/_SafeCls_2768.as
 */
export class GenerateWiredApiKeyMessageComposer extends MessageComposer<[number, boolean]>
{
    // AS3: .../outgoing/userdefinedroomevents/_SafeCls_2768.as::_messageArray (name derived)
    private _data: [number, boolean];

    // AS3: .../outgoing/userdefinedroomevents/_SafeCls_2768.as::_SafeCls_2768()
    constructor(wiredId: number, readKey: boolean)
    {
        super();
        this._data = [wiredId, readKey];
    }

    // AS3: .../outgoing/userdefinedroomevents/_SafeCls_2768.as::getMessageArray()
    getMessageArray(): [number, boolean]
    {
        return this._data;
    }
}
