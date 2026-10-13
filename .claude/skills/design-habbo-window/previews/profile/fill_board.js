// Fills the "États – Profil et interactions" board (states_profile.xml).
const at = (name) => find(root, name);
const U = 'rpg/ui-icons/';
const K = {
    chat: U + 'software_speech_bubble_three_dots_dialogue_icon', group: U + 'travel_person_people_three_icon', friend: U + 'travel_person_people_two_icon', trade: U + 'rpg_trade_handshake_deal_exchange_icon',
    duel: U + 'rpg_crossed_swords_duel_pvp_combat_battle_war_icon', search: U + 'software_magnifier_zoom_looking_magnifying_glass_icon', report: U + 'software_warning_sign_triangle_exclaimation_mark_error_icon', ban: U + 'software_sign_crossout_cancel_forbidden_illegal_1_icon',
    horse: U + 'travel_horse_riding_icon', paw: U + 'rpg_stat_pet_paw_animal_handling_tame_beast_mastery_icon', shield: U + 'rpg_difficulty_4_hard_knightly_kite_heater_shield_icon', trophy: U + 'sports_winner_award_cup_achievement_trophy_icon', swords: U + 'rpg_crossed_swords_duel_pvp_combat_battle_war_icon',
    heart: U + 'cosmetics_lips_lipstick_kiss_heart_icon', mana: U + 'alchemy_potion_vial_bottle_star_mana_full_icon', sword: U + 'rpg_item_weapon_sword_attack_melee_slashing_damage_icon', def: U + 'boardgames_card_defense_shield_icon',
    str: U + 'rpg_stat_strength_fist_melee_attack_icon', agi: U + 'boardgames_card_draw_hand_icon', star: U + 'boardgames_card_star_icon', potion: U + 'alchemy_potion_vial_bottle_heart_health_life_full_icon',
    pilgrim: U + 'rpg_difficulty_3_medium_buckler_targe_shield_icon', mage: U + 'rpg_spell_skill_magic_fireball_flame_bolt_icon', warrior: U + 'rpg_item_weapon_sword_attack_melee_slashing_damage_icon',
};
const ident = (w, name, level, cls, clsIcon, clsColor, guild, title) => { text(w, 'player_name', name); text(w, 'level_txt', `Niveau ${level}`); text(w, 'class_txt', cls); icon(w, 'class_icon', clsIcon); tint(w, 'class_icon', clsColor); text(w, 'guild_txt', `< ${guild} >`); text(w, 'title_txt', title); };
const stats = (l, rows) => rows.forEach(([lab, v, uri, c]) => add(l, 'vortex_companion_stat_row_xml', (x) => { text(x, 'stat_label', lab); text(x, 'stat_value', v); icon(x, 'stat_icon', uri); tint(x, 'stat_icon', c); x.width = 166; find(x, 'stat_value').x = 86; find(x, 'stat_value').width = 76; }));

// 1. profile, inspection, card
place(at('profile'), 'vortex_profile_xml', 0, 0, (p) => {
    ident(p, 'Kael', 32, 'Pèlerin', K.pilgrim, 0xd8a030, 'Les Voyageurs', 'Explorateur d’Ambreia');
    icon(p, 'mount_icon', K.horse); tint(p, 'mount_icon', 0xb07840); icon(p, 'pet_icon', K.paw); tint(p, 'pet_icon', 0xe08030);
    for(const [uri, c] of [[K.shield, 0xd8a030], [K.trophy, 0xf0c030], [K.swords, 0x6a6a72]]) add(find(p, 'achievement_list'), 'vortex_profile_badge_xml', (b) => { icon(b, 'badge_icon', uri); tint(b, 'badge_icon', c); });
    tab(p, 'tab_general');
    place(find(p, 'tab_content'), 'vortex_profile_tab_general_xml', 0, 0, (t) => {
        stats(find(t, 'left_list'), [['Points de vie', '2 845', K.heart, 0xd04040], ['Points de mana', '860', K.mana, 0x4080d0], ['Attaque', '312', K.sword, 0x8a94a0], ['Défense', '248', K.def, 0x6090c0]]);
        stats(find(t, 'right_list'), [['Force', '62', K.str, 0xe09a60], ['Agilité', '48', K.agi, 0x60a040], ['Intelligence', '120', K.mana, 0x60a0e0], ['Endurance', '88', K.heart, 0xd04040], ['Esprit', '95', K.star, 0x8a3ad0]]);
    });
});
place(at('inspect'), 'vortex_profile_inspect_xml', 0, 0, (w) => {
    ident(w, 'Léa', 45, 'Mage', K.mage, 0x4a90e0, 'Arc-en-Ciel', 'Maîtresse des arcanes');
    place(find(w, 'character_sheet_slot'), 'vortex_character_sheet_xml', 0, 0, (s) => { show(s, 'summary_title', false); show(s, 'summary', false); });
    text(w, 'active_title', 'Maîtresse des arcanes'); text(w, 'points_txt', '320 points de succès'); text(w, 'rank_txt', 'Rang 12 du serveur');
    place(find(w, 'tip_slot'), 'vortex_character_equipment_tip_xml', 0, 0, (t) => {
        text(t, 'item_name', 'Baguette stellaire'); text(t, 'item_slot', 'Bâton · Niveau requis : 40'); text(t, 'item_rarity', 'Épique'); text(t, 'item_desc', 'Une baguette imprégnée des échos des étoiles.');
        find(t, 'bonus_list').height = 56; t.height = 158; find(t, 'tip_frame').height = 158; find(t, 'tip_list').height = 146;
        for(const line of ['Dégâts magiques : 78 - 104', '+42 Intelligence', '+18 Esprit', '+10 % chances de critique']) add(find(t, 'bonus_list'), 'vortex_character_tip_line_xml', (l) => { l.caption = line; });
    });
});
place(at('card'), 'vortex_social_profile_card_xml', 0, 0, (c) => {
    c.caption = 'Carte sociale'; text(c, 'player_name', 'Thoran'); text(c, 'player_level', 'Niv. 28 · Guerrier'); text(c, 'presence_txt', 'En ligne'); text(c, 'location_txt', 'À la Forge d’Ambreia (Cité d’Ambre)');
    text(c, 'last_seen', 'En ligne'); text(c, 'member_since', '12/03/2024'); text(c, 'same_guild', 'Gardiens d’Ambreia'); text(c, 'same_group', 'Non');
    text(c, 'bio_txt', 'Forgeron le jour, rempart la nuit. Toujours partant pour un donjon.');
    for(const [t, uri, col] of [['Inspecter l’équipement', K.search, 0x2a6aa0], ['Bloquer ce joueur', K.ban, 0xd23a2a]]) add(find(c, 'option_list'), 'vortex_social_option_row_xml', (o) => { text(o, 'option_txt', t); icon(o, 'option_icon', uri); tint(o, 'option_icon', col); });
});
place(at('locked_1'), 'vortex_profile_locked_row_xml', 0, 0, (r) => { text(r, 'action_txt', 'Inviter au groupe'); text(r, 'reason_txt', 'Joueur hors ligne'); });
place(at('locked_2'), 'vortex_profile_locked_row_xml', 0, 0, (r) => { text(r, 'action_txt', 'Duel'); text(r, 'reason_txt', 'Niveau insuffisant'); });
place(at('confirm'), 'vortex_ui_confirm_xml', 0, 0, (c) => { c.caption = 'Bloquer Kael'; text(c, 'message', '${vortex.profile.block_confirm}'); });
place(at('menu'), 'vortex_ui_menu_xml', 0, 0, (m) => {
    const rows = [['whisper', K.chat, 0x2a8fd6], ['invite', K.group, 0x2a8fd6], ['friend', K.friend, 0x40b030], ['trade', K.trade, 0xd8a030], ['duel', K.duel, 0x6a6a72], ['inspect', K.search, 0x2a6aa0], ['report', K.report, 0xd23a2a], ['block', K.ban, 0xd23a2a]];
    const h = rows.length * 25 + 12; m.height = h; find(m, 'menu_frame').height = h; find(m, 'menu_list').height = h - 12;
    for(const [k, uri, c] of rows) add(find(m, 'menu_list'), 'vortex_ui_menu_row_xml', (r) => { text(r, 'row_label', `\${vortex.profile.menu.${k}}`); icon(r, 'row_icon', uri); tint(r, 'row_icon', c); if(k === 'trade') { tint(r, null, 0xffd890); } });
});

// 2. search, whisper, tooltip
place(at('search'), 'vortex_profile_search_xml', 0, 0, (s) => {
    tab(s, 'tab_search');
    for(const [n, l, cls, uri, c, g] of [['Kael', 32, 'Pèlerin', K.pilgrim, 0xd8a030, 'Les Voyageurs'], ['Léa', 45, 'Mage', K.mage, 0x4a90e0, 'Arc-en-Ciel'], ['Thoran', 28, 'Guerrier', K.warrior, 0x8a94a0, 'Gardiens d’Ambreia']])
        add(find(s, 'result_list'), 'vortex_profile_result_row_xml', (r) => { text(r, 'player_name', n); text(r, 'level_txt', `Niveau ${l}`); text(r, 'class_txt', cls); icon(r, 'class_icon', uri); tint(r, 'class_icon', c); text(r, 'guild_txt', `< ${g} >`); });
});
place(at('whisper'), 'vortex_profile_whisper_xml', 0, 0, (w) => {
    w.caption = 'Chuchoter'; text(w, 'player_name', 'Kael');
    for(const [t, a, m] of [['16:24', 'Kael', 'Salut !'], ['16:25', 'Vous', 'Hello, ça va ?'], ['16:26', 'Kael', 'Oui super ! Tu veux faire un donjon plus tard ?'], ['16:27', 'Vous', 'Avec plaisir !']])
        add(find(w, 'line_list'), 'vortex_profile_whisper_line_xml', (l) => { text(l, 'time_txt', `[${t}]`); text(l, 'author_txt', a); tcolor(l, 'author_txt', a === 'Vous' ? 0x2a6aa0 : 0x8a3ad0); text(l, 'message_txt', m); if(m.length > 30) { l.height = 30; find(l, 'message_txt').height = 30; } });
});
place(at('tip'), 'vortex_inventory_tip_xml', 0, 0, (t) => { icon(t, 'tip_icon', K.potion); tint(t, 'tip_icon', 0xd23a2a); text(t, 'tip_name', 'Potion de vie majeure'); text(t, 'tip_kind', 'Consommable'); text(t, 'tip_rarity', 'Niveau requis : 20'); text(t, 'tip_desc', 'Rend 1 000 points de vie.'); text(t, 'tip_quantity', 'Clic droit pour utiliser.'); });
