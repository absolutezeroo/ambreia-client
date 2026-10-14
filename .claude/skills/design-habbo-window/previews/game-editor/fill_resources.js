// Ressources (sheet cc65128c) in the editor's « Ressources » rail entry: resource templates on the left,
// their spawns on the zone, the template's form, its detailed loot and its distribution below.
const RAIL = 'resources';
// @include fill_common.js
const M = U + 'map_markers_', T = U + 'tools_crafting_';
library('Ressources', [
    ['Toutes (48)', T + 'writing_parchment_scroll_document_icon', 0xc89040], ['Bois (8)', M + 'tree_forest_decidous_1_icon', 0x40a040], ['Minerais (10)', T + 'mining_pickaxe_icon', 0x7a6a5a],
    ['Herbes (8)', U + 'weather_nature_leaf_autumn_fall_element_icon', 0x40a040], ['Poissons (6)', T + 'fishing_small_icon', 0x3a90d0], ['Peaux (4)', T + 'leatherworking_hide_tanning_materials_icon', 0xb07840],
    ['Cristaux (5)', U + 'rpg_gem_jewelcrafting_diamond_points_currency_icon', 0x9050e0], ['Trésors (3)', T + 'chest_locked_loot_icon', 0xc08030],
], [
    ['Bois d’ambre', 'Arbre', 'Niv. 1', 0x4cc040, A('materials', 17)], ['Bois de chêne', 'Arbre', 'Niv. 1', 0x4cc040, A('materials', 16)], ['Bois de pin', 'Arbre', 'Niv. 1', 0x4cc040, A('materials', 18)],
    ['Minerai de fer', 'Minerai', 'Niv. 5', 0x4cc040, A('materials', 3)], ['Minerai de cuivre', 'Minerai', 'Niv. 5', 0x4cc040, A('materials', 2)], ['Minerai d’argent', 'Minerai', 'Niv. 15', 0xe03030, A('materials', 4)],
    ['Herbe médicinale', 'Plante', 'Niv. 1', 0x4cc040, A('materials', 26)], ['Fleur de lune', 'Plante', 'Niv. 8', 0x4cc040, A('materials', 36)], ['Cristal brut', 'Cristal', 'Niv. 10', 0x4cc040, A('materials', 41)],
]);
// the zone with the resource's spawns (the selected one ringed)
const layer = isoView();
for(const [n, lv, x, y, sel] of [['Bois d’ambre', 1, 250, 150, true], ['Cristal brut', 10, 40, 210], ['Minerai de fer', 5, 420, 190], ['Herbe médicinale', 1, 470, 330], ['Champignon rouge', 1, 70, 380], ['Baie rouge', 1, 270, 420]])
{
    place(layer, P + 'map_label_xml', x, y, (m) => { text(m, 'label_name', n); text(m, 'label_level', `Niv. ${lv}`); if(sel) tint(m, 'label_box', 0x6a5010); });
}
inspector('Bois d’ambre', [
    F.section('Propriétés de la ressource'),
    F.text('Identifiant', 'res_wood_amber_01'), F.text('Nom', 'Bois d’ambre'), F.select('Type', 'Bois'), F.select('Profession liée', 'Bûcheronnage'),
    F.num('Niveau requis', '1'), F.select('Outil requis', 'Hache en bois'), F.range('Quantité', '2', '5'), F.num('Récolte (s)', '4'), F.num('Respawn (s)', '300'),
    F.select('Biome', 'Forêt tempérée'), F.select('Rareté', 'Commune'), F.num('XP gagnée', '10'), F.tags('Tags', ['bois', 'arbre', 'forêt', 'ambre']),
    F.section('Table de butin'),
    F.loot('Bûche d’ambre', A('materials', 17), '70 %', '2 - 4'), F.loot('Éclat de résine', A('materials', 1), '25 %', '1 - 2'), F.loot('Graine d’ambre', A('materials', 35), '5 %', '1 - 1'), F.add('Ajouter un objet'),
    F.section('Validation'),
    F.check('Aucune collision avec le décor'), F.check('Zone accessible par le joueur'), F.check('Répartition cohérente'), F.check('Quantités dans les limites'), F.check('Temps de récolte équilibré'),
]);
const b = bottom('bottom_resource');
text(b, 'entry_name', 'Bûche d’ambre'); icon(b, 'entry_icon', A('materials', 17)); tint(b, 'entry_icon', 0xffffff);
for(const [layout, fill] of [F.pick('Objet', 'obj_log_amber'), F.slider('Chance', '70 %', 0.7), F.range('Quantité', '2', '4'), F.check('Objet garanti', false), F.check('Dépend du niveau du joueur', false)])
    add(find(b, 'entry_fields'), P + layout + '_xml', fill);
for(const [n, uri, pct, qty, empty] of [['Éclat de résine', A('materials', 1), '25 %', '1-2'], ['Graine d’ambre', A('materials', 35), '5 %', '1-1'], ['Choisir un objet…', '', '0 %', '1-1', true], ['Choisir un objet…', '', '0 %', '1-1', true], ['Choisir un objet…', '', '0 %', '1-1', true]])
    add(find(b, 'slot_list'), P + 'loot_slot_row_xml', (r) => { text(r, 'slot_name', n); text(r, 'slot_pct', pct); text(r, 'slot_qty', qty); if(empty) { tcolor(r, 'slot_name', 0x9aa0a8); show(r, 'slot_icon', false); icon(r, 'slot_action_icon', IC.plus); tint(r, 'slot_action_icon', 0x2f9e2f); } else icon(r, 'slot_icon', uri); });
for(const [x, y, c] of [[30, 24, 0xe02020], [52, 34, 0xf06020], [110, 60, 0xe02020], [128, 70, 0xf0a020], [180, 30, 0xf0c030], [76, 96, 0xf0e040], [196, 92, 0xe03020], [214, 100, 0xf08020]])
    place(find(b, 'heat_layer'), P + 'heat_blob_xml', x - 14, y - 14, (k) => tint(k, 'blob_shape', 0xff000000 | c));
