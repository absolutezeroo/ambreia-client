/**
 * Option lists for the furniture-definition editor's dropdowns.
 *
 * NOT ported from AS3 — Vortex-only staff tool.
 *
 * These mirror the emulator's own enums and logic registry so the operator picks from real values
 * instead of guessing magic numbers. The two sides are not wired together at runtime, so they can
 * drift: if the emulator gains an enum value or a `[RoomObjectLogic("...")]` key, add it here too.
 * The dropdowns are drift-tolerant for *reading* — the value the server reports is always shown even
 * if it is not in these lists (see FurniDefinitionView) — so drift only ever hides a value from the
 * picker, never corrupts an existing row.
 */

/** One dropdown option: the label shown, and the wire value it maps to. */
export interface IFurniOption
{
    readonly value: number;
    readonly label: string;
}

/**
 * Every logic the room engine can instantiate, i.e. every `[RoomObjectLogic("key")]` in the
 * emulator (`Vortex.Rooms/Object/Logic/**`), sorted. The value IS the string, so the dropdown is
 * populated with these verbatim.
 *
 * Grep marker for the drift note above: FURNITURE_LOGICS mirrors [RoomObjectLogic].
 */
export const FURNITURE_LOGICS: readonly string[] = [
    'default_avatar',
    'default_floor',
    'default_wall',
    'dice',
    'fireworks',
    'freeze_block',
    'freeze_counter_blue',
    'freeze_counter_green',
    'freeze_counter_red',
    'freeze_counter_yellow',
    'freeze_exit',
    'freeze_gate_blue',
    'freeze_gate_green',
    'freeze_gate_red',
    'freeze_gate_yellow',
    'freeze_tile',
    'game_timer',
    'gate',
    'monsterplant_seed',
    'pet_drink',
    'pet_food',
    'pet_nest',
    'roller',
    'room_invisible_click_tile',
    'wf_act_adjust_clock',
    'wf_act_chase',
    'wf_act_cnd_move_furni',
    'wf_act_control_clock',
    'wf_act_flee',
    'wf_act_forward_user',
    'wf_act_give_effect',
    'wf_act_give_score',
    'wf_act_give_score_tm',
    'wf_act_give_var',
    'wf_act_join_team',
    'wf_act_kick_user',
    'wf_act_leave_team',
    'wf_act_lower_furni',
    'wf_act_move_furni_to',
    'wf_act_move_rotate',
    'wf_act_move_to_dir',
    'wf_act_neg_send_signal',
    'wf_act_raise_furni',
    'wf_act_rel_mov',
    'wf_act_remove_var',
    'wf_act_reset_timers',
    'wf_act_send_signal',
    'wf_act_set_altitude',
    'wf_act_show_message',
    'wf_act_show_message_room',
    'wf_act_teleport_to',
    'wf_act_toggle_state',
    'wf_act_toggle_to_rnd',
    'wf_act_tp_furni_to_habbo',
    'wf_cnd_actor_dir',
    'wf_cnd_actor_in_group',
    'wf_cnd_actor_in_team',
    'wf_cnd_counter_time_matches',
    'wf_cnd_furnis_hv_avtrs',
    'wf_cnd_habbo_owns_badge',
    'wf_cnd_has_furni_on',
    'wf_cnd_has_same_height',
    'wf_cnd_match_snapshot_new',
    'wf_cnd_not_actor_in_group',
    'wf_cnd_not_furni_on',
    'wf_cnd_not_habbo_owns_badge',
    'wf_cnd_not_hv_avtrs',
    'wf_cnd_not_in_team',
    'wf_cnd_not_match_snap_new',
    'wf_cnd_not_stuff_is',
    'wf_cnd_not_trggrer_on',
    'wf_cnd_not_triggerer_match',
    'wf_cnd_not_user_count',
    'wf_cnd_not_user_performs_action',
    'wf_cnd_not_wears_effect',
    'wf_cnd_not_wears_handitem',
    'wf_cnd_slc_quantity',
    'wf_cnd_stuff_is',
    'wf_cnd_team_has_rank',
    'wf_cnd_team_has_score',
    'wf_cnd_time_less_than',
    'wf_cnd_time_more_than',
    'wf_cnd_trggrer_on_frn',
    'wf_cnd_triggerer_match',
    'wf_cnd_user_count_in',
    'wf_cnd_user_performs_action',
    'wf_cnd_wears_effect',
    'wf_cnd_wears_handitem',
    'wf_slc_furni_altitude',
    'wf_slc_furni_area',
    'wf_slc_furni_bytype',
    'wf_slc_furni_neighborhood',
    'wf_slc_furni_onfurni',
    'wf_slc_furni_picks',
    'wf_slc_furni_signal',
    'wf_slc_furni_with_var',
    'wf_slc_remote',
    'wf_slc_users_area',
    'wf_slc_users_byaction',
    'wf_slc_users_byname',
    'wf_slc_users_bytype',
    'wf_slc_users_group',
    'wf_slc_users_handitem',
    'wf_slc_users_neighborhood',
    'wf_slc_users_onfurni',
    'wf_slc_users_signal',
    'wf_slc_users_team',
    'wf_slc_users_with_var',
    'wf_trg_at_given_time',
    'wf_trg_at_time_long',
    'wf_trg_bot_reached_avtr',
    'wf_trg_bot_reached_stf',
    'wf_trg_click_furni',
    'wf_trg_click_tile',
    'wf_trg_click_user',
    'wf_trg_clock_counter',
    'wf_trg_collision',
    'wf_trg_enter_room',
    'wf_trg_game_ends',
    'wf_trg_game_starts',
    'wf_trg_period_long',
    'wf_trg_period_short',
    'wf_trg_periodically',
    'wf_trg_recv_signal',
    'wf_trg_says_something',
    'wf_trg_score_achieved',
    'wf_trg_state_changed',
    'wf_trg_stuff_state',
    'wf_trg_user_exits_room',
    'wf_trg_user_performs_action',
    'wf_trg_var_changed',
    'wf_trg_walks_off_furni',
    'wf_trg_walks_on_furni',
    'wf_var_context',
    'wf_var_furni',
    'wf_var_quest',
    'wf_var_quest_chain',
    'wf_var_reference',
    'wf_var_room',
    'wf_var_user',
    'wf_xtra_anim_time',
    'wf_xtra_execution_limit',
    'wf_xtra_filter_furni',
    'wf_xtra_filter_users',
    'wf_xtra_mov_carry_users',
    'wf_xtra_mov_no_animation',
    'wf_xtra_mov_physics',
    'wf_xtra_one_condition',
    'wf_xtra_random',
    'wf_xtra_unseen',
    'wheel_of_fortune'
];

/** The emulator's `ProductType` — only Floor/Wall are valid furniture (see RoomItemsProvider). */
export const PRODUCT_TYPE_OPTIONS: readonly IFurniOption[] = [
    {value: 0, label: 'Floor'},
    {value: 1, label: 'Wall'}
];

/** The emulator's `FurnitureCategory`. */
export const FURNI_CATEGORY_OPTIONS: readonly IFurniOption[] = [
    {value: 1, label: 'Default'},
    {value: 2, label: 'WallPaper'},
    {value: 3, label: 'Floor'},
    {value: 4, label: 'Landscape'},
    {value: 5, label: 'PostIt'},
    {value: 6, label: 'Poster'},
    {value: 7, label: 'SoundSet'},
    {value: 8, label: 'TraxSong'},
    {value: 9, label: 'Present'},
    {value: 10, label: 'EcotronBox'},
    {value: 11, label: 'Trophy'},
    {value: 12, label: 'CreditFurni'},
    {value: 13, label: 'PetShampoo'},
    {value: 14, label: 'PetCustomPart'},
    {value: 15, label: 'PetCustomPartShampoo'},
    {value: 16, label: 'PetSaddle'},
    {value: 17, label: 'GuildFurni'},
    {value: 18, label: 'GameFurni'},
    {value: 19, label: 'MonsterplantSeed'},
    {value: 20, label: 'MonsterplantRevival'},
    {value: 21, label: 'MonsterplantRebreed'},
    {value: 22, label: 'MonsterplantFertilize'},
    {value: 23, label: 'FigurePurchasableSet'}
];

/** The emulator's `FurnitureUsageType`. */
export const FURNI_USAGE_OPTIONS: readonly IFurniOption[] = [
    {value: 0, label: 'Nobody'},
    {value: 1, label: 'Controller'},
    {value: 2, label: 'Everybody'}
];

/** The emulator's `StuffDataType`. */
export const STUFF_DATA_TYPE_OPTIONS: readonly IFurniOption[] = [
    {value: 0, label: 'Legacy'},
    {value: 1, label: 'Map'},
    {value: 2, label: 'String'},
    {value: 3, label: 'Vote'},
    {value: 4, label: 'Empty'},
    {value: 5, label: 'Number'},
    {value: 6, label: 'Highscore'},
    {value: 7, label: 'Crackable'}
];
