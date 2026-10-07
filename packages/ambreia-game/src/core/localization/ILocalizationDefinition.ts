/**
 * Interface for localization definition (language/region configuration)
 *
 * Based on AS3 com.sulake.core.localization.ILocalizationDefinition
 */
export interface ILocalizationDefinition
{
    /**
	 * Full identifier (e.g., "en_US.UTF-8")
	 */
    // AS3: .../src/com/sulake/core/localization/ILocalizationDefinition.as::get id()
    readonly id: string;

    /**
	 * Language code (e.g., "en")
	 */
    // AS3: .../src/com/sulake/core/localization/ILocalizationDefinition.as::get languageCode()
    readonly languageCode: string;

    /**
	 * Country code (e.g., "US")
	 */
    // AS3: .../src/com/sulake/core/localization/ILocalizationDefinition.as::get countryCode()
    readonly countryCode: string;

    /**
	 * Character encoding (e.g., "UTF-8")
	 */
    // AS3: .../src/com/sulake/core/localization/ILocalizationDefinition.as::get encoding()
    readonly encoding: string;

    /**
	 * Display name for this localization
	 */
    // AS3: .../src/com/sulake/core/localization/ILocalizationDefinition.as::get name()
    readonly name: string;

    /**
	 * URL to load localization data from
	 */
    // AS3: .../src/com/sulake/core/localization/ILocalizationDefinition.as::get url()
    readonly url: string;
}
