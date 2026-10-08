import type {EventEmitter} from 'eventemitter3';
import type {ILocalizable} from './ILocalizable';
import type {ILocalization} from './ILocalization';

/**
 * Events emitted by the localization manager
 *
 * Based on AS3 localization events:
 * - LOCALIZATION_EVENT_LOCALIZATION_LOADED
 * - LOCALIZATION_EVENT_LOCALIZATION_FAILED
 * - "complete" event
 */
export interface ILocalizationManagerEvents
{
    loaded: () => void;
    failed: () => void;
    complete: () => void;
}

/**
 * Core localization manager interface
 *
 * Based on AS3 com.sulake.core.localization.ICoreLocalizationManager
 */
export interface ICoreLocalizationManager
{
    /**
	 * Event emitter for localization events
	 */
    readonly events: EventEmitter;

    /**
	 * Register a listener for localization updates
	 */
    registerLocalizationListener(key: string, listener: ILocalizable): boolean;

    /**
	 * Remove a listener for localization updates
	 */
    removeLocalizationListener(key: string, listener: ILocalizable): boolean;

    /**
	 * Takes every text at once (the host reads them out of its bundle).
	 */
    // TS-only: replaces AS3's loadLocalizationFromURL().
    loadTexts(texts: Readonly<Record<string, string>>): void;

    /**
	 * Check if a localization key exists
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/localization/ICoreLocalizationManager.as::hasLocalization()
    hasLocalization(key: string): boolean;

    /**
	 * Get a localized string value
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/localization/ICoreLocalizationManager.as::getLocalization()
    /**
     * The text for a key, or null when there is none yet — a listener stand-in counts as absent.
     */
    // TS-only: no AS3 counterpart.
    getResolvedLocalization(key: string): string | null;

    getLocalization(key: string, defaultValue?: string): string;

    /**
	 * Get a property value with parameter substitution
	 */
    getProperty(key: string, params?: Record<string, string>): string;

    /**
	 * Update a localization value
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/localization/ICoreLocalizationManager.as::updateLocalization()
    updateLocalization(key: string, value: string): void;

    /**
	 * Register a parameter for a localization key
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/localization/ICoreLocalizationManager.as::registerParameter()
    registerParameter(key: string, paramName: string, paramValue: string, paramId?: string): string;

    /**
	 * Get raw localization object
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/localization/ICoreLocalizationManager.as::getLocalizationRaw()
    getLocalizationRaw(key: string): ILocalization | null;

    /**
	 * Get all localization keys
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/localization/ICoreLocalizationManager.as::getKeys()
    getKeys(): string[];

    /**
	 * Print all non-existing keys that were requested
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/localization/ICoreLocalizationManager.as::printNonExistingKeys()
    printNonExistingKeys(): void;

    /**
	 * Interpolate a string, replacing ${key} with localization values
	 */
    interpolate(value: string): string;
}
