/**
 * AvatarData
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/login/AvatarData.as
 *
 * Data model for an avatar returned by the login Web API.
 * Parsed from the JSON response of /api/user/avatars.
 */
export class AvatarData
{
    private _id: number;
    private _uniqueId: string;
    // AS3: .../src/com/sulake/habbo/communication/login/AvatarData.as::_name
    private _name: string;
    private _motto: string;
    private _figure: string;
    private _gender: string;
    private _headFigure: string;
    private _lastAccess: number;
    // AS3: .../src/com/sulake/habbo/communication/login/AvatarData.as::_creationTime
    private _creationTime: string;

    constructor(data: Record<string, unknown>)
    {
        this._id = 0;
        this._uniqueId = (data.uniqueId as string) ?? '';
        this._name = (data.name as string) ?? '';
        this._motto = (data.motto as string) ?? '';
        this._figure = (data.figureString as string) ?? '';
        this._gender = (data.gender as string) ?? '';
        this._headFigure = '';
        this._lastAccess = (data.lastWebAccess as number) ?? 0;
        this._creationTime = (data.creationTime as string) ?? '';
    }

    // AS3: .../src/com/sulake/habbo/communication/login/AvatarData.as::get id()
    get id(): number
    {
        return this._id;
    }

    // AS3: .../src/com/sulake/habbo/communication/login/AvatarData.as::set id()
    set id(value: number)
    {
        this._id = value;
    }

    // AS3: .../src/com/sulake/habbo/communication/login/AvatarData.as::get uniqueId()
    get uniqueId(): string
    {
        return this._uniqueId;
    }

    // AS3: .../src/com/sulake/habbo/communication/login/AvatarData.as::get name()
    get name(): string
    {
        return this._name;
    }

    // AS3: .../src/com/sulake/habbo/communication/login/AvatarData.as::set name()
    set name(value: string)
    {
        this._name = value;
    }

    // AS3: .../src/com/sulake/habbo/communication/login/AvatarData.as::get motto()
    get motto(): string
    {
        return this._motto;
    }

    // AS3: .../src/com/sulake/habbo/communication/login/AvatarData.as::get figure()
    get figure(): string
    {
        return this._figure;
    }

    // AS3: .../src/com/sulake/habbo/communication/login/AvatarData.as::get gender()
    get gender(): string
    {
        return this._gender;
    }

    // AS3: .../src/com/sulake/habbo/communication/login/AvatarData.as::get head_figure()
    // AS3 spells these two snake_case because the class mirrors a web-API payload; camelCased here
    // to match every other accessor on it and rule 10. The two are the only such names in the class.
    get headFigure(): string
    {
        return this._headFigure;
    }

    // AS3: .../src/com/sulake/habbo/communication/login/AvatarData.as::get last_access()
    get lastAccess(): number
    {
        return this._lastAccess;
    }
}
