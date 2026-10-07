/**
 * RoomObjectTypeEnum
 *
 * Based on AS3: com.sulake.habbo.room.object.RoomObjectTypeEnum
 *
 * Constants for room object types.
 */
export const RoomObjectTypeEnum = {
    OBJECT_TYPE_USER: 1,
    OBJECT_TYPE_PET: 2,
    OBJECT_TYPE_BOT: 3,
    OBJECT_TYPE_RENTABLE_BOT: 4,
} as const;

export type RoomObjectType = typeof RoomObjectTypeEnum[keyof typeof RoomObjectTypeEnum];
