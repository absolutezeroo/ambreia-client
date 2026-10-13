// Fills the "États – Zones et butin" board (states_zone.xml).
const at = (name) => find(root, name);
const I = {
    dove: 'rpg/ui-icons/misc_peace_treaty_white_dove_bird_icon', swords: 'rpg/ui-icons/rpg_crossed_swords_duel_pvp_combat_battle_war_icon', door: 'rpg/ui-icons/map_markers_doorway_enterance_exit_open_icon',
    warn: 'rpg/ui-icons/software_warning_sign_triangle_exclaimation_mark_error_icon', check: 'rpg/ui-icons/software_signs_checkmark_checkbox_ticked_todo_icon', star: 'rpg/ui-icons/boardgames_card_star_icon',
    group: 'rpg/ui-icons/travel_person_people_three_icon', skull: 'rpg/ui-icons/rpg_skull_death_dead_small_icon', forbid: 'rpg/ui-icons/software_sign_crossout_cancel_forbidden_illegal_1_icon', x: 'rpg/ui-icons/software_signs_maths_multiplication_x_crossout_checkmark_cancel_icon',
    sword: 'rpg/ui-icons/rpg_item_weapon_sword_attack_melee_slashing_damage_icon', speed: 'rpg/ui-icons/rpg_skill_dash_dodge_movement_speed_run_sprint_icon', fist: 'rpg/ui-icons/rpg_stat_strength_fist_melee_attack_icon', crit: 'rpg/ui-icons/rpg_skill_killshot_bow_ranged_attack_skull_icon',
};
const ZONES = {
    safe: {tint: 0x2f7a2f, icon: I.dove, titleColor: 0x6cdc5a, statusTint: 0x2f7a2f, statusIcon: I.check},
    pvp: {tint: 0x8a2a2a, icon: I.swords, titleColor: 0xff6a6a, statusTint: 0xb02818, statusIcon: I.warn},
    dungeon: {tint: 0x5a3a8a, icon: I.door, titleColor: 0xd8a0ff, statusTint: 0x6a4c9c, statusIcon: I.warn},
    danger: {tint: 0x8a6a1a, icon: I.warn, titleColor: 0xffd040, statusTint: 0xb02818, statusIcon: I.skull},
};
const zone = (slotName, kind, {title, desc, status, info = [], level = null, danger = null, buttons = null, height}) => place(at(slotName), 'vortex_zone_popup_xml', 0, 0, (z) => {
    const k = ZONES[kind];
    tint(z, 'zone_frame', k.tint); icon(z, 'zone_icon', k.icon); text(z, 'zone_title', title); tcolor(z, 'zone_title', k.titleColor); text(z, 'zone_desc', desc);
    tint(z, 'status_box', k.statusTint); icon(z, 'status_icon', k.statusIcon); text(z, 'status_txt', status); show(z, 'status_box', !!status);
    const list = find(z, 'info_list'); show(z, 'info_list', info.length > 0);
    for(const [t, uri, c] of info) add(list, 'vortex_zone_info_row_xml', (r) => { text(r, 'info_txt', t); icon(r, 'info_icon', uri); tint(r, 'info_icon', c); });
    if(info.length) list.height = info.length * 20;
    if(level) { show(z, 'level_box', true); text(z, 'advised_txt', level.advised); text(z, 'own_level_txt', level.own); bar(z, 'level_bar', level.px); }
    if(danger) { show(z, 'danger_box', true); text(z, 'danger_title', danger.title); text(z, 'danger_txt', danger.txt); }
    if(buttons) { show(z, 'buttons', true); text(z, 'primary_button', buttons[0]); text(z, 'secondary_button', buttons[1]); if(buttons[2]) tint(z, 'primary_button', buttons[2]); }
    z.height = height; find(z, 'zone_frame').height = height;
});
zone('zone_safe', 'safe', {title: 'Zone sûre', desc: 'Vous entrez dans une zone sûre. Combat désactivé • Aucun JcJ. Régénération légère de vos PV et PM.', status: 'Vous êtes en sécurité ici.', height: 120});
zone('zone_pvp', 'pvp', {title: 'Zone JcJ', desc: 'Vous entrez dans une zone JcJ. Les combats entre joueurs sont autorisés à tout moment.', status: 'Soyez prudent, d’autres joueurs peuvent vous attaquer !', buttons: ['Continuer', 'Retour'], height: 160});
zone('zone_dungeon', 'dungeon', {title: 'Entrée du donjon', desc: 'Donjon d’Ambre', status: 'Préparez-vous avant d’entrer !', height: 230,
    info: [['Niveau conseillé : 35', I.star, 0xffd040], ['Taille de groupe : 3 - 5 joueurs', I.group, 0x8ac8ff], ['Difficulté : Normale', I.skull, 0xff8a6a], ['Impossible de monter à cheval à l’intérieur du donjon.', I.forbid, 0xff6a6a]],
    buttons: ['Entrer dans le donjon', 'Annuler', 0x6a4c9c]});
zone('zone_danger', 'danger', {title: 'Attention', desc: 'Le niveau conseillé pour cette zone est supérieur à votre niveau.', status: '', height: 230,
    level: {advised: 'Niveau conseillé : 40', own: 'Votre niveau : 32', px: 203}, danger: {title: 'DANGER', txt: 'Les ennemis seront plus puissants et pourront vous vaincre facilement.'}, buttons: ['Entrer quand même', 'Annuler']});

const toast = (slotName, kind, title, txt, {count = '', timer = '', px = 0} = {}) => place(at(slotName), 'vortex_hud_toast_xml', 0, 0, (t) => {
    const k = ZONES[kind]; tint(t, 'toast_frame', k.tint); icon(t, 'toast_icon', k.icon); tint(t, 'toast_icon', 0xffffff); text(t, 'toast_title', title); tcolor(t, 'toast_title', k.titleColor); text(t, 'toast_txt', txt);
    icon(t, 'toast_mark', I.x); tint(t, 'toast_mark', 0xffffff);
    if(timer) { show(t, 'toast_bar', true); bar(t, 'toast_bar', px); show(t, 'toast_timer', true); text(t, 'toast_timer', timer); show(t, 'toast_mark', false); }
});
toast('toast_safe', 'safe', 'Zone sûre', 'Combat désactivé • Aucun JcJ');
toast('toast_count', 'safe', 'Zone sûre', 'Combat désactivé • Aucun JcJ', {timer: '5s', px: 160});
toast('toast_pvp', 'pvp', 'Zone JcJ', 'Les combats entre joueurs sont autorisés.');
toast('toast_dungeon', 'dungeon', 'Donjon d’Ambre', 'Niv. conseillé : 35 • 3-5 joueurs');
toast('toast_danger', 'danger', 'Niv. conseillé : 40 • Votre niv. : 32', 'Zone dangereuse !');
place(at('tip_pvp'), 'vortex_hud_tip_xml', 0, 0, (w) => { text(w, 'tip_title', 'Zone JcJ'); text(w, 'tip_txt', 'Dans cette zone, tous les joueurs peuvent s’attaquer librement. La mort peut entraîner une perte d’objets.'); icon(w, 'tip_icon', I.swords); tint(w, 'tip_icon', 0xff6a6a); });

// 2. loot
const LOOT = [['rpg/weapons/icon_05', '', {selected: true, rarity: 0xc080ff}], ['rpg/armor/icon_10', ''], ['rpg/gems-materials/icon_00', '8'], ['rpg/materials/icon_04', '2'], ['rpg/plants-crops/icon_02', '4'], ['rpg/consumables-potions/icon_00', '3'], ['rpg/consumables-potions/icon_01', '2'], ['rpg/materials/icon_03', '1'], ['rpg/ui-icons/rpg_coin_gold_currency_money_gp_icon', '120', {tint: 0xf0c030}], ['rpg/materials/icon_00', '6'], ['rpg/fish-loot/icon_00', '1'], ['rpg/plants-crops/icon_05', '3']];
place(at('loot'), 'vortex_loot_xml', 0, 0, (l) => {
    const grid = find(l, 'loot_grid');
    for(const [uri, count, {selected = false, rarity = 0, tint: c = 0} = {}] of LOOT) add(grid, 'vortex_inventory_item_slot_xml', (s) => { icon(s, 'item_icon', uri); if(c) tint(s, 'item_icon', c); text(s, 'item_count', count); show(s, 'selected', selected); if(rarity) { show(s, 'rarity', true); tint(s, 'rarity', rarity); } });
    for(let i = 0; i < 4; i++) add(grid, 'vortex_inventory_item_slot_xml', (s) => text(s, 'item_count', ''));
    text(l, 'gold_txt', '120 pièces d’or');
    icon(l, 'detail_icon', 'rpg/weapons/icon_05'); text(l, 'item_name', 'Lame d’Ambre'); text(l, 'item_rarity', 'Épique'); text(l, 'item_level', 'Niv. 28 requis');
    const st = find(l, 'stat_list');
    for(const [a, b, uri] of [['Dégâts', '85 - 110', I.sword], ['Vitesse d’attaque', '+8%', I.speed], ['Force', '+12', I.fist], ['Coup critique', '+6%', I.crit]]) add(st, 'vortex_inventory_compare_row_xml', (r) => { text(r, 'stat_name', a); text(r, 'stat_value', b); text(r, 'stat_delta', ''); icon(r, 'stat_icon', uri); const n = find(r, 'stat_name'); n.width = 120; const v = find(r, 'stat_value'); v.x = 140; v.width = 100; r.width = 252; });
    text(l, 'item_desc', 'Une lame imprégnée de l’énergie d’Ambre, retrouvée dans les ruines oubliées de la ville.'); text(l, 'item_type', 'Type : Épée à une main'); text(l, 'item_slot_txt', 'Emplacement : Arme');
});
place(at('loot_group'), 'vortex_loot_group_xml', 0, 0, (g) => { icon(g, 'item_icon', 'rpg/weapons/icon_05'); text(g, 'item_name', 'Lame d’Ambre'); bar(g, 'roll_bar', 120); text(g, 'roll_timer', '16 s'); });
const lootToast = (slotName, uri, title, rarity, c, count) => place(at(slotName), 'vortex_hud_toast_xml', 0, 0, (t) => { icon(t, 'toast_icon', uri); tint(t, 'toast_icon', 0xffffff); text(t, 'toast_title', 'Vous avez obtenu'); text(t, 'toast_txt', `${title} (${rarity})`); tcolor(t, 'toast_txt', c); show(t, 'toast_mark', false); if(count) { show(t, 'toast_count', true); text(t, 'toast_count', count); } tint(t, 'toast_frame', 0x4a4068); });
lootToast('loot_toast_1', 'rpg/weapons/icon_05', 'Lame d’Ambre', 'Épique', 0xd8a0ff, '');
lootToast('loot_toast_2', 'rpg/materials/icon_00', 'Bois d’Ambre', 'Commun', 0xe8e4f0, 'x 6');
place(at('loot_settings'), 'vortex_loot_settings_xml', 0, 0, (s) => { for(const n of ['auto_standard', 'rule_free']) { const c = find(s, n); if(c && 'isSelected' in c) c.isSelected = true; } });
place(at('loot_tip'), 'vortex_inventory_tip_xml', 0, 0, (t) => { t.width = 250; find(t, 'tip_frame').width = 250; icon(t, 'tip_icon', 'rpg/materials/icon_00'); text(t, 'tip_name', 'Bois d’Ambre'); text(t, 'tip_kind', 'Commun'); text(t, 'tip_rarity', ''); text(t, 'tip_desc', 'Un bois solide issu des forêts d’Ambre. Très utilisé pour l’artisanat.'); text(t, 'tip_quantity', 'Objet de quête'); for(const n of ['tip_name', 'tip_desc', 'tip_quantity']) find(t, n).width = 234 - (n === 'tip_name' ? 58 : 0); });
