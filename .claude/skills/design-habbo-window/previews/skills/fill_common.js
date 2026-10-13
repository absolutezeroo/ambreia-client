// Shared sample data and helpers for the skills previews (prepended to each fill script by compose's --extra? no:
// compose runs one file, so each fill script starts with `// @include fill_common.js` handled by run.mjs).
const SK = (cls, n) => `rpg/skills/${cls}_skill_icon_${n}`;
const I = {
    mana: 'rpg/ui-icons/rpg_gem_jewelcrafting_diamond_points_currency_icon', clock: 'rpg/ui-icons/software_clock_time_wait_1_icon',
    range: 'rpg/ui-icons/media_eyeball_vision_shown_icon', fire: 'rpg/ui-icons/weather_wildfire_flame_element_hot_burn_icon', sword: 'rpg/ui-icons/rpg_item_weapon_sword_attack_melee_slashing_damage_icon',
    up: 'rpg/ui-icons/arrows_up_north_icon', check: 'rpg/ui-icons/software_signs_checkmark_checkbox_ticked_todo_icon', coin: 'rpg/ui-icons/rpg_coin_gold_currency_money_gp_icon',
    star: 'rpg/ui-icons/rpg_magic_sparkles_enchantment_icon', lock: 'rpg/ui-icons/tools_crafting_padlock_locked_icon', potion: 'rpg/consumables-potions/icon_00', potion2: 'rpg/consumables-potions/icon_01',
};
const ACTIVES = [
    ['Frappe ardente', SK('warrior', 1), 'Niv. 3'], ['Éclair', SK('psionicist', 2), 'Niv. 2'], ['Soins', SK('psionicist', 3), 'Niv. 1'], ['Familier de terre', SK('rogue', 4), 'Niv. 1'],
    ['Bouclier', SK('warrior', 5), 'Niv. 1'], ['Tourbillon', SK('warrior', 6), 'Niv. 1'], ['Invisibilité', SK('rogue', 7), 'Niv. 1'], ['Trou noir', SK('psionicist', 8), 'Niv. 1'],
    ['Pluie de flèches', SK('rogue', 9), 'Niv. 1'], ['Nova glaciale', SK('psionicist', 10), 'Niv. 1'], ['Nature vivifiante', SK('rogue', 1), 'Niv. 1'], ['Mur de feu', SK('warrior', 2), 'Niv. 1'],
    ['Charge', SK('warrior', 3), 'Niv. 1'], ['Cristal', SK('psionicist', 4), 'Niv. 1'], ['Ombre', SK('rogue', 5), 'Niv. 1'], ['Verrouillée', SK('warrior', 7), 'Niv. 40'],
];
const PASSIVES = [
    ['Coup critique', SK('warrior', 8), 'Niv. 5 / 10'], ['Régénération de mana', SK('psionicist', 5), 'Niv. 3 / 10'], ['Maîtrise d’armure', SK('warrior', 5), 'Niv. 4 / 10'], ['Vitesse de déplacement', SK('rogue', 2), 'Niv. 2 / 10'],
    ['Vol de vie', SK('rogue', 8), 'Niv. 1 / 10'], ['Affinité de feu', SK('warrior', 2), 'Niv. 3 / 10'], ['Affinité de glace', SK('psionicist', 10), 'Niv. 1 / 10'], ['Affinité de foudre', SK('psionicist', 2), 'Niv. 2 / 10'],
    ['Affinité de nature', SK('rogue', 1), 'Niv. 1 / 10'], ['Affinité des ténèbres', SK('psionicist', 8), 'Niv. 1 / 10'], ['Réduction de recharge', SK('psionicist', 6), 'Niv. 2 / 10'], ['Pilleur', SK('rogue', 10), 'Niv. 1 / 10'],
];
// The header layout is 440 wide; the view sizes it to its slot (452 / 394 / 296), so does the preview.
const fitHeader = (h, w) => { h.width = w; const p = find(h, 'skill_progress'); p.width = w - 70; find(p, 'bg').width = w - 70; find(p, 'points').width = w - 70; find(h, 'skill_desc').width = w; find(h, 'skill_name').width = w - 160; find(h, 'skill_tag').x = w - 86; };
const header = (slot, {name, level, px, tag, tagColor = 0xf6c0b8, desc, uri}) => place(slot, 'vortex_skill_header_xml', 0, 0, (h) => {
    fitHeader(h, slot.width);
    text(h, 'skill_name', name); text(h, 'skill_level', level); bar(h, 'skill_progress', px); text(h, 'points', ''); icon(h, 'skill_icon', uri);
    if(tag) { text(h, 'skill_tag_txt', tag); tint(h, 'skill_tag', tagColor); } else show(h, 'skill_tag', false);
    text(h, 'skill_desc', desc);
});
const statRow = (list, label, value, bonus, uri, c) => add(list, 'vortex_character_stat_row_xml', (r) => { text(r, 'label', label); text(r, 'value', value); text(r, 'bonus', bonus); icon(r, 'icon', uri); tint(r, 'icon', c); });
const actionSlot = (list, {uri, key, count = '', selected = false, cooldown = '', locked = false, empty = false, hover = false}) => add(list, 'vortex_skill_action_slot_xml', (s) => {
    text(s, 'slot_key', key); show(s, 'selected', selected); show(s, 'lock_icon', locked);
    if(empty) show(s, 'slot_icon', false); else icon(s, 'slot_icon', uri);
    if(count) { text(s, 'slot_count', count); show(s, 'slot_count', true); }
    if(cooldown) { text(s, 'cooldown_txt', cooldown); show(s, 'cooldown_txt', true); tint(s, 'slot_icon', 0x8080a0); }
    if(hover) { const b = find(s, 'slot_box'); b.x -= 1; b.y -= 1; }
});
const skillTile = (grid, {name, uri, level, selected = false, locked = false, upgradable = false, unavailable = false, hover = false}) => add(grid, 'vortex_skill_slot_xml', (t) => {
    icon(t, 'skill_icon', uri); text(t, 'skill_level', level); show(t, 'selected', selected); show(t, 'lock_icon', locked); show(t, 'upgrade_badge', upgradable);
    if(locked || unavailable) tint(t, 'skill_icon', 0x8080a0);
    if(hover) { t.x -= 1; t.y -= 1; }
});
