/**
 * Direction constants for window layout.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/enum/Direction.as
 */
export const Direction =
    {
        UP: 'up',
        DOWN: 'down',
        LEFT: 'left',
        RIGHT: 'right',
    } as const;

export type DirectionValue = typeof Direction[keyof typeof Direction];
