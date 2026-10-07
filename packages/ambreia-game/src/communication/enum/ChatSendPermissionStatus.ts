/**
 * Chat Send Permission Status
 *
 * @see source_as_win63/habbo/communication/enum/class_1635.as
 */
export const ChatSendPermissionStatus = {
    ALLOWED: 0,
    REQUIRED_PERK_MISSING: 1,
    REQUIRED_BADGE_MISSING: 2,
} as const;

export type ChatSendPermissionStatusType = typeof ChatSendPermissionStatus[keyof typeof ChatSendPermissionStatus];
