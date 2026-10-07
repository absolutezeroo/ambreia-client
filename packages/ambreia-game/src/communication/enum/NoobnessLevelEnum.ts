/**
 * Noobness Level Enum
 *
 * @see source_as_win63/habbo/communication/enum/NoobnessLevelEnum.as
 */
export const NoobnessLevelEnum = {
    OLD_IDENTITY: 0,
    NEW_IDENTITY: 1,
    REAL_NOOB: 2,
} as const;

export type NoobnessLevelType = typeof NoobnessLevelEnum[keyof typeof NoobnessLevelEnum];
