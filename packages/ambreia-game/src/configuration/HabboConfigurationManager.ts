import {Component, type IContext} from '../core/runtime/index';
import {Logger} from '@ambreia/common/utils/Logger';
import type {IHabboConfigurationManager} from './IHabboConfigurationManager';
import {HabboProperty} from './enum/HabboProperty';
import {HabboConfigurationEvent} from './enum/HabboConfigurationEvent';

const log = Logger.getLogger('habbo.configuration.HabboConfigurationManager');

/**
 * The old `key=value` properties, read through getProperty() until each feature has its own section.
 *
 * Based on AS3: com.sulake.habbo.configuration.HabboConfigurationManager
 */
// DEVIATION: AS3 parsed two embedded text files, then downloaded external_variables (found through
//   the gamedata hashes) and reloaded once the localization had its hashes. Here the properties are
//   the kernel's `legacy` section over legacy.defaults.json, loaded once and synchronously (load()).
// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/configuration/HabboConfigurationManager.as::dispose()
// AS3's override is `override public function dispose() : void { super.dispose(); }` - a pure
// pass-through with no added cleanup, so it is intentionally not re-declared here.
export class HabboConfigurationManager extends Component implements IHabboConfigurationManager
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/configuration/HabboConfigurationManager.as::INTERPOLATION_DEPTH_LIMIT
    private static readonly INTERPOLATION_DEPTH_LIMIT: number = 3;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/configuration/HabboConfigurationManager.as::REPLACE_CHAR
    private static readonly REPLACE_CHAR: string = '%';

    private _configurationData: Map<string, string> = new Map();
    private _interpolatedCache: Map<string, string> = new Map();
    private _isConfigLoaded: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/configuration/HabboConfigurationManager.as::HabboConfigurationManager()
    constructor(context: IContext, flags: number = 0)
    {
        super(context, flags);

        context.configuration = this;
    }

    private _environmentId: string = '';

    get environmentId(): string
    {
        return this._environmentId;
    }

    private _useHttps: boolean = false;

    get useHttps(): boolean
    {
        return this._useHttps;
    }

    set useHttps(value: boolean)
    {
        this._useHttps = value;
    }

    /**
     * Sets every property, then reports the configuration complete. The listeners that subscribe
     * later check isInitialized() first.
     */
    load(values: Readonly<Record<string, string>>): void
    {
        for(const [key, value] of Object.entries(values)) this.setProperty(key, value);

        this._isConfigLoaded = true;

        log.info(`Configuration loaded: ${this._configurationData.size} properties`);

        this.events.emit(HabboConfigurationEvent.CONFIGURATION_LOADED);
        this.events.emit('complete');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/configuration/HabboConfigurationManager.as::isInitialized()
    isInitialized(): boolean
    {
        return this._isConfigLoaded;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/configuration/HabboConfigurationManager.as::propertyExists()
    propertyExists(key: string): boolean
    {
        return this._configurationData.has(key);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/configuration/HabboConfigurationManager.as::getProperty()
    getProperty(key: string, params?: Record<string, string>): string
    {
        if(!params)
        {
            const cached = this._interpolatedCache.get(key);

            if(cached !== undefined)
            {
                return cached;
            }
        }

        let value = this._configurationData.get(key) ?? '';

        value = this.interpolate(value);

        if(value === '')
        {
            if(!params) this._interpolatedCache.set(key, '');
            return '';
        }

        // Handle protocol-relative URLs
        if(value.substring(0, 2) === '//')
        {
            value = (this._useHttps ? 'https:' : 'http:') + value;
        }

        value = this.updateUrlProtocol(value);

        if(!params)
        {
            this._interpolatedCache.set(key, value);
        }
        else
        {
            value = this.fillParams(value, params);
        }

        return value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/configuration/HabboConfigurationManager.as::setProperty()
    // DEVIATION: AS3 kept "persistent" keys (configuration.readonly) that later files could not
    //   overwrite; there is one load now, so the last value set wins.
    setProperty(key: string, value: string, _persistent: boolean = false, logIt: boolean = false): void
    {
        if(logIt && !this._configurationData.has(key))
        {
            log.debug(`${key}=${value}`);
        }

        if(key === HabboProperty.ENVIRONMENT_ID)
        {
            this._environmentId = value;
        }

        this._configurationData.set(key, value);
        this._interpolatedCache.clear();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/configuration/HabboConfigurationManager.as::getBoolean()
    getBoolean(key: string): boolean
    {
        const value = this._configurationData.get(key);
        return value !== undefined && (value === '1' || value.toLowerCase() === 'true');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/configuration/HabboConfigurationManager.as::getInteger()
    getInteger(key: string, defaultValue: number): number
    {
        const value = this._configurationData.get(key);

        if(value === undefined)
        {
            return defaultValue;
        }

        const parsed = parseInt(value, 10);

        return isNaN(parsed) ? defaultValue : parsed;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/configuration/HabboConfigurationManager.as::interpolate()
    interpolate(value: string): string
    {
        if(!value)
        {
            return value;
        }

        const regex = /\$\{([^}]*)\}/g;
        let interpolated = value;
        let limit = HabboConfigurationManager.INTERPOLATION_DEPTH_LIMIT;

        while(limit-- > 0)
        {
            let hasMatch = false;
            let result = '';
            let lastIndex = 0;
            let match: RegExpExecArray | null;

            // Reset regex
            regex.lastIndex = 0;

            while((match = regex.exec(interpolated)) !== null)
            {
                const key = match[1];

                if(!this.propertyExists(key))
                {
                    return '';
                }
                else
                {
                    result += interpolated.substring(lastIndex, match.index);
                    result += this._configurationData.get(key) ?? '';
                    hasMatch = true;
                }

                lastIndex = match.index + match[0].length;
            }

            result += interpolated.substring(lastIndex);

            if(!hasMatch)
            {
                break;
            }

            interpolated = result;
        }

        return interpolated;
    }

    updateUrlProtocol(url: string): string
    {
        if(this._useHttps)
        {
            return url.replace('http://', 'https://').replace(':8090/', ':8443/');
        }

        return url;
    }

    private fillParams(template: string, params: Record<string, string>): string
    {
        let result = template;
        const char = HabboConfigurationManager.REPLACE_CHAR;

        for(let i = 0; i < 10; i++)
        {
            const startIndex = result.indexOf(char);

            if(startIndex < 0)
            {
                break;
            }

            const endIndex = result.indexOf(char, startIndex + 1);

            if(endIndex < 0)
            {
                break;
            }

            const paramKey = result.substring(startIndex + 1, endIndex);
            const paramValue = params[paramKey] ?? '';

            result = result.replace(`${char}${paramKey}${char}`, paramValue);
        }

        return result;
    }
}
