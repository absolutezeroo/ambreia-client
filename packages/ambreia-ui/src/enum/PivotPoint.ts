/**
 * Pivot point constants for window positioning and alignment.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/enum/PivotPoint.as
 */
export const PivotPoint =
    {
        TOP_LEFT: 0,
        TOP_CENTER: 1,
        TOP_RIGHT: 2,
        CENTER_LEFT: 3,
        CENTER: 4,
        CENTER_RIGHT: 5,
        BOTTOM_LEFT: 6,
        BOTTOM_CENTER: 7,
        BOTTOM_RIGHT: 8,
    } as const;

export type PivotPointValue = typeof PivotPoint[keyof typeof PivotPoint];

/**
 * Pivot point display names, indexed by pivot value.
 */
export const PIVOT_NAMES: readonly string[] = [
    'top left',
    'top center',
    'top right',
    'center left',
    'center',
    'center right',
    'bottom left',
    'bottom center',
    'bottom right',
];

/**
 * Resolves a pivot point name string to its numeric constant.
 *
 * @param name - The pivot name (e.g. "top left", "center")
 * @returns The pivot point value, or -1 if not found
 */
export function pivotFromName(name: string): number
{
    return PIVOT_NAMES.indexOf(name);
}
