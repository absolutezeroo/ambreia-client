/**
 * Interface for objects that can receive localized text updates
 *
 * Based on AS3 com.sulake.core.localization.ILocalizable
 */
export interface ILocalizable
{
    /**
	 * Set the localized text value
	 */
    // AS3: .../src/com/sulake/core/localization/ILocalizable.as::set localization()
    set localization(value: string);
}
