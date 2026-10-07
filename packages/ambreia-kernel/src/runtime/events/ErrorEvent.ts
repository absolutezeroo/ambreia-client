import {WarningEvent} from './WarningEvent';

/**
 * Error event data class.
 *
 * Extends WarningEvent with error category, criticality, and cause.
 *
 * @see sources/win63_version/core/runtime/events/ErrorEvent.as
 */
export class ErrorEvent extends WarningEvent
{
    constructor(type: string, message: string, critical: boolean, category: number, error: Error | null = null)
    {
        super(type, message);
        this._critical = critical;
        this._category = category;
        this._error = error;
    }

    private _category: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/events/ErrorEvent.as::get category()
    get category(): number
    {
        return this._category;
    }

    private _critical: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/events/ErrorEvent.as::get critical()
    get critical(): boolean
    {
        return this._critical;
    }

    private _error: Error | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/events/ErrorEvent.as::get error()
    get error(): Error | null
    {
        return this._error;
    }
}
