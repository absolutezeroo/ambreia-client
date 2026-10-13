// @include fill_common.js
// The skills window on its Specialisations tab (skills_specs sheet).
tab(root, 'tab_specs');
const t = place(find(root, 'tab_content'), 'vortex_skill_tab_specs_xml', 0, 0);
text(t, 'points_txt', 'Points de spécialisation : 2');
const trees = find(t, 'tree_list');
const TREES = [
    ['Pyromancien', '7 / 15', 0xffd8c8, ['warrior', 2, 7, 1, 8, 3, 6], [[3, 5, {selected: true}], [0, 5], [2, 5], [0, 3], [2, 5], [0, 3], [0, 1, {locked: true}], [0, 1, {locked: true}]]],
    ['Gardien runique', '0 / 15', 0xc8dcf0, ['warrior', 5, 9, 10, 4, 1, 3], [[0, 5], [0, 5], [0, 5], [0, 3], [0, 5], [0, 3], [0, 1, {locked: true}], [0, 1, {locked: true}]]],
    ['Lame arcanique', '0 / 15', 0xdcc8f0, ['rogue', 1, 2, 3, 4, 5, 6], [[0, 5], [0, 5], [0, 3], [0, 3], [0, 3], [0, 3], [0, 1, {locked: true}], [0, 1, {locked: true}]]],
];
for(const [name, pts, c, [cls, ...ids], nodes] of TREES) add(trees, 'vortex_skill_tree_xml', (tr) => {
    text(tr, 'tree_name', name); text(tr, 'tree_points', pts); tint(tr, null, c);
    const slots = find(tr, 'node_slots');
    nodes.forEach(([have, max, {selected = false, locked = false} = {}], i) => place(slots, 'vortex_skill_node_xml', (i % 2) * 68, Math.floor(i / 2) * 80, (n) => {
        icon(n, 'node_icon', SK(cls, ids[i % ids.length] ?? 1)); text(n, 'node_count', `${have}/${max}`); show(n, 'selected', selected); show(n, 'lock_icon', locked);
        if(locked) show(n, 'node_icon', false); else if(have === 0) tint(n, 'node_icon', 0x9090a8);
        if(have === 0) tcolor(n, 'node_count', 0x666666);
    }));
});
header(find(t, 'skill_header_slot'), {name: 'Boule de feu', level: 'Niveau 3 / 5', px: 170, tag: '', desc: 'Projette une boule de feu qui inflige d’importants dégâts de feu à un ennemi.', uri: SK('warrior', 2)});
text(t, 'next_level_title', 'Niveau suivant (4/5)');
const ups = find(t, 'upgrade_list');
for(const l of ['Dégâts : 180 (+30)', 'Portée : 4 cases', 'Temps de recharge : 5 secondes', 'Coût en mana : 30 (-5)']) add(ups, 'vortex_skill_upgrade_row_xml', (r) => text(r, 'upgrade_txt', l));
const conds = find(t, 'condition_list');
for(const l of ['Niveau du personnage : 10', 'Points de spécialisation : 1']) add(conds, 'vortex_skill_cost_row_xml', (r) => { text(r, 'cost_txt', l); icon(r, 'cost_icon', I.check); tint(r, 'cost_icon', 0x40b030); });
text(t, 'add_point_button', 'Ajouter 1 point (1)');
