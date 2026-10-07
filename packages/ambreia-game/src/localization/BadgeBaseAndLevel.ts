/**
 * Utility class for parsing badge IDs into base name and level
 *
 * Based on AS3 com.sulake.habbo.localization.BadgeBaseAndLevel
 */
export class BadgeBaseAndLevel
{
    constructor(badgeId: string)
    {
        // Find where the numeric suffix starts
        let index = badgeId.length - 1;

        while(index > 0 && this.isNumber(badgeId.charAt(index)))
        {
            index--;
        }

        this._base = badgeId.substring(0, index + 1);

        const levelStr = badgeId.substring(index + 1, badgeId.length);

        if(levelStr !== null && levelStr !== '')
        {
            this._level = parseInt(levelStr, 10);
        }
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/localization/BadgeBaseAndLevel.as::_base
    private _base: string = '';

    // AS3: .../src/com/sulake/habbo/localization/BadgeBaseAndLevel.as::get base()
    get base(): string
    {
        return this._base;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/localization/BadgeBaseAndLevel.as::_level
    private _level: number = 1;

    // AS3: .../src/com/sulake/habbo/localization/BadgeBaseAndLevel.as::get level()
    get level(): number
    {
        return this._level;
    }

    // AS3: .../src/com/sulake/habbo/localization/BadgeBaseAndLevel.as::set level()
    set level(value: number)
    {
        this._level = Math.max(1, value);
    }

    // AS3: .../src/com/sulake/habbo/localization/BadgeBaseAndLevel.as::get badgeId()
    get badgeId(): string
    {
        return this._base + this._level;
    }

    // AS3: .../src/com/sulake/habbo/localization/BadgeBaseAndLevel.as::isNumber()
    private isNumber(char: string): boolean
    {
        const code = char.charCodeAt(0);
        return code >= 48 && code <= 57; // '0' to '9'
    }
}
