import type {EventEmitter} from 'eventemitter3';
import type {ICoreConfiguration} from '@ambreia/kernel/runtime/ICoreConfiguration';

/**
 * Habbo Configuration Manager Events
 *
 * Based on AS3: com.sulake.habbo.configuration.enum.HabboConfigurationEvent
 */
export interface IHabboConfigurationManagerEvents
{
    /**
	 * Configuration loaded successfully. The key is `HabboConfigurationEvent.CONFIGURATION_LOADED`,
	 * which is the name AS3 dispatches — it used to be spelt 'configurationLoaded' here and in the
	 * manager, agreeing with each other but with nothing else.
	 */
    // eslint-disable-next-line @typescript-eslint/naming-convention -- an event name, not a method
    'HCE_CONFIGURATION_LOADED': () => void;

    /**
	 * Configuration load error
	 */
    'configurationError': (error: Error) => void;

    /**
	 * Component complete (ready to use)
	 */
    'complete': () => void;
}

/**
 * Habbo Configuration Manager Interface
 *
 * Based on AS3: com.sulake.habbo.configuration.IHabboConfigurationManager
 *
 * Extends ICoreConfiguration with Habbo-specific functionality:
 * - Environment management
 * - External variables download
 * - Configuration reset
 */
export interface IHabboConfigurationManager extends ICoreConfiguration
{
    /**
	 * Event emitter for configuration events
	 */
    readonly events: EventEmitter;
    /**
	 * Get the current environment ID
	 */
    readonly environmentId: string;
    /**
	 * Whether to use HTTPS for URLs
	 */
    useHttps: boolean;

    /**
	 * Check if configuration has been loaded
	 */
    isInitialized(): boolean;

    /**
	 * Update the environment ID and reload environment-specific properties
	 * @param envId Environment identifier (e.g., "production", "staging")
	 */
    updateEnvironmentId(envId: string): void;

    /**
	 * Reset all configuration to defaults
	 * Clears all properties and reloads embedded configurations
	 */
    resetAll(): void;

    /**
	 * Provide embedded AS3 TextAsset configuration contents by asset name.
	 */
    setEmbeddedConfigurationAssets(assets: Record<string, string>): void;

    /**
	 * Initialize configuration download from external variables URL
	 */
    initConfigurationDownload(): Promise<void>;
}
