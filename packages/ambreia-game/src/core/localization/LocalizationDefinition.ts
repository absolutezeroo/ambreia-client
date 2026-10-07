import type {ILocalizationDefinition} from './ILocalizationDefinition';

/**
 * Localization definition for a specific language/region
 *
 * Based on AS3 com.sulake.core.localization.LocalizationDefinition
 */
export class LocalizationDefinition implements ILocalizationDefinition
{
    // AS3: .../src/com/sulake/core/localization/LocalizationDefinition.as::_languageCode
    private readonly _languageCode: string;
    // AS3: .../src/com/sulake/core/localization/LocalizationDefinition.as::_countryCode
    private readonly _countryCode: string;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/localization/LocalizationDefinition.as::_encoding
    private readonly _encoding: string;
    // AS3: .../src/com/sulake/core/localization/LocalizationDefinition.as::_name
    private readonly _name: string;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/localization/LocalizationDefinition.as::_url
    private readonly _url: string;

    constructor(code: string, name: string, url: string)
    {
        // Parse code like "en_US.UTF-8"
        const parts = code.split('_');
        this._languageCode = parts[0];

        const subParts = String(parts[1]).split('.');
        this._countryCode = subParts[0];
        this._encoding = subParts[1];

        this._name = name;
        this._url = url;
    }

    // AS3: .../src/com/sulake/core/localization/LocalizationDefinition.as::get id()
    get id(): string
    {
        return this._languageCode + '_' + this._countryCode + '.' + this._encoding;
    }

    // AS3: .../src/com/sulake/core/localization/LocalizationDefinition.as::get languageCode()
    get languageCode(): string
    {
        return this._languageCode;
    }

    // AS3: .../src/com/sulake/core/localization/LocalizationDefinition.as::get countryCode()
    get countryCode(): string
    {
        return this._countryCode;
    }

    // AS3: .../src/com/sulake/core/localization/LocalizationDefinition.as::get encoding()
    get encoding(): string
    {
        return this._encoding;
    }

    // AS3: .../src/com/sulake/core/localization/LocalizationDefinition.as::get name()
    get name(): string
    {
        return this._name;
    }

    // AS3: .../src/com/sulake/core/localization/LocalizationDefinition.as::get url()
    get url(): string
    {
        return this._url;
    }
}
