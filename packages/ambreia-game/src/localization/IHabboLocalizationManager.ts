import type {ICoreLocalizationManager} from '../core/localization/index';
import type {IHabboConfigurationManager} from '../configuration/IHabboConfigurationManager';
import type {IHabboCommunicationManager} from '../communication/IHabboCommunicationManager';

/**
 * Habbo-specific localization manager interface
 *
 * Based on AS3 com.sulake.habbo.localization.IHabboLocalizationManager
 */
export interface IHabboLocalizationManager extends ICoreLocalizationManager
{
    /**
	 * Set the configuration manager reference
	 */
    setConfigurationManager(configManager: IHabboConfigurationManager): void;

    /**
	 * Set the communication manager reference
	 * Used to listen for HABBO_CONNECTION_EVENT_AUTHENTICATED
	 * Based on AS3: context.events.addEventListener("HABBO_CONNECTION_EVENT_AUTHENTICATED", onAuthenticated)
	 */
    setCommunicationManager(commManager: IHabboCommunicationManager): void;

    /**
	 * Load default embedded localizations
	 */
    loadDefaultEmbedLocalizations(language: string, fallback?: boolean): boolean;

    /**
	 * TS-only: supplies the embedded `default_localizations*` texts that
	 * loadDefaultEmbedLocalizations() reads. AS3 gets them from its own embedded asset library.
	 */
    setEmbeddedLocalizationAssets(assets: Record<string, string>): void;

    /**
	 * Request localization initialization (triggers loading)
	 */
    requestLocalizationInit(): void;

    /**
	 * Get active environment ID
	 */
    getActiveEnvironmentId(): string;

    /**
	 * Get external variables URL
	 */
    getExternalVariablesUrl(): string;

    /**
	 * Get external variables hash
	 */
    getExternalVariablesHash(): string;

    /**
	 * Get localization with varargs parameters
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/localization/IHabboLocalizationManager.as::getLocalizationWithParams()
    getLocalizationWithParams(key: string, defaultValue?: string, ...params: string[]): string;

    /**
	 * Get localization with parameter map
	 */
    getLocalizationWithParamMap(key: string, defaultValue?: string, paramMap?: Map<string, string>): string;

    /**
	 * Get achievement name by badge ID
	 */
    getAchievementName(badgeId: string): string;

    /**
	 * Get achievement description by badge ID
	 */
    getAchievementDesc(badgeId: string, limit: number): string;

    /**
	 * Get achievement instruction by badge ID
	 */
    getAchievementInstruction(badgeId: string): string;

    /**
	 * Get badge base name from badge ID
	 */
    getBadgeBaseName(badgeId: string): string;

    /**
	 * Get badge display name
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/localization/IHabboLocalizationManager.as::getBadgeName()
    getBadgeName(badgeId: string): string;

    /**
	 * Get badge description
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/localization/IHabboLocalizationManager.as::getBadgeDesc()
    getBadgeDesc(badgeId: string): string;

    /**
	 * Set badge point limit for a badge
	 */
    setBadgePointLimit(badgeId: string, limit: number): void;

    /**
	 * Get previous level badge ID
	 */
    getPreviousLevelBadgeId(badgeId: string): string;
}
