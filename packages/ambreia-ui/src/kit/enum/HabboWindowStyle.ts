/**
 * Habbo-specific window style identifiers.
 *
 * Controls the visual theme/skin applied to Habbo window elements.
 *
 * @see sources/win63_version/habbo/window/enum/HabboWindowStyle.as
 */
export const HabboWindowStyle =
    {
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowStyle.as::NULL
        NULL: 0,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowStyle.as::DEFAULT
        DEFAULT: 0,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowStyle.as::BLACK
        BLACK: 1,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowStyle.as::SHINY
        SHINY: 3,
    } as const;

export type HabboWindowStyleValue = typeof HabboWindowStyle[keyof typeof HabboWindowStyle];
