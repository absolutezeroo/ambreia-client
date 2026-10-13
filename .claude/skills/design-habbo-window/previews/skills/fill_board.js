// @include fill_common.js
// Fills the "États – Compétences" board (states_skills.xml) with every state of the four skill sheets.
const at = (name) => find(root, name);
const FA = SK('warrior', 1);

// 1. tiles and cards
const tile = (slotName, o) => place(at(slotName), 'vortex_skill_slot_xml', 0, 0, (t) => {
    icon(t, 'skill_icon', o.uri ?? FA); text(t, 'skill_level', o.level ?? 'Niv. 3'); show(t, 'selected', !!o.selected); show(t, 'lock_icon', !!o.locked); show(t, 'upgrade_badge', !!o.upgradable);
    if(o.locked || o.unavailable) tint(t, 'skill_icon', 0x8080a0);
    if(o.hover) { t.x -= 1; t.y -= 1; }
});
tile('tile_normal', {}); tile('tile_hover', {hover: true}); tile('tile_selected', {selected: true}); tile('tile_upgradable', {upgradable: true}); tile('tile_locked', {locked: true, level: 'Niv. 40'}); tile('tile_unavailable', {unavailable: true});
const card = (slotName, o) => place(at(slotName), 'vortex_skill_card_xml', o.hover ? -1 : 0, o.hover ? -1 : 0, (c) => {
    text(c, 'skill_name', o.name ?? 'Coup critique'); text(c, 'skill_level', o.level ?? 'Niv. 5 / 10'); icon(c, 'skill_icon', o.uri ?? SK('warrior', 8)); show(c, 'selected', !!o.selected);
    if(o.max) tcolor(c, 'skill_level', 0xb07a10);
    if(o.locked) { tint(c, 'skill_icon', 0x8080a0); tcolor(c, 'skill_name', 0x8a94a0); }
});
card('card_normal', {}); card('card_hover', {hover: true}); card('card_selected', {selected: true}); card('card_max', {level: 'Niv. 10 / 10', max: true}); card('card_locked', {name: 'Compétence verrouillée', level: 'Niv. 0 / 10', locked: true, uri: I.lock});

// 2. nodes and action slots
const node = (slotName, o) => place(at(slotName), 'vortex_skill_node_xml', 0, 0, (n) => {
    icon(n, 'node_icon', o.uri ?? SK('warrior', 2)); text(n, 'node_count', o.count ?? '0/5'); show(n, 'selected', !!o.selected); show(n, 'lock_icon', !!o.locked);
    if(o.locked) show(n, 'node_icon', false); else if(o.dim) tint(n, 'node_icon', 0x9090a8);
    if(o.dim || o.locked) tcolor(n, 'node_count', 0x666666);
    if(o.gold) { tcolor(n, 'node_count', 0xb07a10); tint(n, 'node_box', 0xffd890); }
    if(o.hover) { const b = find(n, 'node_box'); b.x -= 1; b.y -= 1; }
});
node('node_normal', {dim: true}); node('node_hover', {dim: true, hover: true}); node('node_selected', {selected: true, count: '3/5'}); node('node_unlocked', {count: '2/5'}); node('node_available', {count: '0/3', uri: SK('psionicist', 8)}); node('node_locked', {locked: true, count: '0/1'}); node('node_unavailable', {dim: true, uri: SK('rogue', 3)}); node('node_complete', {count: '5/5', gold: true});
const aslot = (slotName, o) => place(at(slotName), 'vortex_skill_action_slot_xml', 0, 0, (s) => {
    text(s, 'slot_key', o.key ?? '2'); show(s, 'selected', !!o.selected); show(s, 'lock_icon', !!o.locked);
    if(o.empty) show(s, 'slot_icon', false); else icon(s, 'slot_icon', o.uri ?? FA);
    if(o.count) { text(s, 'slot_count', o.count); show(s, 'slot_count', true); }
    if(o.cooldown) { text(s, 'cooldown_txt', o.cooldown); show(s, 'cooldown_txt', true); tint(s, 'slot_icon', 0x8080a0); }
    if(o.locked) tint(s, 'slot_icon', 0x8080a0);
    if(o.hover) { const b = find(s, 'slot_box'); b.x -= 1; b.y -= 1; }
});
aslot('slot_empty', {empty: true, key: '+'}); aslot('slot_normal', {}); aslot('slot_hover', {hover: true}); aslot('slot_selected', {selected: true}); aslot('slot_cooldown', {cooldown: '0/3', uri: SK('psionicist', 8)}); aslot('slot_locked', {locked: true}); aslot('slot_item', {uri: I.potion, count: '25', key: '5'});

// 3. menu, tooltips, banner (the buttons are the board's own)

place(at('menu_types'), 'vortex_ui_menu_xml', 0, 0, (m) => {
    const rows = [['Toutes', null, 0, true], ['Attaque', I.sword, 0xd23a2a], ['Défense', 'rpg/ui-icons/rpg_difficulty_3_medium_buckler_targe_shield_icon', 0x4090e0], ['Soutien', 'rpg/ui-icons/rpg_stat_hp_health_heart_icon', 0x40b030], ['Mobilité', 'rpg/ui-icons/rpg_stat_dexterity_agility_boots_movement_speed_icon', 0x6cbb2d], ['Élémentaire', I.fire, 0xe06020], ['Nature', 'rpg/ui-icons/rpg_stat_pet_paw_animal_handling_tame_beast_mastery_icon', 0x40b030]];
    const height = rows.length * 25 + 12; m.height = height; find(m, 'menu_frame').height = height; find(m, 'menu_list').height = height - 12;
    for(const [l, uri, c, checked] of rows) add(find(m, 'menu_list'), 'vortex_ui_menu_row_xml', (r) => { text(r, 'row_label', l); if(uri) { icon(r, 'row_icon', uri); tint(r, 'row_icon', c); } else show(r, 'row_icon', false); show(r, 'row_check', !!checked); if(checked) tint(r, null, 0xffd890); });
});
place(at('tip_skill'), 'vortex_skill_tip_xml', 0, 0, (t) => {
    icon(t, 'tip_icon', FA); text(t, 'tip_name', 'Frappe ardente'); text(t, 'tip_level', 'Niveau 3 / 10'); text(t, 'tip_desc', 'Une attaque puissante qui inflige des dégâts de feu à un ennemi et peut appliquer Brûlure.');
    const l = find(t, 'tip_list');
    for(const [a, b, uri, c] of [['Coût en mana', '25', I.mana, 0x4090e0], ['Temps de recharge', '6 secondes', I.clock, 0x6a6a72], ['Portée', '1 case', I.range, 0x6a6a72], ['Dégâts', '120 (+20 par niveau)', I.sword, 0x6a6a72]])
        add(l, 'vortex_inventory_compare_row_xml', (r) => { text(r, 'stat_name', a); text(r, 'stat_value', ''); text(r, 'stat_delta', ''); icon(r, 'stat_icon', uri); tint(r, 'stat_icon', c); const v = find(r, 'stat_name'); v.width = 260; v.caption = `${a} : ${b}`; });
});
const tip = (slotName, title, body, uri, c) => place(at(slotName), 'vortex_hud_tip_xml', 0, 0, (w) => { text(w, 'tip_title', title); text(w, 'tip_txt', body); icon(w, 'tip_icon', uri); tint(w, 'tip_icon', c); });
tip('tip_next', 'Niveau suivant', '+ 6 % de chances de coup critique. Coût : 1 500 or, 10 gemmes.', I.up, 0x40b030);
tip('tip_item', 'Potion de soins', 'Restaure 250 points de vie. Clic droit pour plus d’options.', I.potion, 0xffffff);
place(at('banner'), 'vortex_skill_info_banner_xml', 0, 0);
