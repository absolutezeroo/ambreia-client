/**
 * Window style identifiers.
 *
 * Controls the visual theme/skin applied to a window element.
 *
 * @see sources/win63_version/habbo/window/enum/HabboWindowStyle.as
 */
export const WindowStyle =
    {
        NULL: 0,
        DEFAULT: 0,
        BLACK: 1,
        SHINY: 3,
    } as const;

export type WindowStyleValue = typeof WindowStyle[keyof typeof WindowStyle];
