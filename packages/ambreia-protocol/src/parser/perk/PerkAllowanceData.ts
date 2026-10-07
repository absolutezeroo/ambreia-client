/**
 * Perk allowance data.
 *
 * @see sources/win63_version/habbo/communication/messages/parser/perk/class_2995.as
 */
export class PerkAllowanceData
{
    private _code: string = '';
    private _isAllowed: boolean = false;
    private _errorMessage: string = '';

    // AS3: sources/win63_version/habbo/communication/messages/parser/perk/class_2995.as::get code()
    get code(): string
    {
        return this._code;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/perk/class_2995.as::set code()
    set code(value: string)
    {
        this._code = value;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/perk/class_2995.as::get isAllowed()
    get isAllowed(): boolean
    {
        return this._isAllowed;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/perk/class_2995.as::set isAllowed()
    set isAllowed(value: boolean)
    {
        this._isAllowed = value;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/perk/class_2995.as::get errorMessage()
    get errorMessage(): string
    {
        return this._errorMessage;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/perk/class_2995.as::set errorMessage()
    set errorMessage(value: string)
    {
        this._errorMessage = value;
    }
}
