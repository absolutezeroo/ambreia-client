import type {IContext} from '@core/runtime';
import {Logger} from '@ambreia/common/utils/Logger';
import {Core} from '@ambreia/kernel/Core';
import {CoreLocalizationManager} from '@core/localization';
import type {IHabboConfigurationManager} from '@habbo/configuration/IHabboConfigurationManager';
import type {IHabboCommunicationManager} from '@habbo/communication/IHabboCommunicationManager';
import type {IHabboLocalizationManager} from './IHabboLocalizationManager';
import {BadgeBaseAndLevel} from './BadgeBaseAndLevel';
import {HabboCommunicationEvent, type HabboCommunicationEventType} from '@habbo/communication/enum';
import {HabboConfigurationFlags} from '@habbo/configuration/enum/HabboConfigurationFlags';
import {LocalizationEvent} from '@core/localization/LocalizationEvent';

const log = Logger.getLogger('habbo.localization.HabboLocalizationManager');

/**
 * Habbo-specific localization manager
 * Extends core localization with badge, achievement, and Habbo-specific features
 *
 * Based on AS3 com.sulake.habbo.localization.HabboLocalizationManager
 */
export class HabboLocalizationManager extends CoreLocalizationManager implements IHabboLocalizationManager
{
    private static readonly ROMAN_NUMERALS: string[] = [
        'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
        'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
        'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV', 'XXVI', 'XXVII', 'XXVIII', 'XXIX', 'XXX',
    ];

    private _isLocalizationInitialized: boolean = false;
    private _badgePointLimits: Map<string, number> = new Map();
    private _configurationManager: IHabboConfigurationManager | null = null;
    private _communicationManager: IHabboCommunicationManager | null = null;
    // AS3: .../src/com/sulake/habbo/localization/HabboLocalizationManager.as::_skipExternals
    private _skipExternals: boolean = false;
    private _boundOnLoginStep: ((step: HabboCommunicationEventType) => void) | null = null;

    /**
     * TS-only: the embedded `default_localizations*` texts, keyed by asset name.
     *
     * AS3 reads these off its own asset library (`assets.getAssetByName("default_localizations_en")`),
     * which is populated from the embedded HabboLocalizationCom library. The port has no embedded
     * SWF library, so the host hands the same texts in here — see `setEmbeddedLocalizationAssets()`.
     */
    private _embeddedLocalizations: Record<string, string> = {};

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/localization/HabboLocalizationManager.as constructor
    constructor(context: IContext, flags: number = 0)
    {
        super(context, flags);

        this._skipExternals = (flags & HabboConfigurationFlags.SKIP_EXTERNAL_VARIABLES) > 0;
    }

    /**
	 * Set the configuration manager reference
	 */
    setConfigurationManager(configManager: IHabboConfigurationManager): void
    {
        this._configurationManager = configManager;

        this.configureLocalizationLocations();
    }

    /**
	 * Set the communication manager reference
	 */
    setCommunicationManager(commManager: IHabboCommunicationManager): void
    {
        this._communicationManager = commManager;

        if(this._skipExternals)
        {
            this.events.emit('complete');
        }
        else
        {
            // Listen for AUTHENTICATED event to trigger localization loading
            this._boundOnLoginStep = (step: HabboCommunicationEventType) =>
            {
                if(step === HabboCommunicationEvent.AUTHENTICATED)
                {
                    this.onAuthenticated();
                }
            };
            this._communicationManager.events.on('loginStep', this._boundOnLoginStep);
        }
    }

    /**
     * TS-only: supplies the embedded `default_localizations*` texts.
     *
     * These are what the login flow renders with — it runs before any external text file has been
     * fetched, so without them every caption on the login screens shows its raw `${key}`.
     */
    setEmbeddedLocalizationAssets(assets: Record<string, string>): void
    {
        this._embeddedLocalizations = assets ?? {};
    }

    /**
     * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/localization/HabboLocalizationManager.as::loadDefaultEmbedLocalizations()
     *
     * The global english-only file is ALWAYS parsed, then the language-specific one on top of it —
     * so a key present in both takes the localised value. A missing language falls back to `en`
     * once (`fallback` guards the recursion).
     */
    // AS3: .../src/com/sulake/habbo/localization/HabboLocalizationManager.as::loadDefaultEmbedLocalizations()
    loadDefaultEmbedLocalizations(language: string, fallback: boolean = true): boolean
    {
        const languageAssetName = `default_localizations_${language}`;
        const languageData = this._embeddedLocalizations[languageAssetName];

        if(!languageData && language !== 'en' && fallback)
        {
            log.debug(`Could not load default localizations ${languageAssetName} : Trying with default_localizations_en...`);

            return this.loadDefaultEmbedLocalizations('en', false);
        }

        const globalData = this._embeddedLocalizations['default_localizations'];

        if(globalData)
        {
            this.parseLocalizationData(globalData);
        }

        if(languageData)
        {
            this.parseLocalizationData(languageData);

            return true;
        }

        // Nothing rendered before the external texts land, and nothing throws — so this has to be
        // visible rather than a debug line.
        log.warn(`Could not load ${languageAssetName}`);

        return false;
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

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/localization/HabboLocalizationManager.as::getExternalVariablesUrl()
    getExternalVariablesUrl(): string
    {
        return this.getGameDataResources()?.externalVariablesUrl ?? '';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/localization/HabboLocalizationManager.as::getExternalVariablesHash()
    getExternalVariablesHash(): string
    {
        return this.getGameDataResources()?.externalVariablesHash ?? '';
    }

    /**
	 * Any game-data resource by name, for the callers that need one the four named pairs above do
	 * not cover.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/localization/HabboLocalizationManager.as::getGameDataResourceUrl()
    getGameDataResourceUrl(name: string): string
    {
        return this.getGameDataResources()?.getResourceUrl(name) ?? '';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/localization/HabboLocalizationManager.as::getGameDataResourceHash()
    getGameDataResourceHash(name: string): string
    {
        return this.getGameDataResources()?.getResourceHash(name) ?? '';
    }

    override getActiveEnvironmentId(): string
    {
        return super.getActiveEnvironmentId();
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

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/localization/HabboLocalizationManager.as::requestLocalizationInit()
    requestLocalizationInit(): void
    {
        if(this._isLocalizationInitialized)
        {
            return;
        }

        if(!this._configurationManager)
        {
            log.error('Configuration manager not set');
            return;
        }

        this._isLocalizationInitialized = true;

        // The two names the base manager actually emits. This listened for `'loaded'` and
        // `'failed'`, which nothing anywhere raises — `CoreLocalizationManager` emits
        // `LocalizationEvent.LOCALIZATION_LOADED` / `_FAILED`, whose values are AS3's own
        // `LOCALIZATION_EVENT_*` strings. So neither arm had ever run: the ready flag stayed
        // set, `complete` was never announced, and a failed gamedata load never crashed the
        // client the way AS3 makes it.
        this.events.once(LocalizationEvent.LOCALIZATION_LOADED, () =>
        {
            this._isLocalizationInitialized = false;
            log.info('Localizations ready');

            // AS3: `localizationsReady()` dispatches a plain `complete` outward, which is what
            // the rest of the boot waits on.
            this.events.emit('complete');
        });

        this.events.once(LocalizationEvent.LOCALIZATION_FAILED, () =>
        {
            this._isLocalizationInitialized = false;
            Core.crash('Failed loading gamedata hashes', 8);
        });

        const hashesUrl = this._configurationManager.getProperty('gamedata.hashes.url');
        const environmentId = this._configurationManager.getProperty('environment.id');

        super.loadLocalizationFromURL(hashesUrl, environmentId);
    }

    protected override initComponent(): void
    {
        super.initComponent();

        log.debug('HabboLocalizationManager initialized');
    }

    /**
	 * Called when authentication is complete
	 * Based on AS3:
	 * ```
	 * private function onAuthenticated(event: Event): void {
	 *     requestLocalizationInit();
	 * }
	 * ```
	 */
    // AS3: .../src/com/sulake/habbo/localization/HabboLocalizationManager.as::onAuthenticated()
    private onAuthenticated(): void
    {
        this.requestLocalizationInit();
    }

    // AS3: .../src/com/sulake/habbo/localization/HabboLocalizationManager.as::configureLocalizationLocations()
    private configureLocalizationLocations(): void
    {
        if(!this._configurationManager)
        {
            return;
        }

        let index = 1;

        while(this._configurationManager.propertyExists('localization.' + index))
        {
            const localizationName = this._configurationManager.getProperty('localization.' + index);
            const localizationCode = this._configurationManager.getProperty('localization.' + index + '.code');
            const localizationDisplayName = this._configurationManager.getProperty('localization.' + index + '.name');
            const localizationUrl = this._configurationManager.getProperty('localization.' + index + '.url');

            super.registerLocalizationDefinition(localizationName, localizationDisplayName, localizationUrl, localizationCode);

            index++;
        }
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
