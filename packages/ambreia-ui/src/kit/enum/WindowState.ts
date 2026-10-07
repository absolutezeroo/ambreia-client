/**
 * Window state flags (bitwise).
 *
 * Represents the visual/interactive state of a window element.
 * Multiple states can be combined via bitwise OR.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/enum/WindowState.as
 */
export const WindowState =
    {
        DEFAULT: 0,
        ACTIVE: 1 << 0,
        FOCUSED: 1 << 1,
        HOVERING: 1 << 2,
        SELECTED: 1 << 3,
        PRESSED: 1 << 4,
        DISABLED: 1 << 5,
        LOCKED: 1 << 6,
        DISPOSED: 1 << 30,
    } as const;

export type WindowStateValue = typeof WindowState[keyof typeof WindowState];

/**
 * Priority-ordered list of states for skin renderer resolution.
 * Higher priority states are checked first.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/graphics/SkinContainer.as
 */
export const STATE_PRIORITY: readonly number[] = [
    WindowState.LOCKED,
    WindowState.DISABLED,
    WindowState.PRESSED,
    WindowState.SELECTED,
    WindowState.HOVERING,
    WindowState.FOCUSED,
    WindowState.ACTIVE,
    WindowState.DEFAULT,
];

/**
 * Map state name to state value.
 */
export const STATE_NAME_TO_VALUE: Record<string, number> =
    {
        'default': WindowState.DEFAULT,
        'active': WindowState.ACTIVE,
        'focused': WindowState.FOCUSED,
        'hovering': WindowState.HOVERING,
        'selected': WindowState.SELECTED,
        'pressed': WindowState.PRESSED,
        'disabled': WindowState.DISABLED,
        'locked': WindowState.LOCKED,
        'disposed': WindowState.DISPOSED,
    };
