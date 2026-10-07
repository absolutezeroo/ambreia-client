/**
 * RoomObjectSpriteType
 *
 * Based on AS3: com.sulake.room.object.enum.RoomObjectSpriteType
 *
 * Sprite type constants for room object sprites.
 */
export const RoomObjectSpriteType = {
    DEFAULT: 1,
    ROOM_PLANE: 2,
    AVATAR: 3,
    AVATAR_OWN: 4,
    FURNITURE: 5,
} as const;

export type RoomObjectSpriteType = typeof RoomObjectSpriteType[keyof typeof RoomObjectSpriteType];
