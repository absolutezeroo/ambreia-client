import type {ICoreLocalizationManager} from '../core/localization/index';

/**
 * Habbo-specific localization manager interface
 *
 * Based on AS3 com.sulake.habbo.localization.IHabboLocalizationManager
 */
export interface IHabboLocalizationManager extends ICoreLocalizationManager
{
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
