/**
 * Device Type Constants
 *
 * @see source_as_win63/habbo/communication/enum/class_1601.as
 */
export const DeviceType = {
    UNKNOWN: 0,
    PHONE: 1,
    TABLET: 2,
    BROWSER: 3,
    DESKTOP: 4,
} as const;

export type DeviceTypeValue = typeof DeviceType[keyof typeof DeviceType];
