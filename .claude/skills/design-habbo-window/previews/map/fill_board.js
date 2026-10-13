// Fills the "États – Carte du monde et voyage" board (states_map.xml).
const at = (name) => find(root, name);
const U = 'rpg/ui-icons/', M = U + 'map_markers_';
const K = {
    globe: M + 'tree_forest_decidous_1_icon', mountain: M + 'mountains_hills_cliffs_terrain_icon', plains: M + 'building_farmland_crops_1_icon', cactus: M + 'cactus_desert_icon', palm: M + 'tree_forest_palm_beach_icon', tent: M + 'building_tent_campsite_icon',
    forest: M + 'tree_forest_icon', pine: M + 'tree_forest_pine_icon', town: M + 'buildings_houses_homes_village_town_icon', house: M + 'building_home_house_icon', castle: M + 'building_castle_fortress_city_icon', ruins: M + 'graveyard_gravestone_death_2_icon',
    fountain: M + 'building_fountain_park_water_icon', pin: M + 'location_pin_big_icon', compass: M + 'compass_rose_1_icon', lamp: U + 'software_warning_sign_circle_exclaimation_mark_error_icon', skull: U + 'rpg_skull_death_dead_small_icon',
    star: U + 'boardgames_card_star_icon', swords: U + 'rpg_crossed_swords_duel_pvp_combat_battle_war_icon', waypoint: U + 'arrows_roundabout_rotation_circle_reload_refresh_loop_icon', cursor: U + 'software_magnifier_zoom_looking_magnifying_glass_icon', cloud: U + 'weather_cloudy_overcast_icon',
};
const marker = (parent, x, y, uri, c, {ring = false, dim = false} = {}) => place(parent, 'vortex_map_marker_xml', x, y, (m) => { icon(m, 'marker_icon', uri); tint(m, 'marker_icon', dim ? 0x6a6a72 : c); show(m, 'marker_ring', ring); if(dim) m.alpha = 0.6; });

// 1. map window + fast travel
place(at('map'), 'vortex_map_xml', 0, 0, (w) => {
    tab(w, 'tab_region');
    [['Royaumes d’Ambreia', K.globe, 0x40a040], ['Montagnes d’Ambre', K.mountain, 0xa08060], ['Plaines Brumeuses', K.plains, 0x60a040], ['Terres Sauvages', K.cactus, 0x60b040], ['Côte d’Émeraude', K.palm, 0x40b0a0], ['Désert d’Orion', K.tent, 0xe0a030], ['Îles Lointaines', K.palm, 0x40a040]]
        .forEach(([n, uri, c], i) => add(find(w, 'region_list'), 'vortex_map_region_row_xml', (r) => { text(r, 'region_name', n); icon(r, 'region_icon', uri); tint(r, 'region_icon', c); show(r, 'selected', i === 0); }));
    const layer = find(w, 'marker_layer');
    marker(layer, 140, 50, K.lamp, 0xf0c030); marker(layer, 60, 120, K.lamp, 0xf0c030); marker(layer, 330, 110, K.pin, 0xd23a2a);
    marker(layer, 100, 170, K.waypoint, 0x2a8fd6, {ring: true}); marker(layer, 270, 230, K.waypoint, 0x2a8fd6); marker(layer, 210, 30, K.castle, 0x8a94a0); marker(layer, 40, 230, K.house, 0xd8a060);
    place(layer, 'vortex_map_place_tip_xml', 170, 120, (t) => { icon(t, 'place_icon', K.forest); tint(t, 'place_icon', 0x40a040); text(t, 'place_name', 'Forêt d’Ambre'); text(t, 'place_kind', 'Niveau recommandé : 10 - 20'); text(t, 'place_txt', '3 quêtes disponibles'); show(t, 'place_hint', false); t.height = 74; });
    text(w, 'region_title', 'Royaumes d’Ambreia');
    [['quests', K.lamp, 0xf0c030], ['towns', K.house, 0xd8a060], ['dungeons', K.skull, 0x6a6a72], ['waypoints', K.waypoint, 0x2a8fd6], ['poi', K.star, 0xf0c030], ['custom', K.pin, 0xd23a2a]]
        .forEach(([k, uri, c]) => add(find(w, 'filter_list'), 'vortex_map_filter_row_xml', (r) => { text(r, 'filter_txt', `\${vortex.map.filter.${k}}`); icon(r, 'filter_icon', uri); tint(r, 'filter_icon', c); const cb = find(r, 'filter_check'); if(cb && cb.select) cb.select(); }));
    [['position', K.waypoint, 0x2a8fd6], ['cursor', K.cursor, 0x6a6a72], ['undiscovered', K.cloud, 0x8a94a0], ['path', null, 0xb0a070], ['road', null, 0x8a7a50]]
        .forEach(([k, uri, c]) => add(find(w, 'legend_list'), 'vortex_map_legend_row_xml', (r) => { text(r, 'legend_txt', `\${vortex.map.legend.${k}}`); if(uri) { icon(r, 'legend_icon', uri); tint(r, 'legend_icon', c); } else { show(r, 'legend_icon', false); show(r, 'legend_line'); tint(r, 'legend_line', c); } }));
});
place(at('teleport'), 'vortex_teleport_xml', 0, 0, (w) => {
    for(const [n, sub, uri, c, cost, sel, locked] of [['Ville d’Ambre', 'Capitale du royaume', K.town, 0xd8a060, '50'], ['Forêt d’Ambre', 'Niv. 10 - 20', K.forest, 0x40a040, '30', true], ['Monts d’Argel', 'Niv. 25 - 40', K.mountain, 0xa0a0b0, '75'], ['Port d’Émeraude', 'Niv. 15 - 30', K.palm, 0x40b0a0, '60'], ['Forteresse Noire', 'Niv. 40 - 60', K.castle, 0x6a4a7a, '', false, true]])
        add(find(w, 'place_list'), 'vortex_teleport_row_xml', (r) => {
            text(r, 'place_name', n); text(r, 'place_sub', sub); icon(r, 'place_icon', uri); tint(r, 'place_icon', c); text(r, 'cost_txt', cost); show(r, 'selected', !!sel);
            if(locked) { show(r, 'cost_icon', false); show(r, 'cost_txt', false); show(r, 'lock_icon'); show(r, 'lock_txt'); text(r, 'lock_txt', '${vortex.map.undiscovered}'); tcolor(r, 'place_sub', 0xc30000); tint(r, 'travel_button', 0x9a9a9a); }
        });
});

// 2. discovery, route
place(at('discovered'), 'vortex_zone_discovered_xml', 0, 0, (z) => {
    text(z, 'zone_name', 'Forêt d’Ambre'); text(z, 'level_txt', 'Niveau recommandé : 10 - 20'); text(z, 'xp_txt', '+ 250 points d’expérience');
    for(const [n, uri, c] of [['Village des Sylves', K.house, 0xd8a060], ['Camp des Garde-Feu', K.tent, 0xd8a060], ['Ruines anciennes', K.ruins, 0xa0a0b0], ['Cachette des bandits', K.swords, 0xd23a2a], ['Fontaine de vie', K.fountain, 0x4a90e0]])
        add(find(z, 'poi_list'), 'vortex_map_poi_row_xml', (r) => { text(r, 'poi_txt', n); icon(r, 'poi_icon', uri); tint(r, 'poi_icon', c); });
});
place(at('route'), 'vortex_quest_route_xml', 0, 0, (w) => {
    text(w, 'quest_name', 'Les bois en danger'); text(w, 'quest_desc', 'Parlez au garde forestier et inspectez la zone au nord de la forêt.');
    for(const [l, done] of [['Parler au garde forestier', true], ['Inspecter les traces (0/3)'], ['Éliminer les créatures (0/8)'], ['Retourner voir le garde']])
        add(find(w, 'objective_list'), 'vortex_quest_objective_row_xml', (o) => { o.width = 288; text(o, 'label', l); text(o, 'count', ''); show(o, 'check_icon', !!done); });
    text(w, 'distance_txt', 'Distance : 320 m'); text(w, 'direction_txt', 'Direction : Nord-Est');
});

// 3. confirmation, markers, tooltips, components
place(at('confirm'), 'vortex_teleport_confirm_xml', 0, 0, (c) => { text(c, 'place_name', 'Forêt d’Ambre'); text(c, 'cost_txt', '30 pièces d’or'); text(c, 'cast_txt', '3 secondes'); show(c, 'error_box'); text(c, 'error_txt', '${vortex.map.in_combat}'); tint(c, 'confirm_button', 0x9a9a9a); });
if(at('markers')) [[{}], [{}], [{ring: true}], [{dim: true}]].forEach(([o], i) => marker(at('markers'), i * 60 + 8, i === 1 ? 0 : 2, K.lamp, 0xf0c030, o));
if(at('icons')) [['Quête', K.lamp, 0xf0c030], ['Ville', K.house, 0xd8a060], ['Donjon', K.skull, 0x8a94a0], ['Point de voyage', K.waypoint, 0x2a8fd6], ['Point d’intérêt', K.star, 0xf0c030], ['Marqueur perso.', K.pin, 0xd23a2a]]
    .forEach(([t, uri, c], i) => place(at('icons'), 'vortex_map_legend_row_xml', (i % 2) * 165, Math.floor(i / 2) * 22, (r) => { text(r, 'legend_txt', t); tcolor(r, 'legend_txt', 0xd8d0e8); icon(r, 'legend_icon', uri); tint(r, 'legend_icon', c); }));
place(at('place_tip'), 'vortex_map_place_tip_xml', 0, 0, (t) => { text(t, 'place_name', 'Village des Sylves'); text(t, 'place_kind', 'Ville neutre'); text(t, 'place_txt', 'Services disponibles : marchand, forgeron, maître des quêtes.'); text(t, 'place_hint', '${vortex.map.click_hint}'); });
place(at('tip'), 'vortex_inventory_tip_xml', 0, 0, (t) => { icon(t, 'tip_icon', K.waypoint); tint(t, 'tip_icon', 0x2a8fd6); text(t, 'tip_name', 'Point de voyage'); text(t, 'tip_kind', 'Lieu'); text(t, 'tip_rarity', ''); text(t, 'tip_desc', 'Permet de se téléporter rapidement vers cette localisation depuis n’importe quelle ville d’Ambreia.'); text(t, 'tip_quantity', ''); });
place(at('dropdown'), 'vortex_ui_dropdown_list_xml', 0, 0, (d) => {
    const opts = ['Toutes les catégories', 'Quêtes', 'Villes', 'Donjons', 'Points de voyage'];
    opts.forEach((o, i) => add(find(d, 'option_list'), 'vortex_ui_dropdown_option_xml', (r) => { text(r, 'option_txt', o); if(i === 0) { show(r, 'highlight'); tcolor(r, 'option_txt', 0xffffff); show(r, 'option_check'); tint(r, 'option_check', 0xffffff); } }));
    const h = opts.length * 23 + 8; d.height = h; find(d, 'option_list').height = h - 8;
});
for(const n of ['chk_on', 'radio_on']) { const c = at(n); if(c && c.select) c.select(); }
