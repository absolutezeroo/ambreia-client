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
	 * Component complete (ready to use)
	 */
    'complete': () => void;
}

/**
 * Habbo Configuration Manager Interface
 *
 * Based on AS3: com.sulake.habbo.configuration.IHabboConfigurationManager
 *
 * The `legacy` properties (HabboConfigurationManager.load()), read through ICoreConfiguration.
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
	 * Sets the properties and reports the configuration complete.
	 */
    load(values: Readonly<Record<string, string>>): void;
}
