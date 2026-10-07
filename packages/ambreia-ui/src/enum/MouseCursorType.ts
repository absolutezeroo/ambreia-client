/**
 * Mouse cursor type constants.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/enum/MouseCursorType.as
 */
export const MouseCursorType =
    {
        DEFAULT: 0,
        ARROW: 1,
        ARROW_LINK: 2,
        ARROW_BUSY: 3,
        ARROW_HELP: 4,
        DRAG: 5,
        MOVE: 6,
        MOVE_VERTICAL: 7,
        MOVE_HORIZONTAL: 8,
        RESIZE_VERTICAL: 9,
        RESIZE_HORIZONTAL: 10,
        RESIZE_DIAGONAL: 11,
        DENIED: 12,
        BUSY: 13,
        INHERIT: 0xFFFFFFFE,
        CUSTOM: 0xFFFFFFFF,
    } as const;

export type MouseCursorTypeValue = typeof MouseCursorType[keyof typeof MouseCursorType];
