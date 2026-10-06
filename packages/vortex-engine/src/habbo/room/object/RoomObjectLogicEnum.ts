/**
 * RoomObjectLogicEnum
 *
 * Based on AS3: com.sulake.habbo.room.object.RoomObjectLogicEnum
 *
 * Constants for room object logic type identifiers.
 */
export const RoomObjectLogicEnum = {
    // Basic furniture
    FURNITURE_BASIC: 'furniture_basic',
    FURNITURE_MULTISTATE: 'furniture_multistate',
    FURNITURE_MULTIHEIGHT: 'furniture_multiheight',
    FURNITURE_RANDOMSTATE: 'furniture_randomstate',
    FURNITURE_PLACEHOLDER: 'furniture_placeholder',
    FURNITURE_CREDIT: 'furniture_credit',
    FURNITURE_STICKIE: 'furniture_stickie',
    FURNITURE_PRESENT: 'furniture_present',
    FURNITURE_TROPHY: 'furniture_trophy',
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/RoomObjectLogicEnum.as::FURNITURE_FURNI_CHEST
    FURNITURE_FURNI_CHEST: 'furniture_furnichest',
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/RoomObjectLogicEnum.as::FURNITURE_COINS_CHEST
    FURNITURE_COINS_CHEST: 'furniture_coinschest',
    FURNITURE_ECOTRON_BOX: 'furniture_ecotron_box',
    FURNITURE_DICE: 'furniture_dice',
    FURNITURE_HOCKEY_SCORE: 'furniture_hockey_score',
    FURNITURE_HABBOWHEEL: 'furniture_habbowheel',
    FURNITURE_ONE_WAY_DOOR: 'furniture_one_way_door',
    FURNITURE_PLANET_SYSTEM: 'furniture_planet_system',
    FURNITURE_WINDOW: 'furniture_window',
    FURNITURE_EXTERNAL_IMAGE_WALLITEM: 'furniture_external_image_wallitem',
    FURNITURE_ROOMDIMMER: 'furniture_roomdimmer',
    FURNITURE_SOUND_MACHINE: 'furniture_sound_machine',
    FURNITURE_JUKEBOX: 'furniture_jukebox',
    FURNITURE_CRACKABLE: 'furniture_crackable',
    FURNITURE_PUSHABLE: 'furniture_pushable',
    FURNITURE_CLOTHING_CHANGE: 'furniture_clothing_change',
    FURNITURE_COUNTER_CLOCK: 'furniture_counter_clock',
    FURNITURE_SCORE: 'furniture_score',
    FURNITURE_ES: 'furniture_es',
    FURNITURE_FIREWORKS: 'furniture_fireworks',
    FURNITURE_SONG_DISK: 'furniture_song_disk',
    FURNITURE_BB: 'furniture_bb',
    FURNITURE_BG: 'furniture_bg',
    FURNITURE_WELCOME_GIFT: 'furniture_welcome_gift',
    FURNITURE_FLOOR_HOLE: 'furniture_floor_hole',
    FURNITURE_MANNEQUIN: 'furniture_mannequin',
    FURNITURE_GUILD_CUSTOMIZED: 'furniture_guild_customized',
    FURNITURE_GROUP_FORUM_TERMINAL: 'furniture_group_forum_terminal',
    FURNITURE_PET_CUSTOMIZATION: 'furniture_pet_customization',
    FURNITURE_CUCKOO_CLOCK: 'furniture_cuckoo_clock',
    FURNITURE_VOTE_COUNTER: 'furniture_vote_counter',
    FURNITURE_VOTE_MAJORITY: 'furniture_vote_majority',
    FURNITURE_SOUNDBLOCK: 'furniture_soundblock',
    FURNITURE_RANDOM_TELEPORT: 'furniture_random_teleport',
    FURNITURE_MONSTERPLANT_SEED: 'furniture_monsterplant_seed',
    FURNITURE_PURCHASABLE_CLOTHING: 'furniture_purchasable_clothing',
    FURNITURE_BACKGROUND_COLOR: 'furniture_background_color',
    FURNITURE_AREA_HIDE: 'furniture_area_hide',

    FURNITURE_EFFECTBOX: 'furniture_effectbox',

    FURNITURE_ACHIEVEMENT_RESOLUTION: 'furniture_achievement_resolution',
    FURNITURE_LOVELOCK_ENGRAVING: 'furniture_lovelock',
    FURNITURE_WILD_WEST_WANTED_ENGRAVING: 'furniture_wildwest_wanted',
    FURNITURE_HABBOWEEN_ENGRAVING: 'furniture_hween_lovelock',
    FURNITURE_BADGE_DISPLAY: 'furniture_badge_display',
    FURNITURE_HIGH_SCORE: 'furniture_high_score',
    FURNITURE_INTERNAL_LINK: 'furniture_internal_link',
    FURNITURE_CUSTOM_STACK_HEIGHT: 'furniture_custom_stack_height',
    FURNITURE_YOUTUBE: 'furniture_youtube',
    FURNITURE_RENTABLE_SPACE: 'furniture_rentable_space',
    FURNITURE_CHANGE_STATE_WHEN_STEP_ON: 'furniture_change_state_when_step_on',
    FURNITURE_VIMEO: 'furniture_vimeo',
    FURNITURE_EDITABLE_INTERNAL_LINK: 'furniture_editable_internal_link',
    FURNITURE_EDITABLE_ROOM_LINK: 'furniture_editable_room_link',
    FURNITURE_CRAFTING_GIZMO: 'furniture_crafting_gizmo',
    // TS-only: Vortex-only fishing system — no AS3 counterpart. The value is the `logic` field a
    // fishing-spot furni carries in furnidata. See docs/vortex-original/fishing.md §2.3.
    VORTEX_FISHING_SPOT: 'vortex_fishing_spot',
    // TS-only: Vortex-only fishing system. The sign is a furni of its own, not part of the spot —
    // clicking it opens the Fish-O-Pedia. See docs/vortex-original/fishing.md §1 and §15.
    VORTEX_FISHING_SIGN: 'vortex_fishing_sign',
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/RoomObjectLogicEnum.as::FURNITURE_NFT_CREDIT
    FURNITURE_NFT_CREDIT: 'furniture_nft_credit',
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/RoomObjectLogicEnum.as:138
    // The AS3 identifier is obfuscated in every tree that has it (_SafeStr_11143 here, const_801 in
    // win63_version, _SafeStr_10581 in WIN63-202601121721) and the 2016 build predates NFTs, so the
    // real name is unrecoverable. This one is derived from the value, not recovered.
    FURNITURE_NFT_REWARD_BOX: 'furniture_nft_reward_box',

    // Room and users
    ROOM: 'room',
    USER: 'user',
    BOT: 'bot',
    RENTABLE_BOT: 'rentable_bot',
    PET: 'pet',
    ROOM_TILE_CURSOR: 'tile_cursor',
    SELECTION_ARROW: 'selection_arrow',
} as const;
