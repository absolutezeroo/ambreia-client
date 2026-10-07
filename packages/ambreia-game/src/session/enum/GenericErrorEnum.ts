/**
 * Generic error codes
 * Based on AS3 com.sulake.habbo.session.enum.GenericErrorEnum
 */
export const GenericErrorEnum = {
    KICKED_BY_OWNER: 4008,
    STRIP_LOCKED_FOR_TRADING: -13001,
} as const;

export type GenericError = typeof GenericErrorEnum[keyof typeof GenericErrorEnum];
