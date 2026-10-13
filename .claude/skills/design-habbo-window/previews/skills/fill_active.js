// @include fill_common.js
// The skills window on its Actives tab (skills_active sheet §2).
tab(root, 'tab_active');
const t = place(find(root, 'tab_content'), 'vortex_skill_tab_active_xml', 0, 0);
const grid = find(t, 'skill_grid');
ACTIVES.forEach(([name, uri, level], i) => skillTile(grid, {name, uri, level, selected: i === 0, locked: i === 15, upgradable: i === 1}));
header(find(t, 'skill_header_slot'), {name: 'Frappe ardente', level: 'Niveau 3 / 10', px: 111, tag: 'Dégâts', desc: 'Une attaque puissante qui inflige des dégâts de feu à un ennemi et peut appliquer Brûlure.', uri: SK('warrior', 1)});
const stats = find(t, 'stat_list');
statRow(stats, 'Coût en mana', '25', '', I.mana, 0x4090e0);
statRow(stats, 'Temps de recharge', '6 secondes', '', I.clock, 0x6a6a72);
statRow(stats, 'Portée', '1 case', '', I.range, 0x6a6a72);
statRow(stats, 'Effet', 'Brûlure (6 s)', '10 %', I.fire, 0xe06020);
statRow(stats, 'Dégâts de base', '120', '+20 / niv.', I.sword, 0x6a6a72);
text(t, 'next_level_title', 'Niveau suivant (4/10)');
const ups = find(t, 'upgrade_list');
for(const l of ['Dégâts de base : 140', 'Durée de Brûlure : 8 secondes', 'Coût en mana : 24']) add(ups, 'vortex_skill_upgrade_row_xml', (r) => text(r, 'upgrade_txt', l));
text(t, 'upgrade_button', 'Améliorer (2 000)');
const bar8 = find(t, 'action_bar_slots');
[[SK('warrior', 1), '1'], [SK('warrior', 1), '2'], [SK('psionicist', 2), '3'], [SK('psionicist', 3), '4'], [I.potion, '5', '25'], [I.potion2, '6', '12'], ['rpg/materials/icon_00', '7'], ['rpg/dungeon-objects/icon_37', '8']]
    .forEach(([uri, key, count], i) => actionSlot(bar8, {uri, key, count, selected: i === 1}));
