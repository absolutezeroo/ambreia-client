/**
 * Security level enum
 *
 * @see source_as_win63/habbo/session/enum/SecurityLevelEnum.as
 */
export const SecurityLevelEnum = {
    NONE: 0,
    MODERATOR: 3,
    ADMIN: 5,
    SUPER_USER: 9,
} as const;

export type SecurityLevel = typeof SecurityLevelEnum[keyof typeof SecurityLevelEnum];
