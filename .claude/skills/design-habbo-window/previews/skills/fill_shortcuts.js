// @include fill_common.js
// The skills window on its Shortcuts tab (skills_shortcuts sheet).
tab(root, 'tab_shortcuts');
const t = place(find(root, 'tab_content'), 'vortex_skill_tab_shortcuts_xml', 0, 0);
const list = find(t, 'available_list');
ACTIVES.slice(0, 12).forEach(([name, uri, level], i) => add(list, 'vortex_skill_list_row_xml', (r) => { text(r, 'skill_name', name); text(r, 'skill_level', level.replace('Niv.', 'Niveau')); icon(r, 'skill_icon', uri); show(r, 'selected', i === 0); }));
const main = find(t, 'main_bar_slots');
[[SK('warrior', 1), '1'], [SK('psionicist', 2), '2'], [SK('psionicist', 3), '3'], [SK('warrior', 5), '4'], [I.potion, '5', '25'], [I.potion2, '6', '12'], ['rpg/materials/icon_00', '7'], ['rpg/dungeon-objects/icon_37', '8']]
    .forEach(([uri, key, count], i) => actionSlot(main, {uri, key, count, selected: i === 0}));
const extra = find(t, 'extra_slots');
[[SK('warrior', 6), 'Q'], [SK('warrior', 2), 'E'], [SK('rogue', 4), 'R'], ['', '+', true]].forEach(([uri, key, empty]) => actionSlot(extra, {uri, key, empty: !!empty}));
icon(t, 'shortcut_icon', SK('warrior', 1)); text(t, 'shortcut_name', 'Frappe ardente'); text(t, 'shortcut_level', 'Niveau 3 / 10'); text(t, 'assigned_key', '1');
text(t, 'shortcut_desc', 'Une attaque puissante qui inflige des dégâts de feu à un ennemi et peut appliquer Brûlure.');
const cb = find(t, 'show_shortcuts'); if(cb && 'isSelected' in cb) cb.isSelected = true;
