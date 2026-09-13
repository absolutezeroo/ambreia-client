import {Component, ComponentDependency, type IContext, type ICore} from '@core/runtime';
import {Logger} from '@core/utils/Logger';
import type {IHabboConfigurationManager} from './IHabboConfigurationManager';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import {IID_HabboLocalizationManager} from '@iid/IIDHabboLocalizationManager';
import {HabboProperty} from './enum/HabboProperty';
import {HabboConfigurationFlags} from './enum/HabboConfigurationFlags';
import {HabboConfigurationEvent} from './enum/HabboConfigurationEvent';

const log = Logger.getLogger('habbo.configuration.HabboConfigurationManager');

/**
 * Habbo Configuration Manager
 *
 * Based on AS3: com.sulake.habbo.configuration.HabboConfigurationManager
 *
 * Manages application configuration with support for:
 * - Key-value storage with persistent keys
 * - Interpolation (${variable} syntax)
 * - Parameter replacement (%param% syntax)
 * - Environment-specific overrides
 * - External variables download
 * - Gamedata hashes loading
 */
// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/configuration/HabboConfigurationManager.as::dispose()
// AS3's override is `override public function dispose() : void { super.dispose(); }` - a pure
// pass-through with no added cleanup, so it is intentionally not re-declared here: TS/JS already
// runs the inherited Component.dispose() when nothing overrides it, which is the same behaviour
// without the boilerplate override.
export class HabboConfigurationManager extends Component implements IHabboConfigurationManager
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/configuration/HabboConfigurationManager.as::INTERPOLATION_DEPTH_LIMIT
    private static readonly INTERPOLATION_DEPTH_LIMIT: number = 3;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/configuration/HabboConfigurationManager.as::REPLACE_CHAR
    private static readonly REPLACE_CHAR: string = '%';

    private _configurationData: Map<string, string> = new Map();
    private _configurationKeys: string[] = [];
    private _interpolatedCache: Map<string, string> = new Map();
    private _isConfigLoaded: boolean = false;
    private _isConfigReadOnly: boolean = false;
    private _embeddedConfigurationAssets: Map<string, string> = new Map();
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/configuration/HabboConfigurationManager.as::_localization
    private _localization: IHabboLocalizationManager | null = null;
    private _skipExternalVariables: boolean = false;
    private _skipLocalizations: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/configuration/HabboConfigurationManager.as::HabboConfigurationManager()
    constructor(context: IContext, flags: number = 0) 
    {
        super(context, flags);

        context.configuration = this;

        this._skipExternalVariables = (flags & HabboConfigurationFlags.SKIP_EXTERNAL_VARIABLES) > 0;
        this._skipLocalizations = (flags & HabboConfigurationFlags.SKIP_LOCALIZATIONS) > 0;
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

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/configuration/HabboConfigurationManager.as::get dependencies()
    protected override get dependencies(): Array<ComponentDependency<any>> 
    {
        return [
            new ComponentDependency(
                IID_HabboLocalizationManager,
                (localization: IHabboLocalizationManager | null) => 
                {
                    this._localization = localization;
                },
                false,
                [{type: 'complete', callback: this.onLocalizationComplete.bind(this)}]
            ),
        ];
    }

    setEmbeddedConfigurationAssets(assets: Record<string, string>): void 
    {
        this._embeddedConfigurationAssets.clear();

        for(const [name, content] of Object.entries(assets)) 
        {
            this._embeddedConfigurationAssets.set(name, content);
        }
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
    setProperty(key: string, value: string, persistent: boolean = false, logIt: boolean = false): void 
    {
        if(logIt && !this._configurationData.has(key)) 
        {
            log.debug(`${key}=${value}`);
        }

        if(key === HabboProperty.ENVIRONMENT_ID) 
        {
            this._environmentId = value;
        }

        // Don't overwrite persistent keys unless this is also persistent
        if(this._configurationKeys.indexOf(key) < 0 || persistent) 
        {
            this._configurationData.set(key, value);
            this._interpolatedCache.clear();
        }

        if(persistent) 
        {
            this._configurationKeys.push(key);
        }
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

    updateEnvironmentId(envId: string): void 
    {
        if(this._environmentId !== envId) 
        {
            this._environmentId = envId;

            this.setProperty('environment.id', envId);
            this.updateEnvironmentVariables();
        }

        this.initEmbeddedConfigurations();
        this.setDefaults();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/configuration/HabboConfigurationManager.as::resetAll()
    resetAll(): void 
    {
        this._isConfigLoaded = false;
        this._configurationData.clear();
        this._configurationKeys = [];
        this._interpolatedCache.clear();
        this._environmentId = '';

        this.parseDevelopmentVariables();
        this.parseCommonVariables();
        this.parseLocalizationVariables();
        this.setProperty(HabboProperty.CLIENT_URL, 'app:/');
        this.parseArguments();
        this.setDefaults();
        this.updateEnvironmentVariables();

        if(!this.propertyExists(HabboProperty.ENVIRONMENT_ID)) 
        {
            this.initEmbeddedConfigurations();
        }

        if(!this._isConfigLoaded && this._skipExternalVariables) 
        {
            this._isConfigLoaded = true;
            this.unlock();
            this.events.emit('complete');
        }
        else if(!this._isConfigLoaded && this._skipLocalizations) 
        {
            void this.initConfigurationDownload().catch((error) => 
            {
                const err = error instanceof Error ? error : new Error(String(error));

                log.error(`Configuration download after resetAll failed: ${err.message}`);
            });
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/configuration/HabboConfigurationManager.as::initConfigurationDownload()
    async initConfigurationDownload(): Promise<void> 
    {
        this._isConfigLoaded = false;

        const externalVariablesUrl = this.getProperty(HabboProperty.EXTERNAL_VARIABLES);

        if(!externalVariablesUrl) 
        {
            const err = new Error(`Missing ${HabboProperty.EXTERNAL_VARIABLES}`);

            log.error(err.message);
            this.events.emit('configurationError', err);

            throw err;
        }

        try 
        {
            log.debug(`Loading configuration from ${externalVariablesUrl}`);

            const response = await fetch(externalVariablesUrl);

            if(!response.ok) 
            {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const configData = await response.text();

            if(configData && configData.length > 0) 
            {
                this.parseConfiguration(configData);
            }
            else 
            {
                throw new Error(`Empty configuration data from ${externalVariablesUrl}`);
            }

            this.configurationsLoaded();
        }
        catch (error) 
        {
            const err = error instanceof Error ? error : new Error(String(error));

            log.error(`Configuration download error: ${err.message}`);

            this.events.emit('configurationError', err);
            throw err;
        }
    }

    protected override initComponent(): void 
    {
        this.resetAll();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/configuration/HabboConfigurationManager.as::onLocalizationComplete()
    private onLocalizationComplete(): void 
    {
        if(!this._localization) 
        {
            return;
        }

        const resources = this._localization.getGameDataResources();

        if(!resources) 
        {
            return;
        }

        const url = resources.externalVariablesUrl;
        const hash = resources.externalVariablesHash;

        if(!url || !hash) 
        {
            return;
        }

        this.setProperty(HabboProperty.EXTERNAL_VARIABLES, `${url}/${hash}`);

        void this.initConfigurationDownload().catch((error) => 
        {
            const err = error instanceof Error ? error : new Error(String(error));

            log.error(`Configuration reload after localization failed: ${err.message}`);
        });
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/configuration/HabboConfigurationManager.as::updateEnvironmentVariables()
    private updateEnvironmentVariables(): void 
    {
        if(!this._environmentId) 
        {
            return;
        }

        const keysToUpdate = [
            'connection.info.host',
            'connection.info.port',
            'url.prefix',
            'site.url',
            'flash.dynamic.download.url',
            'flash.dynamic.download.name.template',
            'flash.dynamic.avatar.download.configuration',
            'flash.dynamic.avatar.download.url',
            'pocket.api',
            'web.api',
            'facebook.application.id',
            'web.terms_of_service.link',
        ];

        for(const key of keysToUpdate) 
        {
            const defaultValue = this.getProperty(key);
            const envKey = `${key}.${this._environmentId}`;

            if(this.propertyExists(envKey)) 
            {
                const envValue = this._configurationData.get(envKey) ?? '';

                this.setProperty(key, envValue);
            }
            else 
            {
                this.setProperty(key, defaultValue);
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/configuration/HabboConfigurationManager.as::initEmbeddedConfigurations()
    private initEmbeddedConfigurations(): void 
    {
        let environment = this._environmentId || localStorage.getItem('vortex_environment') || '';

        // Nothing picked yet (fresh page load, no stored preference) — fall back to the
        // first entry of live.environment.list ("en") instead of doing nothing. Without
        // this, environment.id stays unset until the user manually visits the hotel
        // picker, which means every ".en"-suffixed override below (web.api.en,
        // url.prefix.en, etc.) never syncs into its base key on first load — leaving
        // e.g. web.api empty, which sends WebApiLoginProvider down its url.prefix
        // fallback path instead of the working local dev proxy.
        if(!environment) 
        {
            const liveList = this._configurationData.get('live.environment.list');

            environment = liveList ? liveList.split('/')[0] : '';
        }

        if(!environment) 
        {
            return;
        }

        log.debug(`Default Environment: ${environment}`);

        if(!this._environmentId) 
        {
            this._environmentId = environment;
            this.setProperty('environment.id', environment);
        }

        // Apply environment-specific overrides
        for(const [key] of this._configurationData) 
        {
            const index = key.lastIndexOf(`.${environment}`);

            if(index !== -1 && index + 1 + environment.length === key.length) 
            {
                const baseKey = key.substring(0, index);
                // Copy the raw, unprocessed value — not this.getProperty(key). Properties like
                // "url.prefix.en" are template prefixes meant to be substituted into other values
                // via "${url.prefix}" (interpolate() reads the raw map directly). Running a bare
                // origin URL like "http://vortex-assets.local" through getProperty()'s dev-proxy
                // normalization collapses it to just its pathname ("/"), which then corrupts every
                // value built from "${url.prefix}/..." into a protocol-relative "//..." URL.
                const value = this._configurationData.get(key) ?? '';

                this.setProperty(baseKey, value);
            }
        }
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

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/configuration/HabboConfigurationManager.as::parseConfiguration()
    private parseConfiguration(config: string): void 
    {
        const trimmed = config.trim();

        // Detect JSON format (starts with { or [)
        if(trimmed.startsWith('{') || trimmed.startsWith('[')) 
        {
            this.parseJsonConfiguration(trimmed);
            return;
        }

        // Parse key=value text format (original Habbo format)
        this.parseKeyValueConfiguration(config);
    }

    private parseJsonConfiguration(data: string): void 
    {
        try 
        {
            const json = JSON.parse(data);
            let count = 0;

            for(const [key, value] of Object.entries(json)) 
            {
                if(value === null || value === undefined) 
                {
                    continue;
                }

                let stringValue: string;

                if(typeof value === 'string') 
                {
                    stringValue = value;
                }
                else if(typeof value === 'number' || typeof value === 'boolean') 
                {
                    stringValue = String(value);
                }
                else 
                {
                    // Arrays and objects → store as JSON string
                    stringValue = JSON.stringify(value);
                }

                this.setProperty(key, stringValue);
                count++;
            }

            log.info(`Parsed ${count} configuration entries from JSON`);
        }
        catch (error) 
        {
            log.error(`Failed to parse JSON configuration: ${error}`);
        }
    }

    private parseKeyValueConfiguration(config: string): void 
    {
        const lineRegex = /\n\r{1,}|\n{1,}|\r{1,}/gm;
        const trimRegex = /^\s+|\s+$/g;
        const lines = config.split(lineRegex);
        let isReadOnly = false;

        for(const line of lines) 
        {
            if(line.substr(0, 1) === '#' || line === '') 
            {
                continue;
            }

            const parts = line.split('=');

            if(parts.length >= 2 && parts[0].length > 0 && parts[1].length > 0) 
            {
                const key = parts.shift()!.replace(trimRegex, '');
                const value = parts.join('=').replace(trimRegex, '');

                if(key === 'configuration.readonly' && value === 'true') 
                {
                    isReadOnly = true;
                }

                this.setProperty(key, value, isReadOnly);
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/configuration/HabboConfigurationManager.as::parseDevelopmentVariables()
    private parseDevelopmentVariables(): void 
    {
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/configuration/HabboConfigurationManager.as::parseCommonVariables()
    private parseCommonVariables(): void 
    {
        this.parseConfigurationAsset('common_configuration');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/configuration/HabboConfigurationManager.as::parseConfigurationAsset()
    private parseConfigurationAsset(assetName: string): void 
    {
        const content = this._embeddedConfigurationAssets.get(assetName);

        if(content !== undefined) 
        {
            this.parseConfiguration(content);
        }
        else 
        {
            log.warn(`Could not parse configuration ${assetName}`);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/configuration/HabboConfigurationManager.as::parseLocalizationVariables()
    private parseLocalizationVariables(): void 
    {
        this.parseConfigurationAsset('localization_configuration');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/configuration/HabboConfigurationManager.as::parseArguments()
    private parseArguments(): void 
    {
        const core = this.context as ICore;

        if(!core.arguments) return;

        for(const [key, value] of core.arguments) 
        {
            this.setProperty(key.replace(/_/g, '.'), String(value));
        }

        core.clearArguments();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/configuration/HabboConfigurationManager.as::setDefaults()
    private setDefaults(): void 
    {
        this.setProperty('client.fatal.error.url', '${url.prefix}/flash_client_error');
        this.setProperty('game.center.error.url', '${url.prefix}/log/gameerror');
    }

    private configurationsLoaded(): void
    {
        // The emitted name used to be the literal 'configurationLoaded', while the enum beside it
        // has always said 'HCE_CONFIGURATION_LOADED' — which is what AS3 dispatches and what any
        // ported listener would subscribe to. Nothing listened either way, so the drift was
        // invisible until the first subscriber arrived (RaidProtectionSettingsController).
        this.events.emit(HabboConfigurationEvent.CONFIGURATION_LOADED);
        this.configurationsComplete();
    }

    private configurationsComplete(): void 
    {
        if(this._isConfigLoaded) 
        {
            return;
        }

        this._isConfigLoaded = true;

        log.info('Configuration loaded');

        this.events.emit('complete');
    }
}
