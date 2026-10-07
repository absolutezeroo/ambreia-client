/**
 * Area filter a mouse listener applies before it is notified.
 *
 * Named `MouseEventStage` in this port until 2026-08-13, with members
 * `INSIDE_STAGE` / `OUTSIDE_STAGE` / `LEFT_STAGE`. Both the class name and two
 * of the three member names were invented: the values 0/1/3 were right, but
 * AS3's `1` is `EVENTS_INSIDE_WINDOW` (events that hit-test *inside* the
 * window), not an "outside stage", and its `3` is `EVENTS_OUTSIDE_WINDOW`, not
 * a "left stage". The real names are readable in the unobfuscated 2016 tree;
 * the primary tree has the same class obfuscated as `enum/_SafeCls_2144.as`.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/enum/MouseListenerType.as
 */
export const MouseListenerType =
    {
        // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/enum/MouseListenerType.as::EVENT_INSIDE_STAGE
        EVENT_INSIDE_STAGE: 0,
        // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/enum/MouseListenerType.as::EVENTS_INSIDE_WINDOW
        EVENTS_INSIDE_WINDOW: 1,
        // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/enum/MouseListenerType.as::EVENTS_OUTSIDE_WINDOW
        EVENTS_OUTSIDE_WINDOW: 3,
    } as const;

export type MouseListenerTypeValue = typeof MouseListenerType[keyof typeof MouseListenerType];
