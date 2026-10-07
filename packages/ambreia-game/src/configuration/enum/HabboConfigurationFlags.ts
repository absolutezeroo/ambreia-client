/**
 * Configuration initialization flags
 * Based on AS3 com.sulake.habbo.configuration.enum.HabboConfigurationFlags
 */
export const HabboConfigurationFlags = {
    DEFAULT: 0,
    SKIP_EXTERNAL_VARIABLES: 0x10000000, // 268435456
    SKIP_LOCALIZATIONS: 0x01000000,      // 16777216
} as const;

export type HabboConfigurationFlagsType = typeof HabboConfigurationFlags[keyof typeof HabboConfigurationFlags];
