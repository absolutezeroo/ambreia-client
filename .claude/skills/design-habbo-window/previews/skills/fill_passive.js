// @include fill_common.js
// The skills window on its Passives tab (skills_passive sheet §1).
tab(root, 'tab_passive');
const t = place(find(root, 'tab_content'), 'vortex_skill_tab_passive_xml', 0, 0);
const grid = find(t, 'passive_grid');
PASSIVES.forEach(([name, uri, level], i) => add(grid, 'vortex_skill_card_xml', (c) => { text(c, 'skill_name', name); text(c, 'skill_level', level); icon(c, 'skill_icon', uri); show(c, 'selected', i === 0); }));
header(find(t, 'skill_header_slot'), {name: 'Coup critique', level: 'Niveau 5 / 10', px: 185, tag: '', desc: 'Augmente vos chances d’infliger un coup critique avec vos attaques.', uri: SK('warrior', 8)});
text(t, 'current_effect', '+ 5 % de chances de coup critique.');
text(t, 'next_level_title', 'Niveau suivant (6/10)');
text(t, 'next_effect', '+ 6 % de chances de coup critique.');
const costs = find(t, 'cost_list');
add(costs, 'vortex_skill_cost_row_xml', (r) => text(r, 'cost_txt', '1 500'));
add(costs, 'vortex_skill_cost_row_xml', (r) => { text(r, 'cost_txt', '10'); icon(r, 'cost_icon', I.mana); tint(r, 'cost_icon', 0x4090e0); });
text(t, 'upgrade_button', 'Améliorer (1 500)');
place(find(t, 'info_banner_slot'), 'vortex_skill_info_banner_xml', 0, 0);
