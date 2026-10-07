/**
 * Localization initialization flags
 * Based on AS3 com.sulake.habbo.localization.enum.HabboLocalizationFlags
 */
export const HabboLocalizationFlags = {
    DEFAULT: 0,
    SKIP_EXTERNAL_LOCALIZATIONS: 0x10000000, // 268435456
} as const;

export type HabboLocalizationFlagsType = typeof HabboLocalizationFlags[keyof typeof HabboLocalizationFlags];
