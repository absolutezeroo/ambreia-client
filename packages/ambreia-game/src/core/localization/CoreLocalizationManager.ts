import {Component, type IContext} from '../runtime/index';
import {Logger} from '@ambreia/common/utils/Logger';
import type {ICoreLocalizationManager} from './ICoreLocalizationManager';
import type {ILocalizable} from './ILocalizable';
import type {ILocalization} from './ILocalization';
import {Localization} from './Localization';

const log = Logger.getLogger('core.localization.CoreLocalizationManager');

/**
 * Core localization manager
 * Manages localized text with support for:
 * - Key-value storage
 * - Parameter substitution (%param% syntax)
 * - Interpolation (${key} syntax)
 * - Listener notifications
 */
// DEVIATION: AS3 loads the texts itself, from the gamedata hashes and their external_texts files,
//   per registered localization definition. Here the host reads them out of its own bundle and
//   hands them over (loadTexts()), so neither the definitions nor the download exist.
export class CoreLocalizationManager extends Component implements ICoreLocalizationManager 
{
    // AS3: .../src/com/sulake/core/localization/CoreLocalizationManager.as::INTERPOLATION_DEPTH_LIMIT
    private static readonly INTERPOLATION_DEPTH_LIMIT = 3;

    protected _localizations: Map<string, Localization> = new Map();
    protected _nonExistingKeys: string[] = [];

    constructor(context: IContext, flags: number = 0) 
    {
        super(context, flags);
    }

    /**
     * Takes every text at once and tells the listeners: the host reads them out of its bundle.
     * A key already present keeps its listeners and takes the new value.
     */
    // TS-only: replaces AS3's download (loadLocalizationFromURL() and parseLocalizationData()).
    public loadTexts(texts: Readonly<Record<string, string>>): void
    {
        for(const [key, value] of Object.entries(texts)) this.updateLocalization(key, value);

        this.updateAllListeners();

        log.info(`Loaded ${Object.keys(texts).length} texts`);
    }

    // AS3: .../src/com/sulake/core/localization/CoreLocalizationManager.as::hasLocalization()
    public hasLocalization(key: string): boolean 
    {
        return this._localizations.has(key);
    }

    // AS3: .../src/com/sulake/core/localization/CoreLocalizationManager.as::getLocalization()
    public getLocalization(key: string, defaultValue: string = ''): string 
    {
        const localization = this._localizations.get(key);

        if(!localization) 
        {
            this._nonExistingKeys.push(key);
            return defaultValue;
        }

        return localization.value;
    }

    public getProperty(key: string, params?: Record<string, string>): string 
    {
        let value = this.getLocalization(key);

        if(params) 
        {
            for(const [paramKey, paramValue] of Object.entries(params)) 
            {
                value = value.replace(new RegExp(`%${paramKey}%`, 'g'), paramValue);
            }
        }

        return value;
    }

    // AS3: .../src/com/sulake/core/localization/CoreLocalizationManager.as::updateLocalization()
    public updateLocalization(key: string, value: string): void 
    {
        let localization = this._localizations.get(key);

        if(!localization) 
        {
            localization = new Localization(this, key, value);

            this._localizations.set(key, localization);
        }
        else 
        {
            localization.setValue(value);
        }
    }

    public registerLocalizationListener(key: string, listener: ILocalizable): boolean 
    {
        let localization = this._localizations.get(key);

        if(!localization) 
        {
            this._nonExistingKeys.push(key);

            // Marked as a stand-in: it exists only so this listener has something to receive now,
            // and it must not answer a later `${key}` lookup as though the text had arrived.
            localization = new Localization(this, key, key, true);

            this._localizations.set(key, localization);
        }

        localization.registerListener(listener);
        return true;
    }

    /**
	 * The text for a key, or null when there is none *yet*.
	 *
	 * Unlike `getLocalization()`, an entry that is only a listener stand-in counts as absent — it
	 * carries its own key as its value, and answering with that is what painted `wiredchests.withdraw`
	 * on a button. Callers that resolve `${key}` tokens into a window want this one.
	 */
    // TS-only: no AS3 counterpart; AS3 resolves no tokens through this table.
    public getResolvedLocalization(key: string): string | null
    {
        const localization = this._localizations.get(key);

        if(!localization || localization.isPlaceholder) return null;

        const value = localization.value;

        return value !== '' ? value : null;
    }

    public removeLocalizationListener(key: string, listener: ILocalizable): boolean 
    {
        const localization = this._localizations.get(key);

        if(localization) 
        {
            localization.removeListener(listener);
        }

        return true;
    }

    // AS3: .../src/com/sulake/core/localization/CoreLocalizationManager.as::registerParameter()
    public registerParameter(key: string, paramName: string, paramValue: string, paramId: string = '%'): string 
    {
        let localization = this._localizations.get(key);

        if(!localization) 
        {
            localization = new Localization(this, key, key);

            this._localizations.set(key, localization);
        }

        localization.registerParameter(paramName, paramValue, paramId);

        return localization.value;
    }

    // AS3: .../src/com/sulake/core/localization/CoreLocalizationManager.as::getLocalizationRaw()
    public getLocalizationRaw(key: string): ILocalization | null 
    {
        return this._localizations.get(key) ?? null;
    }

    // AS3: .../src/com/sulake/core/localization/CoreLocalizationManager.as::getKeys()
    public getKeys(): string[] 
    {
        return Array.from(this._localizations.keys());
    }

    // AS3: .../src/com/sulake/core/localization/CoreLocalizationManager.as::printNonExistingKeys()
    public printNonExistingKeys(): void 
    {
        if(this._nonExistingKeys.length > 0) 
        {
            log.warn('Non-existing localization keys:');

            for(const key of this._nonExistingKeys) 
            {
                log.warn(`  - ${key}`);
            }
        }
    }

    public override interpolate(value: string): string
    {
        if(!value) 
        {
            return value;
        }

        const regex = /\$\{([^}]*)\}/g;
        let result = value;

        for(let depth = 0; depth < CoreLocalizationManager.INTERPOLATION_DEPTH_LIMIT; depth++) 
        {
            const match = regex.exec(result);

            if(match === null) 
            {
                return result;
            }

            let replacements = 0;

            for(let i = 1; i < match.length; i++) 
            {
                const localization = this._localizations.get(match[i]);

                if(localization) 
                {
                    replacements++;
                    result = result.replace('${' + match[i] + '}', localization.value);
                }
            }

            if(replacements === 0) 
            {
                break;
            }

            // Reset regex lastIndex for next iteration
            regex.lastIndex = 0;
        }

        // AS3 falls through here (loop exhausted or broke out with unresolved ${...}
        // tokens the localization dictionary didn't have) to the configuration's own
        // interpolate() for one more pass - e.g. config-only tokens. The no-match early
        // return above stays as-is (AS3 returns the string as-is there too, never
        // reaching super.interpolate()).
        return super.interpolate(result);
    }

    protected override initComponent(): void 
    {
        log.debug('CoreLocalizationManager initialized');
    }

    protected updateAllListeners(): void 
    {
        for(const localization of this._localizations.values()) 
        {
            localization.updateListeners();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/localization/CoreLocalizationManager.as::dispose()
    public override dispose(): void
    {
        if(this.disposed) return;

        this._localizations.clear();
        this._nonExistingKeys = [];

        super.dispose();
    }
}
