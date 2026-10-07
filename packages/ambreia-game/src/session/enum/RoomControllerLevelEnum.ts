/**
 * Room controller permission levels
 * Based on AS3 com.sulake.habbo.session.enum.RoomControllerLevelEnum
 */
export const RoomControllerLevelEnum = {
    NOT_CONTROLLER: 0,
    ROOM_CONTROLLER: 1,
    GUILD_MEMBER: 2,
    GUILD_ADMIN: 3,
    ROOM_OWNER: 4,
    MODERATOR: 5,
} as const;

export type RoomControllerLevel = typeof RoomControllerLevelEnum[keyof typeof RoomControllerLevelEnum];
