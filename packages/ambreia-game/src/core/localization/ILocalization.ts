/**
 * Interface for a localization entry
 *
 * Based on AS3 com.sulake.core.localization.ILocalization
 */
export interface ILocalization
{
    /**
	 * Whether this localization has been initialized with a value
	 */
    // AS3: .../src/com/sulake/core/localization/ILocalization.as::get isInitialized()
    readonly isInitialized: boolean;

    /**
	 * Whether the only value this entry carries is its own key — see `Localization._placeholder`.
	 */
    // TS-only: no AS3 counterpart.
    readonly isPlaceholder: boolean;

    /**
	 * Get the processed value with parameters filled in
	 */
    // AS3: .../src/com/sulake/core/localization/ILocalization.as::get value()
    readonly value: string;

    /**
	 * Get the raw value without parameter processing
	 */
    // AS3: .../src/com/sulake/core/localization/ILocalization.as::get raw()
    readonly raw: string;
}
