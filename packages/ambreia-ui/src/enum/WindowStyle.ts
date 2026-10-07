/**
 * Window style identifiers.
 *
 * Controls the visual theme/skin applied to a window element.
 * The core framework defines only DEFAULT; Habbo layer adds more styles.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/enum/WindowStyle.as
 */
export const WindowStyle =
    {
        DEFAULT: 0,
    } as const;

export type WindowStyleValue = typeof WindowStyle[keyof typeof WindowStyle];
