/**
 * Platform Type Constants
 *
 * @see source_as_win63/habbo/communication/enum/class_1133.as
 */
export const PlatformType = {
    UNKNOWN: 0,
    FLASH: 1,
    IOS: 2,
    ANDROID: 3,
    WEBGL: 4,
    MACOS: 5,
    WIN: 6,
    LINUX: 7,
} as const;

export type PlatformTypeValue = typeof PlatformType[keyof typeof PlatformType];
