/**
 * Configuration event type constants
 * Based on AS3 com.sulake.habbo.configuration.enum.HabboConfigurationEvent
 */
export const HabboConfigurationEvent = {
    CONFIGURATION_LOADED: 'HCE_CONFIGURATION_LOADED',
    CONFIGURATION_ERROR: 'HCE_CONFIGURATION_ERROR',
} as const;

export type HabboConfigurationEventType = typeof HabboConfigurationEvent[keyof typeof HabboConfigurationEvent];
