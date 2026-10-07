/**
 * Habbo window tracking event identifiers.
 *
 * Used to track window system lifecycle events: input processing,
 * rendering, and sleep/idle transitions.
 *
 * @see sources/win63_version/habbo/window/enum/HabboWindowTrackingEvent.as
 */
export const HabboWindowTrackingEvent =
    {
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowTrackingEvent.as::HABBO_WINDOW_TRACKING_EVENT_INPUT
        HABBO_WINDOW_TRACKING_EVENT_INPUT: 'HABBO_WINDOW_TRACKING_EVENT_INPUT',
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowTrackingEvent.as::HABBO_WINDOW_TRACKING_EVENT_RENDER
        HABBO_WINDOW_TRACKING_EVENT_RENDER: 'HABBO_WINDOW_TRACKING_EVENT_RENDER',
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowTrackingEvent.as::HABBO_WINDOW_TRACKING_EVENT_SLEEP
        HABBO_WINDOW_TRACKING_EVENT_SLEEP: 'HABBO_WINDOW_TRACKING_EVENT_SLEEP',
    } as const;

export type HabboWindowTrackingEventValue = typeof HabboWindowTrackingEvent[keyof typeof HabboWindowTrackingEvent];
