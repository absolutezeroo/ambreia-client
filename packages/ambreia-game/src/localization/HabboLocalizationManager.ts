import type {IContext} from '../core/runtime/index';
import {CoreLocalizationManager} from '../core/localization/index';
import type {IHabboLocalizationManager} from './IHabboLocalizationManager';
import {BadgeBaseAndLevel} from './BadgeBaseAndLevel';

/**
 * Habbo-specific localization manager
 * Extends core localization with badge, achievement, and Habbo-specific features
 *
 * Based on AS3 com.sulake.habbo.localization.HabboLocalizationManager
 */
// DEVIATION: AS3 loads the texts on authentication, from the gamedata hashes, with the embedded
//   default_localizations under them. The client hands them over from its bundle (loadTexts()).
export class HabboLocalizationManager extends CoreLocalizationManager implements IHabboLocalizationManager
{
    private static readonly ROMAN_NUMERALS: string[] = [
        'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
        'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
        'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV', 'XXVI', 'XXVII', 'XXVIII', 'XXIX', 'XXX',
    ];

    private _badgePointLimits: Map<string, number> = new Map();

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/localization/HabboLocalizationManager.as constructor
    constructor(context: IContext, flags: number = 0)
    {
        super(context, flags);
    }

    // AS3: .../src/com/sulake/habbo/localization/HabboLocalizationManager.as::getLocalizationWithParams()
    getLocalizationWithParams(key: string, defaultValue: string = '', ...params: string[]): string
    {
        if(params && params.length > 0)
        {
            for(let i = 0; i < params.length / 2; i++)
            {
                this.registerParameter(key, params[i * 2], params[i * 2 + 1]);
            }
        }

        return this.getLocalization(key, defaultValue);
    }

    // AS3: .../src/com/sulake/habbo/localization/HabboLocalizationManager.as::getLocalizationWithParamMap()
    getLocalizationWithParamMap(key: string, defaultValue: string = '', paramMap?: Map<string, string>): string
    {
        if(paramMap)
        {
            for(const [paramKey, paramValue] of paramMap)
            {
                this.registerParameter(key, paramKey, paramValue);
            }
        }

        return this.getLocalization(key, defaultValue);
    }

    override getLocalization(key: string, defaultValue: string = ''): string
    {
        const localization = super.getLocalization(key, defaultValue);
        return this.interpolate(localization);
    }

    // AS3: .../src/com/sulake/habbo/localization/HabboLocalizationManager.as::getAchievementName()
    getAchievementName(badgeId: string): string
    {
        const badgeInfo = new BadgeBaseAndLevel(badgeId);

        const localizationKey = this.getExistingKey([
            'badge_name_al_' + badgeId,
            'badge_name_al_' + badgeInfo.base,
            'badge_name_' + badgeId,
            'badge_name_' + badgeInfo.base,
        ]);

        this.registerParameter(localizationKey, 'roman', this.getRomanNumeral(badgeInfo.level));

        const localization = this.getLocalization(localizationKey);
        return localization ?? '';
    }

    // AS3: .../src/com/sulake/habbo/localization/HabboLocalizationManager.as::getAchievementDesc()
    getAchievementDesc(badgeId: string, limit: number): string
    {
        const badgeInfo = new BadgeBaseAndLevel(badgeId);

        const localizationKey = this.getExistingKey([
            'badge_desc_al_' + badgeId,
            'badge_desc_al_' + badgeInfo.base,
            'badge_desc_' + badgeId,
            'badge_desc_' + badgeInfo.base,
        ]);

        this.registerParameter(localizationKey, 'limit', '' + limit);
        this.registerParameter(localizationKey, 'roman', this.getRomanNumeral(badgeInfo.level));

        return this.getLocalization(localizationKey);
    }

    // AS3: .../src/com/sulake/habbo/localization/HabboLocalizationManager.as::getAchievementInstruction()
    getAchievementInstruction(badgeId: string): string
    {
        const badgeInfo = new BadgeBaseAndLevel(badgeId);

        const localizationKey = this.getExistingKey(['badge_instruction_' + badgeInfo.base]);

        this.registerParameter(localizationKey, 'limit', '' + this.getBadgePointLimit(badgeId));

        const localization = this.getLocalization(localizationKey);
        return localization ?? '';
    }

    // AS3: .../src/com/sulake/habbo/localization/HabboLocalizationManager.as::getBadgeBaseName()
    getBadgeBaseName(badgeId: string): string
    {
        const badgeInfo = new BadgeBaseAndLevel(badgeId);
        return badgeInfo.base;
    }

    // AS3: .../src/com/sulake/habbo/localization/HabboLocalizationManager.as::getBadgeName()
    getBadgeName(badgeId: string): string
    {
        const badgeInfo = new BadgeBaseAndLevel(badgeId);

        const localizationKey = this.fixBadLocalization(
            this.getExistingKey(['badge_name_' + badgeId, 'badge_name_' + badgeInfo.base])
        );

        this.registerParameter(localizationKey, 'roman', this.getRomanNumeral(badgeInfo.level));

        return this.getLocalization(localizationKey);
    }

    // AS3: .../src/com/sulake/habbo/localization/HabboLocalizationManager.as::getBadgeDesc()
    getBadgeDesc(badgeId: string): string
    {
        const badgeInfo = new BadgeBaseAndLevel(badgeId);

        const localizationKey = this.fixBadLocalization(
            this.getExistingKey(['badge_desc_' + badgeId, 'badge_desc_' + badgeInfo.base])
        );

        this.registerParameter(localizationKey, 'limit', '' + this.getBadgePointLimit(badgeId));
        this.registerParameter(localizationKey, 'roman', this.getRomanNumeral(badgeInfo.level));

        const localization = this.getLocalization(localizationKey);
        return localizationKey === localization ? '' : localization;
    }

    // AS3: .../src/com/sulake/habbo/localization/HabboLocalizationManager.as::getPreviousLevelBadgeId()
    getPreviousLevelBadgeId(badgeId: string): string
    {
        const badgeInfo = new BadgeBaseAndLevel(badgeId);
        badgeInfo.level--;
        return badgeInfo.badgeId;
    }

    // AS3: .../src/com/sulake/habbo/localization/HabboLocalizationManager.as::setBadgePointLimit()
    setBadgePointLimit(badgeId: string, limit: number): void
    {
        this._badgePointLimits.set(badgeId, limit);
    }

    // AS3: .../src/com/sulake/habbo/localization/HabboLocalizationManager.as::getBadgePointLimit()
    private getBadgePointLimit(badgeId: string): number
    {
        return this._badgePointLimits.get(badgeId) ?? 0;
    }

    // AS3: .../src/com/sulake/habbo/localization/HabboLocalizationManager.as::getExistingKey()
    private getExistingKey(keys: string[]): string
    {
        for(const candidateKey of keys)
        {
            const value = this.getLocalization(candidateKey);
            if(value !== '')
            {
                return candidateKey;
            }
        }

        return keys[0];
    }

    // AS3: .../src/com/sulake/habbo/localization/HabboLocalizationManager.as::getRomanNumeral()
    private getRomanNumeral(level: number): string
    {
        return HabboLocalizationManager.ROMAN_NUMERALS[Math.max(0, level - 1)] ?? '';
    }

    // AS3: .../src/com/sulake/habbo/localization/HabboLocalizationManager.as::fixBadLocalization()
    private fixBadLocalization(localizationKey: string): string
    {
        let fixedKey = localizationKey.replace('${', '$');

        fixedKey = fixedKey.replace('{', '$');

        return fixedKey.replace('}', '$');
    }

    /**
	 * AS3 overrides dispose() only to call `super.dispose()` — it adds nothing and exists solely
	 * because the class declares the override. The base's dispose is inherited here instead.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/localization/HabboLocalizationManager.as::dispose()
    override dispose(): void
    {
        super.dispose();
    }
}
