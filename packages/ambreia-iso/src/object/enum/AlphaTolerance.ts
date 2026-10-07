/**
 * AlphaTolerance
 *
 * Based on AS3: com.sulake.room.object.enum.AlphaTolerance
 *
 * Alpha tolerance constants for sprite hit-testing.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/object/enum/AlphaTolerance.as
 */
export const AlphaTolerance = {
    MATCH_ALL_PIXELS: -1,
    MATCH_OPAQUE_PIXELS: 128,
    MATCH_NOTHING: 256,
} as const;

export type AlphaTolerance = typeof AlphaTolerance[keyof typeof AlphaTolerance];
