// @include fill_common.js
// The bestiary window.
const w = root;
const cats = find(w, 'category_list');
for(const [name, count, uri, c, sel] of [['Toutes', '42 / 120', I.all, 0x8a94a0, true], ['Forêts', '12 / 28', I.tree, 0x40b030], ['Grottes', '8 / 22', I.cave, 0x8a94a0], ['Montagnes', '7 / 18', I.mountain, 0x8a94a0], ['Marais', '5 / 16', I.swamp, 0x40b030], ['Plaines', '6 / 18', I.plain, 0xb08050], ['Déserts', '2 / 12', I.desert, 0xd8a060], ['Donjons', '2 / 6', I.skull, 0xd23a2a]])
    add(cats, 'vortex_achievement_category_row_xml', (r) => { r.width = 184; find(r, 'selected').width = 184; text(r, 'category_name', name); text(r, 'category_count', count); icon(r, 'category_icon', uri); tint(r, 'category_icon', c); show(r, 'selected', !!sel); });
text(w, 'discovered_count', '42 / 120');
const list = find(w, 'creature_list');
for(const [name, zone, uri, c, known, sel] of [['Slime d’Ambre', 'Forêt d’Ambre', I.elemental, 0x40b030, true], ['Rat des égouts', 'Ville d’Ambre', I.beast, 0x8a94a0, true, true], ['Champignon virevoltant', 'Forêt d’Ambre', I.mushroom, 0xd23a2a, true], ['Araignée forestière', 'Forêt d’Ambre', I.spider, 0x5a4a7a, true], ['Loup gris', 'Plaines d’Ambre', I.beast, 0x6a6a72, true], ['Sanglier brun', 'Forêt d’Ambre', I.beast, 0xb08050, true], ['Abeille géante', 'Forêt d’Ambre', I.bee, 0xf0c030, true], ['?????', 'Forêt d’Ambre', I.question, 0x8a94a0, false], ['?????', 'Plaines d’Ambre', I.question, 0x8a94a0, false], ['?????', 'Montagnes d’Ambre', I.question, 0x8a94a0, false]])
    add(list, 'vortex_bestiary_creature_row_xml', (r) => { text(r, 'creature_name', name); text(r, 'creature_zone', zone); icon(r, 'creature_icon', uri); tint(r, 'creature_icon', c); if(!known) { tcolor(r, 'creature_name', 0x888888); tint(r, 'known_box', 0xe6e6e0); icon(r, 'known_icon', I.question); tint(r, 'known_icon', 0x8a94a0); } show(r, 'selected', !!sel); });
const d = find(w, 'creature_detail');
icon(d, 'creature_icon', I.beast); tint(d, 'creature_icon', 0x8a94a0); text(d, 'creature_name', 'Rat des égouts'); text(d, 'creature_number', '#002');
text(w, 'type_pill_txt', 'Type : Bête'); tint(w, 'type_pill', 0xdcc8f4); text(w, 'size_pill_txt', 'Taille : Petite'); tint(w, 'size_pill', 0xc8dcf4);
icon(w, 'creature_illustration', 'rpg/ui-icons/rpg_creature_archetypes_beast_wolf_howling_icon'); const ill = find(w, 'creature_illustration'); ill.color = 0x8a94a0;
text(w, 'creature_desc', 'Un rongeur opportuniste qui vit dans les égouts et les zones urbaines. Très répandu, il s’adapte facilement à son environnement et se déplace en groupe.');
icon(w, 'zone_thumb', 'arena_11_preview'); text(w, 'zone_name', 'Ville d’Ambre');
const loot = find(w, 'loot_list');
for(const [name, chance, uri, c, key] of [['Fromage rassis', '60%', I.cheese, 0xf0c030, 'common'], ['Queue de rat', '25%', I.bone, 0xb08050, 'uncommon'], ['Dent pointue', '10%', I.bone, 0xe8e8e0, 'rare'], ['Cristal sombre', '5%', I.rare, 0x8a3ad0, 'epic'], ['Inconnu', '', I.question, 0x8a94a0, 'common']])
    add(loot, 'vortex_bestiary_loot_tile_xml', (tile) => { text(tile, 'loot_name', name); text(tile, 'loot_chance', chance); icon(tile, 'loot_icon', uri); tint(tile, 'loot_icon', c); if(!chance) tcolor(tile, 'loot_name', 0x888888); });
const aff = (listName, rows) => rows.forEach(([name, uri, c]) => add(find(w, listName), 'vortex_bestiary_affinity_row_xml', (r) => { text(r, 'affinity_name', name); icon(r, 'affinity_icon', uri); tint(r, 'affinity_icon', c); }));
aff('weakness_list', [['Feu', I.fire, 0xe06020], ['Lumière', I.light, 0xf0c030]]);
aff('resistance_list', [['Nature', I.nature, 0x40b030], ['Poison', I.poison, 0x8a3ad0]]);
for(const tip of ['Facile à vaincre en solo.', 'Attaques en groupe.', 'Peu de points de vie mais rapide.', 'Utilisez des attaques de zone.']) add(find(w, 'tip_list'), 'vortex_bestiary_tip_xml', (r) => text(r, 'tip_txt', tip));
