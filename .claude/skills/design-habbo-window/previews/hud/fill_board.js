const at = (name) => find(root, name);
const barOf = (w, name, px, value) => { bar(w, name, px); const v = find(find(w, name), 'value'); if(v) v.caption = value; };
const DARK_MENU = 0x686661, ROW = 0x55534e, ROW_ACTIVE = 0x2a6aa0;

// 1 — player
place(at('player'), 'vortex_hud_player_xml', 0, 0, (w) => {
    text(w, 'player_name', 'Clayton'); text(w, 'level_txt', 'Niv. 32');
    barOf(w, 'hp_bar', 224, '1240 / 1240'); barOf(w, 'mana_bar', 224, '320 / 320'); barOf(w, 'xp_bar', 56, 'XP 12 450 / 48 000 (25%)');
});
const buffs = place(at('buffs'), 'vortex_hud_buffs_xml', 0, 0);
if(buffs) [['rpg/ui-icons/rpg_item_stat_shield_defense_armor_icon', 0xc070e0], ['rpg/ui-icons/boardgames_card_attack_sword_icon', 0xe0e0e0], ['rpg/ui-icons/rpg_gem_jewelcrafting_diamond_points_currency_icon', 0x60c8f8], ['rpg/ui-icons/map_markers_tree_forest_decidous_1_icon', 0x80d060]]
    .forEach(([uri, c], i) => place(buffs, 'vortex_hud_buff_xml', (i % 2) * 36, 34 + Math.floor(i / 2) * 34, (b) => { icon(b, 'buff_icon', uri); tint(b, 'buff_icon', c); }));
const plus = (slotName, pressed) => { const b = place(at(slotName), 'vortex_hud_buffs_xml', 0, 0); if(!b) return; b.height = 30; if(pressed) tint(b, 'buff_add_button', 0x3a3936); };
plus('plus_normal', false); plus('plus_pressed', true);

const menu = (slotName, rows, {light = false} = {}) => {
    const m = place(at(slotName), 'vortex_hud_chat_menu_xml', 0, 0);
    if(!m) return null;
    const height = rows.length * 26 + 10;
    m.height = height; find(m, 'menu_frame').height = height; find(m, 'menu_list').height = height - 12;
    const list = find(m, 'menu_list');
    for(const [label, uri, c, checked] of rows) add(list, 'vortex_hud_chat_menu_row_xml', (row) => { text(row, 'row_label', label); icon(row, 'row_icon', uri); tint(row, 'row_icon', c); show(row, 'row_check', !!checked); if(checked) tint(row, null, ROW_ACTIVE); });
    return m;
};
menu('plus_menu', [['Attributs', 'rpg/ui-icons/rpg_stat_strength_fist_melee_attack_icon', 0xe09a60], ['Compétences', 'rpg/ui-icons/misc_religion_christianity_bible_book_cross_tome_libram_icon', 0xd0a040], ['Inventaire', 'rpg/ui-icons/rpg_loot_bag_money_coins_purse_icon', 0xd8a060], ['Titres', 'rpg/ui-icons/hats_crown_king_monarch_ruler_emperor_icon', 0xf0c030]]);

const tip = (slotName, title, body, uri, c, extra = '') => place(at(slotName), 'vortex_hud_tip_xml', 0, 0, (w) => { text(w, 'tip_title', title); text(w, 'tip_txt', body); icon(w, 'tip_icon', uri); tint(w, 'tip_icon', c); if(extra) { text(w, 'tip_extra', extra); show(w, 'tip_extra', true); } });
tip('tip_hp', 'Points de vie', 'Représente votre santé. Tombe à 0 en cas de défaite.', 'rpg/ui-icons/rpg_stat_hp_health_heart_icon', 0xe03a3a);
tip('tip_mana', 'Mana', 'Ressource utilisée pour lancer des sorts.', 'rpg/ui-icons/rpg_stat_mp_mana_star_icon', 0x3a7fe0);
tip('tip_xp', 'Expérience', 'Gagnez de l’expérience en combattant des monstres et en accomplissant des quêtes.', 'rpg/ui-icons/boardgames_card_star_icon', 0x6cbb2d);
tip('tip_side', 'Équipement', 'Ouvre votre inventaire d’équipement.', 'rpg/ui-icons/rpg_item_stat_shield_defense_armor_icon', 0xc070e0);

// 2 — action bar
const actionSlot = (parent, x, y, {uri = 'rpg/skills/warrior_skill_icon_1', key = '1', empty = false, cooldown = '', unavailable = false, proc = false, selected = false, count = '', dx = 0, dy = 0, pressed = false} = {}) =>
    place(parent, 'vortex_hud_action_slot_xml', x + dx, y + dy, (s) => {
        text(s, 'slot_key', key); show(s, 'slot_icon', !empty); if(!empty) icon(s, 'slot_icon', uri);
        show(s, 'cooldown_veil', cooldown !== ''); show(s, 'cooldown_txt', cooldown !== ''); text(s, 'cooldown_txt', cooldown);
        show(s, 'unavailable_veil', unavailable); show(s, 'proc', proc); show(s, 'selected', selected);
        show(s, 'slot_count', count !== ''); text(s, 'slot_count', count); if(pressed) tint(s, 'slot_box', 0x3a3936);
    });
const barWin = place(at('action_bar'), 'vortex_hud_action_bar_xml', 0, 0);
if(barWin) {
const skills = ['warrior_skill_icon_1', 'warrior_skill_icon_2', 'warrior_skill_icon_3', 'warrior_skill_icon_4', 'warrior_skill_icon_5'];
skills.forEach((n, i) => add(find(barWin, 'skill_slots'), 'vortex_hud_action_slot_xml', (s) => { text(s, 'slot_key', String(i + 1)); icon(s, 'slot_icon', `rpg/skills/${n}`); if(i === 2) show(s, 'selected', true); if(i === 3) { show(s, 'cooldown_veil', true); show(s, 'cooldown_txt', true); text(s, 'cooldown_txt', '2.3s'); } if(i === 4) show(s, 'unavailable_veil', true); }));
add(find(barWin, 'skill_slots'), 'vortex_hud_action_slot_xml', (s) => { text(s, 'slot_key', '6'); show(s, 'slot_icon', false); });
[['icon_00', '7', '25'], ['icon_03', '8', '12'], ['icon_05', '9', '9']].forEach(([n, key, count]) => add(find(barWin, 'item_slots'), 'vortex_hud_action_slot_xml', (s) => { text(s, 'slot_key', key); icon(s, 'slot_icon', `rpg/consumables-potions/${n}`); show(s, 'slot_count', true); text(s, 'slot_count', count); }));
add(find(barWin, 'item_slots'), 'vortex_hud_action_slot_xml', (s) => { text(s, 'slot_key', ''); show(s, 'slot_icon', false); });
[['rpg/ui-icons/map_markers_treasure_map_paper_parchment_icon', 'Q'], ['rpg/ui-icons/map_markers_farmland_animals_icon', 'E'], ['rpg/ui-icons/alchemy_potion_vial_bottle_huge_cube_square_full_icon', 'R']].forEach(([uri, key]) => add(find(barWin, 'shortcut_slots'), 'vortex_hud_action_slot_xml', (s) => { text(s, 'slot_key', key); icon(s, 'slot_icon', uri); }));
}
actionSlot(at('slot_empty'), 0, 0, {empty: true});
actionSlot(at('slot_normal'), 0, 0, {});
actionSlot(at('slot_hover'), 0, 0, {dx: -1, dy: -1});
actionSlot(at('slot_pressed'), 0, 0, {pressed: true});
actionSlot(at('slot_cooldown'), 0, 0, {cooldown: '2.3s'});
actionSlot(at('slot_unavailable'), 0, 0, {unavailable: true});
actionSlot(at('slot_proc'), 0, 0, {proc: true, uri: 'rpg/skills/warrior_skill_icon_4'});
actionSlot(at('slot_selected'), 0, 0, {selected: true, uri: 'rpg/skills/warrior_skill_icon_3'});
actionSlot(at('slot_count'), 0, 0, {uri: 'rpg/consumables-potions/icon_00', key: '7', count: '25'});

place(at('tip_skill'), 'vortex_hud_slot_tip_xml', 0, 0, (w) => {
    text(w, 'tip_title', 'Frappe puissante'); text(w, 'tip_tag_txt', 'Attaque'); text(w, 'tip_meta', 'Rang 1 · Coût : 20 mana · Recharge : 6 secondes');
    text(w, 'tip_txt', 'Inflige 180% des dégâts d’arme à la cible et la fait saigner pendant 6 secondes.');
    text(w, 'tip_effect', 'Saignement : 40 dégâts toutes les 2 s'); text(w, 'tip_shortcut', 'Raccourci : 2');
});
place(at('tip_item'), 'vortex_hud_slot_tip_xml', 0, 0, (w) => {
    text(w, 'tip_title', 'Potion de soins'); text(w, 'tip_tag_txt', 'Soin'); tint(w, 'tip_tag', 0x2f9e2f); text(w, 'tip_meta', 'Quantité : 25');
    icon(w, 'tip_icon', 'rpg/consumables-potions/icon_00'); text(w, 'tip_txt', 'Restaure 500 points de vie instantanément.'); text(w, 'tip_effect', ''); text(w, 'tip_shortcut', 'Raccourci : 7');
});

// 3 — HUD menu
menu('main_menu', [['Accueil', 'rpg/ui-icons/map_markers_building_home_house_icon', 0xf0c030], ['Boutique', 'rpg/ui-icons/software_shopping_cart_icon', 0xe0e0e0], ['Hôtel', 'rpg/ui-icons/map_markers_buildings_houses_homes_village_town_icon', 0x6aa0e0], ['Mobilier', 'rpg/ui-icons/hats_knight_helmet_armor_icon', 0xd04040], ['Quêtes', 'rpg/ui-icons/tools_crafting_writing_parchment_scroll_document_icon', 0xe8d8a8]]);
menu('more_menu', [['Profil', 'rpg/ui-icons/travel_person_people_three_icon', 0x6aa0e0], ['Paramètres', 'rpg/ui-icons/software_options_settings_cogwheel_gear_mechanics_icon', 0xb0b0b8], ['Aide', 'rpg/ui-icons/software_warning_sign_circle_question_mark_help_icon', 0x60c8f8], ['Déconnexion', 'rpg/ui-icons/map_markers_doorway_enterance_exit_open_icon', 0xd04040]]);

// 4 — party
const member = (slotName, {name, level = 'Niv. 32', hp, max, px, dead = false, selected = false, low = false, role = '', dx = 0, dy = 0}) =>
    place(at(slotName), 'vortex_hud_party_member_xml', dx, dy, (w) => {
        text(w, 'member_name', name); text(w, 'member_level', level); barOf(w, 'hp_bar', px, `${hp} / ${max}`);
        show(w, 'dead_veil', dead); show(w, 'dead_txt', dead); show(w, 'selected', selected); show(w, 'low_hp', low);
        show(w, 'role_txt', role !== ''); text(w, 'role_txt', role); show(w, 'buff_list', !dead && role === '');
        if(!dead && role === '') for(const [uri, c] of [['rpg/ui-icons/rpg_item_stat_shield_defense_armor_icon', 0x6aa0e0], ['rpg/ui-icons/boardgames_card_attack_sword_icon', 0xe04848], ['rpg/ui-icons/rpg_stat_hp_health_heart_icon', 0xe03a3a]]) add(find(w, 'buff_list'), 'vortex_hud_buff_xml', (b) => { icon(b, 'buff_icon', uri); tint(b, 'buff_icon', c); b.width = 24; b.height = 24; find(b, 'buff_box').width = 24; find(b, 'buff_box').height = 24; });
    });
member('party_normal', {name: 'Marek', hp: '1650', max: '1650', px: 150});
member('party_hover', {name: 'Marek', hp: '1650', max: '1650', px: 150, dx: -1, dy: -1});
member('party_selected', {name: 'Marek', hp: '1650', max: '1650', px: 150, selected: true});
member('party_low', {name: 'Marek', hp: '320', max: '1650', px: 29, low: true});
member('party_dead', {name: 'Marek', hp: '0', max: '1650', px: 0, dead: true});
member('party_role', {name: 'Marek', hp: '1650', max: '1650', px: 150, role: 'Tank'});
menu('party_menu', [['Inspecter', 'rpg/ui-icons/software_magnifier_zoom_looking_magnifying_glass_icon', 0xffffff], ['Inviter en échange', 'rpg/ui-icons/rpg_trade_handshake_deal_exchange_icon', 0xf0c030], ['Message privé', 'rpg/ui-icons/software_speech_bubble_information_guide_tutorial_icon', 0x60c8f8], ['Marquer', 'rpg/ui-icons/map_markers_flagpole_icon', 0xe04848], ['Exclure du groupe', 'rpg/ui-icons/software_signs_maths_multiplication_x_crossout_checkmark_cancel_icon', 0xff6a5a]]);
place(at('tip_player'), 'vortex_hud_player_tip_xml', 0, 0, (w) => { text(w, 'player_name', 'Sofia'); text(w, 'player_info', 'Niv. 32 · Archère'); text(w, 'player_guild', 'Guilde : Nova'); });

const compact = (slotName, selected) => place(at(slotName), 'vortex_hud_target_compact_xml', 0, 0, (w) => { text(w, 'target_info', 'Niv. 35 · Boss'); barOf(w, 'target_hp_bar', 65, '74%'); show(w, 'selected', selected); tint(w, 'target_frame', 0xc03028); });
compact('target_compact', false); compact('target_compact_selected', true);

const floating = at('floating');
if(floating) [['-184', 0xff5050, 12], ['-512', 0xff3030, 18], ['+236', 0x60e060, 12], ['Bloqué', 0x6ab8f0, 11], ['Esquivé', 0x6a6a68, 11], ['Raté', 0xa0a098, 11]].forEach(([v, c, size], i) => place(floating, 'vortex_combat_number_xml', i * 76, 8, (t) => { t.caption = v; t.textColor = c; t.fontSize = size; }));

// 5 — boss and target
const boss = (slotName, cast) => place(at(slotName), 'vortex_hud_boss_xml', 0, 0, (w) => {
    text(w, 'boss_name', 'Gorzug le Brise-crâne'); text(w, 'boss_level', 'Niv. 35'); barOf(w, 'boss_hp_bar', 284, '38 520 / 52 000 (74%)'); tint(w, 'boss_frame', 0xc03028);
    if(cast) { show(w, 'debuff_list', false); show(w, 'cast_frame', true); show(w, 'cast_bar', true); text(w, 'cast_name', 'Frappe sismique'); const v = find(find(w, 'cast_bar'), 'value'); v.caption = '2.3 / 4.0 s'; }
    else for(const [n, t, c] of [['icon_02', '8s', 0xffffff], ['icon_04', '12s', 0xffffff], ['icon_07', '5s', 0xffffff]]) add(find(w, 'debuff_list'), 'vortex_hud_buff_xml', (b) => { icon(b, 'buff_icon', `rpg/status-effects/${n}`); tint(b, 'buff_icon', c); text(b, 'buff_time', t); });
});
boss('boss_normal', false); boss('boss_cast', true);
tip('tip_debuff', 'Brûlure', 'Perd 2% de ses PV toutes les secondes.', 'rpg/status-effects/icon_04', 0xffffff, 'Durée restante : 12 secondes');
place(at('target'), 'vortex_hud_target_xml', 0, 0, (w) => {
    text(w, 'target_name', 'Gorzug le Brise-crâne'); text(w, 'target_info', 'Niv. 35   Boss'); barOf(w, 'target_hp_bar', 196, '38 520 / 52 000 (74%)'); tint(w, 'target_frame', 0xc03028);
    for(const [n, t] of [['icon_02', '8s'], ['icon_04', '12s'], ['icon_07', '5s']]) add(find(w, 'debuff_list'), 'vortex_hud_buff_xml', (b) => { icon(b, 'buff_icon', `rpg/status-effects/${n}`); text(b, 'buff_time', t); });
    text(w, 'cast_name', 'Frappe sismique'); barOf(w, 'cast_bar', 219, '3.0 / 4.0 s');
});
const buff = (slotName, {uri, time = '', expiring = false, disabled = false}) => place(at(slotName), 'vortex_hud_buff_xml', 0, 0, (b) => { icon(b, 'buff_icon', uri); text(b, 'buff_time', time); show(b, 'expiring', expiring); if(disabled) { tint(b, 'buff_box', 0x3a3936); tint(b, 'buff_icon', 0x808080); } });
buff('buff_a', {uri: 'rpg/status-effects/icon_00'}); buff('buff_b', {uri: 'rpg/status-effects/icon_01', time: '30s'}); buff('buff_c', {uri: 'rpg/status-effects/icon_03', time: '3'}); buff('buff_d', {uri: 'rpg/status-effects/icon_04', time: '2s', expiring: true}); buff('buff_e', {uri: 'rpg/status-effects/icon_05', disabled: true});
place(at('alert'), 'vortex_hud_alert_xml', 0, 0, (w) => text(w, 'alert_txt', 'Frappe sismique dans 3 seconde(s) !'));

const chat = place(at('chat'), 'vortex_hud_chat_xml', 0, 0);
if(chat) {
chat.height = 150; find(chat, 'chat').height = 150; find(chat, 'chat_log_well').height = 68; find(chat, 'chat_log').height = 56;
for(const n of ['chat_mode_button', 'emoji_button']) find(chat, n).y = 112;
const inputBox = find(chat, 'chat_input').parent; inputBox.y = 112;
['Général', 'Groupe', 'Guilde'].forEach((l, i) => add(find(chat, 'tab_bar'), 'vortex_hud_chat_tab_xml', (t) => { text(t, 'tab_label', l); tint(t, null, i === 0 ? ROW_ACTIVE : ROW); }));
find(chat, 'add_tab_button').x = 8 + 3 * 88;
[['[14:42]', '[Groupe]', 'Léa', ': je heal !', 0x60e060], ['[14:42]', '[Groupe]', 'Marek', ': focus le boss !', 0x60e060], ['[14:42]', '[Général]', 'Clayton', ': attention à la frappe !', 0xf0a030]].forEach(([t, ch, a, m, c]) => add(find(chat, 'chat_log'), 'vortex_hud_chat_line_xml', (l) => { text(l, 'time_txt', t); text(l, 'channel_txt', ch); tcolor(l, 'channel_txt', c); text(l, 'author_txt', a); tcolor(l, 'author_txt', c); text(l, 'message_txt', m); }));
}
menu('chat_menu', [['Général', 'rpg/ui-icons/software_speech_bubble_three_dots_dialogue_icon', 0xf0a030, true], ['Groupe', 'rpg/ui-icons/travel_person_people_three_icon', 0x60e060], ['Guilde', 'rpg/ui-icons/map_markers_banner_heraldry_icon', 0x6aa0e0], ['Système', 'rpg/ui-icons/software_warning_sign_circle_information_help_icon', 0xd080e0], ['Combat', 'rpg/ui-icons/boardgames_card_attack_sword_icon', 0xff6a5a]]);
