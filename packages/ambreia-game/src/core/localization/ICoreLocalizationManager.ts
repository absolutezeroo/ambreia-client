import type {EventEmitter} from 'eventemitter3';
import type {ILocalizable} from './ILocalizable';
import type {ILocalization} from './ILocalization';
import type {ILocalizationDefinition} from './ILocalizationDefinition';
import type {IGameDataResources} from '@ambreia/common/localization/IGameDataResources';

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
	 * Load localization data from a URL
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/localization/ICoreLocalizationManager.as::loadLocalizationFromURL()
    loadLocalizationFromURL(url: string, environmentId: string, acceptEmpty?: boolean): void;

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
	 * Register a localization definition
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/localization/ICoreLocalizationManager.as::registerLocalizationDefinition()
    registerLocalizationDefinition(id: string, name: string, url: string, code: string): void;

    /**
	 * Activate a localization definition
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/localization/ICoreLocalizationManager.as::activateLocalizationDefinition()
    activateLocalizationDefinition(id: string): boolean;

    /**
	 * Get all localization definitions
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/localization/ICoreLocalizationManager.as::getLocalizationDefinitions()
    getLocalizationDefinitions(): Map<string, ILocalizationDefinition>;

    /**
	 * Get a specific localization definition
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/localization/ICoreLocalizationManager.as::getLocalizationDefinition()
    getLocalizationDefinition(id: string): ILocalizationDefinition | null;

    /**
	 * Get the currently active localization definition
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/localization/ICoreLocalizationManager.as::getActiveLocalizationDefinition()
    getActiveLocalizationDefinition(): ILocalizationDefinition | null;

    /**
	 * Print all non-existing keys that were requested
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/localization/ICoreLocalizationManager.as::printNonExistingKeys()
    printNonExistingKeys(): void;

    /**
	 * Get game data resources (hashes)
	 */
    getGameDataResources(): IGameDataResources | null;

    /**
	 * Interpolate a string, replacing ${key} with localization values
	 */
    interpolate(value: string): string;
}
