// Fills the calendar and settings boards (states_calendar/missions/settings/access.xml). Every block checks its slot,
// so the one script serves the four boards.
const at = (name) => find(root, name);
const U = 'rpg/ui-icons/';
const K = {
    coin: U + 'rpg_coin_gold_currency_money_gp_icon', potion: U + 'alchemy_potion_vial_bottle_heart_health_life_full_icon', gem: U + 'rpg_gem_jewelcrafting_diamond_points_currency_icon',
    chest: U + 'tools_crafting_chest_locked_loot_icon', check: U + 'software_signs_checkmark_checkbox_ticked_todo_icon', lock: U + 'map_markers_doorway_enterance_exit_locked_icon', hourglass: U + 'software_hourglass_sand_time_wait_icon',
    swords: U + 'rpg_crossed_swords_duel_pvp_combat_battle_war_icon', banner: U + 'map_markers_banner_heraldry_icon', boss: U + 'rpg_difficulty_5_brutal_monster_demon_boss_skull_shield_icon', refresh: U + 'arrows_roundabout_rotation_circle_reload_refresh_loop_icon',
    chat: U + 'software_speech_bubble_three_dots_dialogue_icon', hammer: U + 'rpg_item_weapon_hammer_mace_crushing_damage_icon', wood: U + 'map_markers_building_wooden_palisade_wall_icon', skull: U + 'rpg_skull_death_dead_small_icon',
    play: U + 'arrows_media_controls_play_triangle_icon', person: U + 'travel_person_people_two_icon', gear: U + 'software_options_settings_cogwheel_gear_mechanics_icon', book: U + 'tools_crafting_books_manual_codex_instructions_tutorial_documentation_icon',
    keyboard: U + 'software_hardware_keyboard_button_key_input_icon', swap: U + 'arrows_media_controls_swap_shuffle_icon', x: U + 'software_signs_maths_multiplication_x_crossout_checkmark_cancel_icon',
    volume: U + 'media_audio_sound_volume_3_icon', monitor: U + 'software_hardware_monitor_display_pc_computer_icon', bell: U + 'travel_bell_notification_ringing_icon', access: U + 'travel_person_wheelchair_accessiblity_special_wc_toilet_icon',
    sword: U + 'rpg_item_weapon_sword_attack_melee_slashing_damage_icon', fire: U + 'weather_wildfire_flame_element_hot_burn_icon', backpack: U + 'travel_backpack_bag_bedroll_icon', map: U + 'map_markers_treasure_map_paper_parchment_icon',
    group: U + 'travel_person_people_three_icon', target: U + 'rpg_skill_killshot_bow_ranged_attack_skull_icon', horse: U + 'rpg_stat_lucky_horseshoe_icon', pvp: U + 'rpg_crossed_swords_shield_combat_battle_war_icon', shard: U + 'alchemy_brimstone_black_sulfur_leviathan_cross_icon',
};
const GOLD = 0xf0c030, RED = 0xd23a2a, BLUE = 0x3a90e0, BROWN = 0xb07840, GREEN = 0x40b030, GREY = 0x8a94a0;
const chips = (bar, list, widths) => { let x = 0; list.forEach((t, i) => { place(bar, 'vortex_hud_chip_xml', x, 0, (c) => { const w = widths[i]; c.width = w; find(c, 'chip_txt').width = w; text(c, 'chip_txt', t); if(i === 0) tint(c, null, 0x2a6aa0); }); x += widths[i] + 6; }); };
const frameWith = (slot, tabName, content, fill) => place(at(slot), 'vortex_calendar_xml', 0, 0, (f) => { tab(f, tabName); place(find(f, 'tab_content'), content, 0, 0, fill); });

// 1. reward calendar
const DAYS = [[K.coin, GOLD, '', 'claimed'], [K.potion, RED, '', 'claimed'], [K.wood, BROWN, '', 'claimed'], [K.gem, BLUE, '10', 'today'], [K.chest, BROWN, '', 'locked'], [K.coin, GOLD, '', 'locked'], [K.chest, RED, '', 'locked']];
const day = (d, n, [uri, c, count, state]) => {
    text(d, 'day_txt', `Jour ${n}`); icon(d, 'reward_icon', uri); tint(d, 'reward_icon', c); text(d, 'count_txt', count);
    const s = {claimed: [K.check, GREEN, 'Récupérée', 0x2b9a00], today: [null, 0, 'Aujourd’hui', 0xb07a10], locked: [K.lock, GREY, 'Verrouillée', 0x666666]}[state];
    if(s[0]) { icon(d, 'state_icon', s[0]); tint(d, 'state_icon', s[1]); } else show(d, 'state_icon', false);
    text(d, 'state_txt', s[2]); tcolor(d, 'state_txt', s[3]); show(d, 'selected', state === 'today');
};
frameWith('cal_rewards', 'tab_rewards', 'vortex_calendar_tab_rewards_xml', (t) => {
    DAYS.forEach((v, i) => add(find(t, 'day_list'), 'vortex_calendar_day_xml', (d) => day(d, i + 1, v)));
    const dt = find(t, 'detail'); icon(dt, 'detail_icon', K.gem); tint(dt, 'detail_icon', BLUE); text(dt, 'detail_count', '10'); text(dt, 'detail_day', 'Jour 4'); text(dt, 'detail_name', 'Minerai de Fer'); text(dt, 'detail_desc', 'Un minerai commun utilisé pour la forge.');
    const b = find(t, 'boss_box'); text(b, 'boss_name', 'Drake d’Ambre'); text(b, 'boss_sub', 'World Boss · Niveau 50 · Zone : Montagnes d’Ambre'); text(b, 'boss_timer', 'Dans 2 j 7 h 12 m'); text(b, 'boss_players', '128 joueurs inscrits'); text(b, 'boss_rank', 'Rang actuel : Top 32 %');
    text(find(b, 'boss_bar'), 'points', '12 450 / 25 000 pts');
    [[1, K.coin, GOLD, '500', 'done'], [2, K.potion, RED, '5', 'done'], [3, K.wood, BROWN, '10', 'done'], [4, K.gem, BLUE, '3', 'current'], [5, K.chest, RED, '', 'next']].forEach(([n, uri, c, v, st]) => add(find(b, 'tier_list'), 'vortex_calendar_tier_xml', (r) => tierFill(r, n, uri, c, v, st)));
});
function tierFill(r, n, uri, c, v, st) { text(r, 'tier_txt', `Palier ${n}`); icon(r, 'tier_icon', uri); tint(r, 'tier_icon', c); text(r, 'tier_reward', v || '1'); const s = {done: [K.check, GREEN], current: [K.hourglass, 0xd8a030], next: [K.lock, GREY]}[st]; icon(r, 'tier_state', s[0]); tint(r, 'tier_state', s[1]); show(r, 'selected', st === 'current'); }
if(at('days')) [[K.coin, GOLD, '', 'claimed'], [K.gem, BLUE, '10', 'today'], [K.chest, BROWN, '', 'locked'], [K.chest, RED, '', 'locked']].forEach((v, i) => place(at('days'), 'vortex_calendar_day_xml', i * 100, i === 3 ? 0 : 2, (d) => day(d, [1, 4, 5, 7][i], v)));
if(at('tiers')) [['done', 1, K.coin, GOLD, '500'], ['current', 4, K.gem, BLUE, '3'], ['next', 5, K.chest, RED, '']].forEach(([st, n, uri, c, v], i) => place(at('tiers'), 'vortex_calendar_tier_xml', i * 136, 0, (r) => tierFill(r, n, uri, c, v, st)));
place(at('popup'), 'vortex_calendar_reward_popup_xml', 0, 0, (p) => {
    text(p, 'reward_title', 'Coffre d’événement');
    for(const [uri, c, n] of [[K.coin, GOLD, '500'], [K.potion, RED, '5'], [K.gem, BLUE, '3'], [K.wood, BROWN, '10']]) add(find(p, 'reward_list'), 'vortex_inventory_item_slot_xml', (s) => { icon(s, 'item_icon', uri); tint(s, 'item_icon', c); text(s, 'item_count', n); });
});

// 2. events
frameWith('cal_events', 'tab_events', 'vortex_calendar_tab_events_xml', (t) => {
    chips(find(t, 'filter_bar'), ['Tous', 'Événements serveur', 'Guilde', 'World Boss'], [70, 150, 80, 100]);
    for(const [name, kind, pill, when, cd, uri, c] of [
        ['Guerre des Royaumes', 'Événement serveur', 0xb02818, 'Aujourd’hui à 20:00', '2 h 15 m', K.swords, RED],
        ['Convoi de la Guilde', 'Événement de guilde', 0x2a6aa0, 'Demain à 18:00', '1 j 4 h', K.banner, BLUE],
        ['Drake d’Ambre', 'World Boss', 0x6a4c9c, 'Sam. 14 juin à 21:00', '2 j 7 h', K.skull, RED],
        ['Ruée aux trésors', 'Événement serveur', 0xb02818, 'Dim. 15 juin à 14:00', '3 j 0 h', K.chest, BROWN],
        ['Réinitialisation hebdomadaire', '', 0, 'Quêtes, boutique et classements', '4 j 12 h', K.refresh, 0x6a6a72]])
        add(find(t, 'event_list'), 'vortex_calendar_event_row_xml', (r) => { text(r, 'event_name', name); text(r, 'event_when', when); text(r, 'countdown_txt', cd); icon(r, 'event_icon', uri); tint(r, 'event_icon', c); if(pill) { text(r, 'kind_txt', kind); tint(r, 'kind_pill', pill); } else { show(r, 'kind_pill', false); find(r, 'event_when').x = 52; } });
});

// 3. missions, wallet, components
frameWith('cal_missions', 'tab_missions', 'vortex_calendar_tab_missions_xml', (t) => {
    chips(find(t, 'filter_bar'), ['Quotidiennes', 'Hebdomadaires', 'Saisonnières'], [110, 120, 120]);
    for(const [name, p, n, uri, c, rUri, rc, rv] of [
        ['Vaincre 10 monstres d’élite', 3, 10, K.swords, 0x6a6a72, K.coin, GOLD, '250'], ['Collecter 50 Bois d’Ambre', 28, 50, K.wood, BROWN, K.coin, GOLD, '200'],
        ['Participer à un événement public', 0, 1, K.chat, 0x2a6aa0, K.gem, BLUE, '2'], ['Fabriquer 5 objets', 5, 5, K.hammer, 0x6a6a72, K.potion, RED, '3'], ['Vaincre un World Boss', 0, 1, K.skull, RED, K.chest, RED, '1']])
        add(find(t, 'mission_list'), 'vortex_calendar_mission_row_xml', (r) => {
            text(r, 'mission_name', name); text(r, 'progress_txt', `${p} / ${n}`); bar(r, 'progress', Math.round(220 * p / n)); icon(r, 'mission_icon', uri); tint(r, 'mission_icon', c); icon(r, 'reward_icon', rUri); tint(r, 'reward_icon', rc); text(r, 'reward_txt', rv);
            if(p === n) { tint(find(r, 'progress'), 'fill', 0x40b030); tcolor(r, 'progress_txt', 0x2b9a00); text(r, 'action_button', 'Récupérer'); tint(r, 'action_button', 0x2f9e2f); }
        });
});
frameWith('cal_wallet', 'tab_wallet', 'vortex_calendar_tab_wallet_xml', (t) => {
    for(const [k, v, uri, c] of [['gold', '125 430', K.coin, GOLD], ['gems', '2 580', K.gem, BLUE], ['pvp', '1 250', K.pvp, RED], ['guild', '320', K.banner, 0x2a6aa0], ['event', '480', K.coin, 0xe08020], ['shards', '75', K.shard, 0xe0a030]])
        add(find(t, 'currency_list'), 'vortex_calendar_currency_row_xml', (r) => { text(r, 'currency_name', `\${vortex.calendar.currency.${k}}`); text(r, 'currency_desc', `\${vortex.calendar.currency.${k}_desc}`); text(r, 'currency_amount', v); icon(r, 'currency_icon', uri); tint(r, 'currency_icon', c); });
});
if(at('bars')) [[143, 0x2a8fd6], [119, 0x8a3ad0], [230, 0x40b030]].forEach(([w, c], i) => { const row = build('vortex_calendar_mission_row_xml'); const b = find(row, 'progress'); b.x = 0; b.y = 8 + i * 30; b.width = 230; find(b, 'bg').width = 230; find(b, 'fill').width = w; tint(b, 'fill', c); at('bars').addChild(b); });
if(at('chips')) [0, 1].forEach((row) => ['Tous', 'Serveur', 'Guilde'].forEach((t, i) => place(at('chips'), 'vortex_hud_chip_xml', i * 90, row * 30, (c) => { c.width = 84; find(c, 'chip_txt').width = 84; text(c, 'chip_txt', t); if(row === 0 && i === 0) tint(c, null, 0x2a6aa0); })));
place(at('tip_item'), 'vortex_inventory_tip_xml', 0, 0, (t) => { icon(t, 'tip_icon', K.gem); tint(t, 'tip_icon', BLUE); text(t, 'tip_name', 'Minerai de Fer'); text(t, 'tip_kind', 'Ressource'); text(t, 'tip_rarity', ''); text(t, 'tip_desc', 'Un minerai commun utilisé pour la forge. On en trouve dans les montagnes d’Ambre.'); text(t, 'tip_quantity', 'Valeur : 25'); });

// 4. settings
place(at('menu'), 'vortex_main_menu_xml', 0, 0, (m) => {
    for(const [k, uri, c] of [['resume', K.play, GREEN], ['character', K.person, 0xb07840], ['settings', K.gear, 0x6a6a72], ['help', K.book, 0xb07840], ['keys', K.keyboard, 0x2a6aa0], ['switch', K.group, 0xd8a030], ['logout', K.x, RED]])
        add(find(m, 'menu_list'), 'vortex_main_menu_row_xml', (r) => { text(r, 'row_label', `\${vortex.settings.menu.${k}}`); icon(r, 'row_icon', uri); tint(r, 'row_icon', c); show(r, 'selected', k === 'resume'); });
});
const CATS = [['audio', K.volume], ['interface', K.monitor], ['graphics', K.monitor], ['notifications', K.bell], ['accessibility', K.access], ['chat', K.chat], ['keys', K.keyboard]];
place(at('settings'), 'vortex_settings_xml', 0, 0, (s) => {
    CATS.forEach(([k, uri]) => add(find(s, 'category_list'), 'vortex_settings_category_row_xml', (r) => { text(r, 'category_name', `\${vortex.settings.cat.${k}}`); icon(r, 'category_icon', uri); show(r, 'selected', k === 'audio'); }));
    place(find(s, 'panel_slot'), 'vortex_settings_panel_audio_xml', 0, 0);
});
const dropdown = (slot, options, selected, checked) => place(at(slot), 'vortex_ui_dropdown_list_xml', 0, 0, (d) => {
    options.forEach((o, i) => add(find(d, 'option_list'), 'vortex_ui_dropdown_option_xml', (r) => { text(r, 'option_txt', o); if(i === selected) { show(r, 'highlight'); tcolor(r, 'option_txt', 0xffffff); } show(r, 'option_check', i === checked); if(i === checked && i === selected) tint(r, 'option_check', 0xffffff); }));
    const h = options.length * 23 + 8; d.height = h; find(d, 'option_list').height = h - 8;
});
dropdown('dd_audio', ['Haut-parleurs (Realtek HD Audio)', 'Casque (Realtek HD Audio)', 'Haut-parleurs (NVIDIA Audio)'], 1, 1);
dropdown('dd_quality', ['Faible', 'Moyenne', 'Élevée', 'Très élevée', 'Ultra'], 2, 2);
dropdown('dd_color', ['Aucun (par défaut)', 'Protanopie (rouge)', 'Deutéranopie (vert)', 'Tritanopie (bleu)'], 1, 0);
const tick = (w, ...names) => names.forEach((n) => { const c = find(w, n); if(c && c.select) c.select(); });
tick(root, 'chk_on', 'chk_locked'); const locked = at('chk_locked'); if(locked && locked.disable) locked.disable();
place(at('p_interface'), 'vortex_settings_panel_interface_xml', 0, 0, (p) => tick(p, 'player_names', 'npc_names', 'combat_text'));
place(at('p_graphics'), 'vortex_settings_panel_graphics_xml', 0, 0, (p) => tick(p, 'vsync'));
place(at('p_access'), 'vortex_settings_panel_accessibility_xml', 0, 0, (p) => tick(p, 'reduce_flash', 'input_assist'));
place(at('p_keys'), 'vortex_settings_panel_keybinds_xml', 0, 0, (p) => {
    for(const [a, k, uri, c] of [['Attaque principale', 'A', K.sword, 0x6a6a72], ['Compétence 1', '1', K.fire, 0xe06020], ['Compétence 2', '2', K.fire, RED], ['Boire une potion', 'R', K.potion, RED], ['Ouvrir l’inventaire', 'I', K.backpack, BROWN],
        ['Ouvrir la carte', 'M', K.map, 0xd8a030], ['Groupe / Social', 'G', K.group, 0x2a6aa0], ['Ouvrir le chat', 'Entrée', K.chat, 0x6a6a72], ['Monter / Descendre', 'X', K.horse, BROWN], ['Cibler l’ennemi suivant', 'TAB', K.target, RED]])
        add(find(p, 'keybind_list'), 'vortex_settings_keybind_row_xml', (r) => { text(r, 'action_txt', a); text(r, 'key_txt', k); icon(r, 'action_icon', uri); tint(r, 'action_icon', c); });
});
place(at('confirm'), 'vortex_ui_confirm_xml', 0, 0, (c) => { c.caption = '${vortex.settings.confirm.title}'; text(c, 'message', '${vortex.settings.confirm.message}'); text(c, 'confirm_button', '${vortex.settings.apply}'); });
