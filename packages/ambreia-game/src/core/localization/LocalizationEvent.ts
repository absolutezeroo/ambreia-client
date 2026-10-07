/**
 * Core localization event types
 *
 * Based on AS3 com.sulake.core.localization.enum.class_80
 */
export const LocalizationEvent = {
    LANGUAGE_CHANGED: 'LOCALIZATION_EVENT_LANGUAGE_CHANGED',
    LOCALIZATION_LOADED: 'LOCALIZATION_EVENT_LOCALIZATION_LOADED',
    LOCALIZATION_FAILED: 'LOCALIZATION_EVENT_LOCALIZATION_FAILED',
} as const;

export type LocalizationEventType = (typeof LocalizationEvent)[keyof typeof LocalizationEvent];
