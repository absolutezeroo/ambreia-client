/**
 * RoomObjectVisualizationEnum
 *
 * @see com.sulake.habbo.room.object.RoomObjectVisualizationFactory
 *
 * Constants for room object visualization type identifiers.
 * These map to specific visualization class instantiations.
 */
export const RoomObjectVisualizationEnum = {
    // Room
    ROOM: 'room',

    // Tile cursor
    TILE_CURSOR: 'tile_cursor',

    // Avatar (deferred)
    USER: 'user',
    BOT: 'bot',
    RENTABLE_BOT: 'rentable_bot',
    PET_ANIMATED: 'pet_animated',

    // Furniture - static
    FURNITURE_STATIC: 'furniture_static',

    // Furniture - animated
    FURNITURE_ANIMATED: 'furniture_animated',
    FURNITURE_RESETTING_ANIMATED: 'furniture_resetting_animated',

    // Furniture - specialized
    FURNITURE_POSTER: 'furniture_poster',
    FURNITURE_HABBOWHEEL: 'furniture_habbowheel',
    FURNITURE_VAL_RANDOMIZER: 'furniture_val_randomizer',
    FURNITURE_BOTTLE: 'furniture_bottle',
    FURNITURE_FURNI_CHEST: 'furniture_furnichest',
    FURNITURE_COINS_CHEST: 'furniture_coinschest',
    FURNITURE_PLANET_SYSTEM: 'furniture_planet_system',
    FURNITURE_QUEUE_TILE: 'furniture_queue_tile',
    FURNITURE_PARTY_BEAMER: 'furniture_party_beamer',
    FURNITURE_CUBOID: 'furniture_cuboid',
    FURNITURE_GIFT_WRAPPED: 'furniture_gift_wrapped',
    FURNITURE_COUNTER_CLOCK: 'furniture_counter_clock',
    FURNITURE_WATER_AREA: 'furniture_water_area',
    FURNITURE_SCORE_BOARD: 'furniture_score_board',
    FURNITURE_FIREWORKS: 'furniture_fireworks',
    FURNITURE_GIFT_WRAPPED_FIREWORKS: 'furniture_gift_wrapped_fireworks',
    FURNITURE_BB: 'furniture_bb',
    FURNITURE_BG: 'furniture_bg',
    FURNITURE_STICKIE: 'furniture_stickie',
    FURNITURE_MANNEQUIN: 'furniture_mannequin',
    FURNITURE_GUILD_CUSTOMIZED: 'furniture_guild_customized',
    FURNITURE_GUILD_ISOMETRIC_BADGE: 'furniture_guild_isometric_badge',
    FURNITURE_VOTE_COUNTER: 'furniture_vote_counter',
    FURNITURE_VOTE_MAJORITY: 'furniture_vote_majority',
    FURNITURE_SOUNDBLOCK: 'furniture_soundblock',
    FURNITURE_BADGE_DISPLAY: 'furniture_badge_display',
    FURNITURE_YOUTUBE: 'furniture_youtube',
    FURNITURE_EXTERNAL_IMAGE: 'furniture_external_image',

    // Game objects (deferred)
    GAME_SNOWBALL: 'game_snowball',
    GAME_SNOWSPLASH: 'game_snowsplash',
} as const;
