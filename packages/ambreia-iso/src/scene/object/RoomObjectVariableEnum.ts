/**
 * RoomObjectVariableEnum
 *
 * Based on AS3: com.sulake.habbo.room.object.RoomObjectVariableEnum
 *
 * Constants for room object model variable names.
 */
export const RoomObjectVariableEnum = {
    // Object identification
    OBJECT_ROOM_ID: 'object_room_id',
    OBJECT_ACCURATE_Z_VALUE: 'object_accurate_z_value',
    IMAGE_QUERY_SCALE: 'image_query_scale',

    // Avatar variables
    AVATAR_FIGURE: 'figure',
    AVATAR_RACE: 'race',
    AVATAR_GENDER: 'gender',
    AVATAR_OWN_USER: 'own_user',
    // Derived name: the constant is obfuscated in the primary tree (`_SafeStr_11656`) and
    // absent from the 2016 one; `AVATAR_BLOCKED` is derived from its value and from its
    // position, right after AVATAR_OWN_USER, in the AS3 declaration order.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/RoomObjectVariableEnum.as::AVATAR_BLOCKED
    AVATAR_BLOCKED: 'blocked',
    AVATAR_TALK: 'figure_talk',
    AVATAR_DANCE: 'figure_dance',
    AVATAR_SLEEP: 'figure_sleep',
    AVATAR_BLINK: 'figure_blink',
    AVATAR_EFFECT: 'figure_effect',
    AVATAR_CARRY_OBJECT: 'figure_carry_object',
    AVATAR_USE_OBJECT: 'figure_use_object',
    AVATAR_GESTURE: 'figure_gesture',
    AVATAR_POSTURE: 'figure_posture',
    AVATAR_POSTURE_PARAMETER: 'figure_posture_parameter',
    AVATAR_POSTURE_STD: 'std',
    AVATAR_SIGN: 'figure_sign',
    AVATAR_FLAT_CONTROL: 'figure_flat_control',
    AVATAR_IS_TYPING: 'figure_is_typing',
    AVATAR_EXPRESSION: 'figure_expression',
    AVATAR_EXPERIENCE_TIMESTAMP: 'figure_experience_timestamp',
    AVATAR_GAINED_EXPERIENCE: 'figure_gained_experience',
    AVATAR_NUMBER_VALUE: 'figure_number_value',
    AVATAR_MOUSE_HIGHLIGHT: 'figure_highlight',
    AVATAR_HIGHLIGHT_ENABLE: 'figure_highlight_enable',
    // AS3: .../src/com/sulake/habbo/room/object/RoomObjectVariableEnum.as::AVATAR_JUMPING_POWER
    AVATAR_JUMPING_POWER: 'figure_jumping_power',
    // AS3: .../src/com/sulake/habbo/room/object/RoomObjectVariableEnum.as::AVATAR_ALPHA_MULTIPLIER
    AVATAR_ALPHA_MULTIPLIER: 'figure_alpha_multiplier',
    AVATAR_WIRED_VARIABLE_HOLDER_HIGHLIGHT: 'figure_highlight_variable_holder',
    AVATAR_CAN_STAND_UP: 'figure_can_stand_up',
    AVATAR_VERTICAL_OFFSET: 'figure_vertical_offset',
    AVATAR_IS_MUTED: 'figure_is_muted',
    AVATAR_GUIDE_STATUS: 'figure_guide_status',
    /** TS-only (RPG F3b §7.3): 1 while this avatar is the player's target. */
    AVATAR_RPG_TARGET: 'figure_rpg_target',
    HEAD_DIRECTION: 'head_direction',

    // Pet variables
    PET_PALETTE_INDEX: 'pet_palette_index',
    PET_COLOR: 'pet_color',
    PET_HEAD_ONLY: 'pet_head_only',
    PET_CUSTOM_LAYER_IDS: 'pet_custom_layer_ids',
    PET_CUSTOM_PART_IDS: 'pet_custom_part_ids',
    PET_CUSTOM_PALETTE_IDS: 'pet_custom_palette_ids',
    PET_IS_RIDING: 'pet_is_riding',
    PET_TYPE: 'pet_type',
    PET_ALLOWED_DIRECTIONS: 'pet_allowed_directions',

    // Furniture variables
    FURNITURE_REAL_ROOM_OBJECT: 'furniture_real_room_object',
    FURNITURE_COLOR: 'furniture_color',
    FURNITURE_TYPE_ID: 'furniture_type_id',
    FURNITURE_SIZE_X: 'furniture_size_x',
    FURNITURE_SIZE_Y: 'furniture_size_y',
    FURNITURE_SIZE_Z: 'furniture_size_z',
    FURNITURE_CENTER_X: 'furniture_center_x',
    FURNITURE_CENTER_Y: 'furniture_center_y',
    FURNITURE_CENTER_Z: 'furniture_center_z',
    FURNITURE_LIFT_AMOUNT: 'furniture_lift_amount',

    FURNITURE_ALLOWED_DIRECTIONS: 'furniture_allowed_directions',
    FURNITURE_DATA: 'furniture_data',
    FURNITURE_DATA_FORMAT: 'furniture_data_format',
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/data/CrackableStuffData.as
    // (INTERNAL_STATE_KEY / INTERNAL_HIT_KEY / INTERNAL_TARGET_KEY) — real constants, not derived.
    FURNITURE_CRACKABLE_STATE: 'furniture_crackable_state',
    FURNITURE_CRACKABLE_HITS: 'furniture_crackable_hits',
    FURNITURE_CRACKABLE_TARGET: 'furniture_crackable_target',
    FURNITURE_EXTRAS: 'furniture_extras',
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/RoomObjectVariableEnum.as:132
    // Distinct from FURNITURE_EXTRAS: AS3 writes both, the string one here and this numeric one.
    // The identifier is obfuscated in every tree that has it (_SafeStr_11509 here, const_1189 in
    // win63_version, _SafeStr_10982 in WIN63-202601121721) and the 2016 build predates it, so this
    // name is derived from the value, not recovered.
    FURNITURE_EXTRA: 'furniture_extra',
    FURNITURE_ITEMDATA: 'furniture_itemdata',
    FURNITURE_ALPHA_MULTIPLIER: 'furniture_alpha_multiplier',
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/RoomObjectVariableEnum.as::FURNITURE_INVISIBLE_LAYER
    FURNITURE_INVISIBLE_LAYER: 'furniture_invisible_layer',
    FURNITURE_EXPIRY_TIME: 'furniture_expiry_time',
    FURNITURE_EXPIRY_TIMESTAMP: 'furniture_expirty_timestamp',
    FURNITURE_STATE_UPDATE_TIME: 'furniture_state_update_time',
    FURNITURE_AUTOMATIC_STATE_INDEX: 'furniture_automatic_state_index',
    FURNITURE_UNIQUE_SERIAL_NUMBER: 'furniture_unique_serial_number',
    FURNITURE_UNIQUE_EDITION_SIZE: 'furniture_unique_edition_size',
    FURNITURE_CUSTOM_VARIABLES: 'furniture_custom_variables',
    FURNITURE_IS_VARIABLE_HEIGHT: 'furniture_is_variable_height',
    FURNITURE_CREDIT_VALUE: 'furniture_credit_value',
    FURNITURE_PLANETSYSTEM_DATA: 'furniture_planetsystem_data',
    FURNITURE_FIREWORKS_DATA: 'furniture_fireworks_data',
    FURNITURE_USES_PLANE_MASK: 'furniture_uses_plane_mask',
    FURNITURE_PLANE_MASK_TYPE: 'furniture_plane_mask_type',
    FURNITURE_AD_URL: 'furniture_ad_url',
    FURNITURE_BRANDING_IMAGE_STATUS: 'furniture_branding_image_status',
    FURNITURE_BRANDING_IMAGE_URL: 'furniture_branding_image_url',
    FURNITURE_BRANDING_URL: 'furniture_branding_url',
    FURNITURE_BRANDING_OFFSET_X: 'furniture_branding_offset_x',
    FURNITURE_BRANDING_OFFSET_Y: 'furniture_branding_offset_y',
    FURNITURE_BRANDING_OFFSET_Z: 'furniture_branding_offset_z',
    FURNITURE_SELECTION_DISABLE: 'furniture_selection_disable',
    FURNITURE_CLOTHING_GIRL: 'furniture_clothing_girl',
    FURNITURE_CLOTHING_BOY: 'furniture_clothing_boy',
    FURNITURE_MANNEQUIN_NAME: 'furniture_mannequin_name',
    FURNITURE_MANNEQUIN_GENDER: 'furniture_mannequin_gender',
    FURNITURE_MANNEQUIN_FIGURE: 'furniture_mannequin_figure',
    FURNITURE_IS_STICKIE: 'furniture_is_stickie',
    FURNITURE_USAGE_POLICY: 'furniture_usage_policy',
    FURNITURE_OWNER_ID: 'furniture_owner_id',
    FURNITURE_OWNER_NAME: 'furniture_owner_name',
    FURNITURE_GUILD_CUSTOMIZED_GUILD_ID: 'furniture_guild_customized_guild_id',
    FURNITURE_GUILD_CUSTOMIZED_COLOR_1: 'furniture_guild_customized_color_1',
    FURNITURE_GUILD_CUSTOMIZED_COLOR_2: 'furniture_guild_customized_color_2',
    FURNITURE_GUILD_CUSTOMIZED_BADGE_ASSET_NAME: 'furniture_guild_customized_asset_name',
    FURNITURE_PURCHASER_NAME: 'furniture_purchaser_name',
    FURNITURE_PURCHASER_FIGURE: 'furniture_purchaser_figure',
    FURNITURE_TRUSTED_SENDER: 'furniture_trusted_sender',
    FURNITURE_DISABLE_PICKING_ANIMATION: 'furniture_disable_picking_animation',
    FURNITURE_VOTE_COUNTER_COUNT: 'furniture_vote_counter_count',
    FURNITURE_VOTE_MAJORITY_RESULT: 'furniture_vote_majority_result',
    FURNITURE_SOUNDBLOCK_RELATIVE_ANIMATION_SPEED: 'furniture_soundblock_relative_animation_speed',
    FURNITURE_ROOM_BACKGROUND_COLOR_HUE: 'furniture_room_background_color_hue',
    FURNITURE_ROOM_BACKGROUND_COLOR_SATURATION: 'furniture_room_background_color_saturation',
    FURNITURE_ROOM_BACKGROUND_COLOR_LIGHTNESS: 'furniture_room_background_color_lightness',
    FURNITURE_AREA_HIDE_ROOT_X: 'furniture_area_hide_root_x',
    FURNITURE_AREA_HIDE_ROOT_Y: 'furniture_area_hide_root_y',
    FURNITURE_AREA_HIDE_WIDTH: 'furniture_area_hide_width',
    FURNITURE_AREA_HIDE_LENGTH: 'furniture_area_hide_length',
    FURNITURE_AREA_HIDE_INVISIBILITY: 'furniture_area_hide_invisibility',
    FURNITURE_AREA_HIDE_WALL_ITEMS: 'furniture_area_hide_wallitems',
    FURNITURE_AREA_HIDE_INVERT: 'furniture_area_hide_invert',
    FURNITURE_BADGE_ASSET_NAME: 'furniture_badge_asset_name',
    FURNITURE_BADGE_VISIBLE_IN_STATE: 'furniture_badge_visible_in_state',
    FURNITURE_BADGE_IMAGE_STATUS: 'furniture_badge_image_status',
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/RoomObjectVariableEnum.as::FURNITURE_FURNI_CHEST_SHOWN_ASSET_NAMES
    FURNITURE_FURNI_CHEST_SHOWN_ASSET_NAMES: 'furniture_furni_chest_shown_asset_names',
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/RoomObjectVariableEnum.as::_SafeStr_11725
    // (name DERIVED from the value — the identifier is obfuscated in every available tree, and
    // the 2016 build predates the constant.)
    FURNITURE_CHEST_IS_WIRED_ENABLED: 'furniture_chest_is_wired_enabled',
    FURNITURE_FRIENDFURNI_ENGRAVING_TYPE: 'furniture_friendfurni_engraving_type',
    FURNITURE_HIGHSCORE_SCORE_TYPE: 'furniture_highscore_score_type',
    FURNITURE_HIGHSCORE_CLEAR_TYPE: 'furniture_highscore_clear_type',
    FURNITURE_HIGHSCORE_DATA_ENTRY_COUNT: 'furniture_highscore_data_entry_count',
    FURNITURE_HIGHSCORE_DATA_ENTRY_BASE_USERS: 'furniture_highscore_data_entry_base_users_',
    FURNITURE_HIGHSCORE_DATA_ENTRY_BASE_SCORE: 'furniture_highscore_data_entry_base_score_',
    FURNITURE_INTERNAL_LINK: 'furniture_internal_link',
    FURNITURE_ALWAYS_STACKABLE: 'furniture_always_stackable',

    // Session variables
    SESSION_CURRENT_USER_ID: 'session_current_user_id',
    SESSION_URL_PREFIX: 'session_url_prefix',

    // Room variables
    ROOM_PLANE_PARSER: 'room_plane_parser',
    ROOM_PLANE_XML: 'room_plane_xml',
    ROOM_PLANE_MASK_XML: 'room_plane_mask_xml',
    ROOM_FLOOR_TYPE: 'room_floor_type',
    ROOM_WALL_TYPE: 'room_wall_type',
    ROOM_LANDSCAPE_TYPE: 'room_landscape_type',
    ROOM_WALL_THICKNESS_MULTIPLIER: 'room_wall_thickness',
    ROOM_FLOOR_THICKNESS_MULTIPLIER: 'room_floor_thickness',
    ROOM_FLOOR_HOLE_UPDATE_TIME: 'room_floor_hole_update_time',
    ROOM_FLOOR_VISIBILITY: 'room_floor_visibility',
    ROOM_WALL_VISIBILITY: 'room_wall_visibility',
    ROOM_LANDSCAPE_VISIBILITY: 'room_landscape_visibility',
    ROOM_DOOR_X: 'room_door_x',
    ROOM_DOOR_Y: 'room_door_y',
    ROOM_DOOR_Z: 'room_door_z',
    ROOM_DOOR_DIR: 'room_door_dir',
    ROOM_BACKGROUND_COLOR: 'room_background_color',
    ROOM_COLORIZE_BG_ONLY: 'room_colorize_bg_only',
    ROOM_RANDOM_SEED: 'room_random_seed',
    ROOM_WORLD_TYPE: 'room_world_type',
    ROOM_PLANE_COUNT: 'room_plane_count',
    ROOM_FLOOR_HEIGHT: 'room_floor_height',
    ROOM_WALL_HEIGHT: 'room_wall_height',
    ROOM_AD_SPRITE_TAG: 'billboard',
    ROOM_AD_IMAGE_ASSET: 'room_ad_image_asset',
    ROOM_AD_CLICK_URL: 'room_ad_click_url',
    ROOM_AD_WAITING: 'room_ad_waiting',
    ROOM_AD_WARNING_IMAGE_LEFT: 'room_ad_warning_image_left',
    ROOM_AD_WARNING_IMAGE_RIGHT: 'room_ad_warning_image_right',
    ROOM_SELECTED_X: 'room_selected_x',
    ROOM_SELECTED_Y: 'room_selected_y',
    ROOM_SELECTED_Z: 'room_selected_z',
    ROOM_SELECTED_PLANE: 'room_selected_plane',

    // Tile cursor
    TILE_CURSOR_HEIGHT: 'tile_cursor_height',
} as const;
