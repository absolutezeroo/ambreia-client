/**
 * Warning event data class.
 *
 * Used as a payload when emitting warning events through EventEmitter3.
 *
 * @see sources/win63_version/core/runtime/events/WarningEvent.as
 */
export class WarningEvent
{
    constructor(type: string, message: string | null)
    {
        this._type = type;
        this._message = message ?? 'undefined';
    }

    private _type: string;

    get type(): string
    {
        return this._type;
    }

    private _message: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/events/WarningEvent.as::get message()
    get message(): string
    {
        return this._message;
    }
}
