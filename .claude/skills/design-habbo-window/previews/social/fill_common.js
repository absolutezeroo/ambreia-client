// Shared sample data and helpers of the social previews (friends, group, guild).
const I = {
    chat: 'rpg/ui-icons/software_speech_bubble_three_dots_dialogue_icon', more: 'rpg/ui-icons/software_signs_maths_minus_subtract_drawback_remove_delete_dash_icon', crown: 'rpg/ui-icons/hats_crown_king_monarch_ruler_emperor_icon',
    shield: 'rpg/ui-icons/rpg_difficulty_3_medium_buckler_targe_shield_icon', heal: 'rpg/ui-icons/software_signs_maths_plus_addition_bonus_add_new_icon', sword: 'rpg/ui-icons/rpg_item_weapon_sword_attack_melee_slashing_damage_icon',
    check: 'rpg/ui-icons/software_signs_checkmark_checkbox_ticked_todo_icon', x: 'rpg/ui-icons/software_signs_maths_multiplication_x_crossout_checkmark_cancel_icon', clock: 'rpg/ui-icons/software_clock_time_wait_1_icon',
    group: 'rpg/ui-icons/travel_person_people_three_icon', house: 'rpg/ui-icons/map_markers_building_home_house_icon', lock: 'rpg/ui-icons/map_markers_doorway_enterance_exit_locked_icon', unlock: 'rpg/ui-icons/tools_crafting_padlock_unlocked_1_icon',
    star: 'rpg/ui-icons/boardgames_card_star_icon', ban: 'rpg/ui-icons/software_sign_crossout_cancel_forbidden_illegal_1_icon', profile: 'rpg/ui-icons/travel_person_people_two_icon', note: 'rpg/ui-icons/tools_crafting_writing_parchment_scroll_document_icon',
    coin: 'rpg/ui-icons/rpg_coin_gold_currency_money_gp_icon', banner: 'rpg/ui-icons/map_markers_banner_heraldry_icon', gear: 'rpg/ui-icons/software_options_settings_cogwheel_gear_mechanics_icon', chest: 'rpg/ui-icons/tools_crafting_chest_locked_loot_icon',
};
const STATUS = {online: 0x4cc040, offline: 0xd23a2a, group: 0xffd040, room: 0x2a8fd6};
const FRIENDS = [['Léa', 'En ligne', 'online'], ['Aiko', 'Dans un appart : Club NX', 'room'], ['Marek', 'Dans un groupe', 'group'], ['Sofia', 'Ville d’Ambre - Place Centrale', 'room', true], ['Tomy', 'En ligne', 'online'], ['Nina', 'Dans un appart : Coffee House', 'room'], ['Zed', 'En ligne', 'online'], ['Kuro', 'Dans un groupe', 'group']];
const friendRow = (list, [name, presence, status, selected]) => add(list, 'vortex_social_friend_row_xml', (r) => { text(r, 'friend_name', name); text(r, 'presence_txt', presence); tint(r, 'status_dot', STATUS[status]); show(r, 'selected', !!selected); });
const sectionHeader = (list, label, status) => add(list, 'vortex_social_section_header_xml', (h) => { text(h, 'section_txt', label); tint(h, 'status_dot', STATUS[status]); });
const requestRow = (list, [name, level, context, selected]) => add(list, 'vortex_social_request_row_xml', (r) => { text(r, 'player_name', name); text(r, 'player_level', level); text(r, 'request_context', context); show(r, 'selected', !!selected); });
const sentRow = (list, [name, level]) => add(list, 'vortex_social_sent_row_xml', (r) => { text(r, 'player_name', name); text(r, 'player_level', level); text(r, 'sent_pill_txt', 'Demande envoyée'); });
const blockedRow = (list, [name, reason, date, selected]) => add(list, 'vortex_social_blocked_row_xml', (r) => { text(r, 'player_name', name); text(r, 'block_reason', reason); text(r, 'block_date', date); show(r, 'selected', !!selected); });
const ROLES = {tank: ['Tank', I.shield, 0x4090e0], heal: ['Soigneur', I.heal, 0x40b030], dps: ['DPS', I.sword, 0xe09a60]};
const memberRow = (list, [name, role, hp, px, leader, ready, selected]) => add(list, 'vortex_social_group_member_xml', (m) => {
    text(m, 'member_name', name); text(m, 'member_role', ROLES[role][0]); text(m, 'points', hp); bar(m, 'hp_bar', px); show(m, 'leader_icon', !!leader); show(m, 'ready_box', ready === true); show(m, 'waiting_box', ready === 'wait'); show(m, 'selected', !!selected);
    icon(m, 'role_icon', ROLES[role][1]); tint(m, 'role_icon', ROLES[role][2]);
});
const guildHeader = (slot, {online = '6 en ligne'} = {}) => place(slot, 'vortex_social_guild_header_xml', 0, 0, (h) => { text(h, 'guild_name', 'Les Aventuriers'); text(h, 'guild_tag', '[HAB]'); text(h, 'guild_desc', 'Exploration, entraide et bonne ambiance depuis 2024 !'); text(h, 'guild_level', 'Niveau 5'); text(h, 'guild_members', '28 membres'); text(h, 'guild_online', online); icon(h, 'guild_emblem', I.banner); tint(h, 'guild_emblem', 0xffd040); });
const GUILD_ROLE = {chef: ['Chef', I.crown, 0xffd040], officier: ['Officier', I.shield, 0x4090e0], membre: ['Membre', I.profile, 0x8a94a0], recrue: ['Recrue', I.star, 0xd8a060]};
