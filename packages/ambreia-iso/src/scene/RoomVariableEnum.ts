/**
 * RoomVariableEnum
 *
 * Based on AS3: com.sulake.habbo.room.RoomVariableEnum
 *
 * Constants for room instance variable names.
 */
export const RoomVariableEnum = {
    ROOM_MIN_X: 'room_min_x',
    ROOM_MAX_X: 'room_max_x',
    ROOM_MIN_Y: 'room_min_y',
    ROOM_MAX_Y: 'room_max_y',
    ROOM_IS_PUBLIC: 'room_is_public',
    ROOM_Z_SCALE: 'room_z_scale',
    AD_DISPLAY_DELAY_MILLIS: 'ad_display_delay',
    IS_PLAYING_GAME: 'is_playing_game',
    HANDITEM_CONTROL_BLOCKED: 'handitem_control_blocked',
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/RoomVariableEnum.as:26-34
    CHOOSER_DISABLED: 'chooser_disabled',
    FREE_FURNI_MOVEMENTS_MODE: 'free_furni_movements_mode',
    INVISIBLE_FURNI: 'invisible_furni',
    CAMERA_INIT_X: 'camera_init_x',
    CAMERA_INIT_Y: 'camera_init_y',
    CAMERA_INIT_Z: 'camera_init_z',
} as const;
