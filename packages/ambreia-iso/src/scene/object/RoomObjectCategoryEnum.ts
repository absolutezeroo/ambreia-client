/**
 * RoomObjectCategoryEnum
 *
 * Based on AS3: com.sulake.habbo.room.object.RoomObjectCategoryEnum
 *
 * Constants for room object categories.
 */
export const RoomObjectCategoryEnum = {
    MINIMUM: -2,
    OBJECT_CATEGORY_ROOM: 0,
    OBJECT_CATEGORY_FURNITURE: 10,
    OBJECT_CATEGORY_WALL: 20,
    OBJECT_CATEGORY_USER: 100,
    OBJECT_CATEGORY_CURSOR: 200,
} as const;

export type RoomObjectCategory = typeof RoomObjectCategoryEnum[keyof typeof RoomObjectCategoryEnum];
