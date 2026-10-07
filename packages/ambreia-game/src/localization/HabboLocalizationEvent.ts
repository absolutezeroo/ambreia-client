/**
 * Habbo-specific localization event types
 *
 * Based on AS3 com.sulake.habbo.localization.enum.class_80
 */
export const HabboLocalizationEvent = {
    LOCALIZATION_LOADED: 'HABBO_LOCALIZATION_EVENT_LOCALIZATION_LOADED',
    LOCALIZATION_FAILED: 'LOCALIZATION_EVENT_LOCALIZATION_FAILED',
    LOCALIZATION_OVERRIDE_FAILED: 'LOCALIZATION_EVENT_LOCALIZATION_OVERRIDE_FAILED',
} as const;

export type HabboLocalizationEventType = (typeof HabboLocalizationEvent)[keyof typeof HabboLocalizationEvent];
