/**
 * Component mode flags
 *
 * Based on AS3: com.sulake.habbo.configuration.enum.HabboComponentFlags
 *
 * Used to check if the client is in "room viewer mode" - a special mode
 * where the user can only view rooms but not interact (no chat, inventory, etc.)
 */
export const HabboComponentFlags = {
    /**
	 * Flag indicating room viewer mode is enabled
	 */
    ROOM_VIEWER_MODE: 1,
} as const;

export type HabboComponentFlagsType = typeof HabboComponentFlags;

/**
 * Check if room viewer mode is enabled in the given flags
 *
 * @param flags - Component flags bitmask
 * @returns True if room viewer mode is enabled
 */
export function isRoomViewerMode(flags: number): boolean
{
    return (flags & HabboComponentFlags.ROOM_VIEWER_MODE) !== 0;
}
