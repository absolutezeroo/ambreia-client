/**
 * UI Flags Enum
 * Based on AS3 com.sulake.habbo.session.class_3428
 */
export const UIFlagsEnum = {
    FRIEND_BAR_OPEN: 1,
    ROOM_TOOLS_OPEN: 2
} as const;

export type UIFlagsEnum = typeof UIFlagsEnum[keyof typeof UIFlagsEnum];
