/**
 * Habbo Hotel View Event Constants
 *
 * @see source_as_win63/habbo/communication/enum/HabboHotelViewEvent.as
 */
export const HabboHotelViewEvent = {
    START_LOAD: 'HHVE_START_LOAD',
    LOADED: 'HHVE_LOADED',
    ERROR: 'HHVE_ERROR',
} as const;

export type HabboHotelViewEventType = typeof HabboHotelViewEvent[keyof typeof HabboHotelViewEvent];
