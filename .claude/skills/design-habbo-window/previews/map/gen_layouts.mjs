// Writes the layouts of the "Carte du monde, voyage & découverte" sheet: world/region map window (regions,
// map canvas with markers, filters and legend), map marker and place tooltip, fast travel list and its
// confirmation, zone discovery banner, quest route. The map picture is a placeholder until the engine draws it.
import {bmp, txt, btn, iconBtn, sep, box, cont, list, shape, input, portrait, selectedOverlay, frame, layout, write, locales, I, C} from '../../tools/ui_helpers.mjs';
const M = 'rpg/ui-icons/map_markers_';
export const MAP = {
    world: M + 'mountains_hills_cliffs_terrain_icon', region: M + 'tree_forest_icon', local: M + 'building_home_house_icon', compass: M + 'compass_rose_1_icon', pin: M + 'location_pin_big_icon',
    town: M + 'buildings_houses_homes_village_town_icon', castle: M + 'building_castle_fortress_city_icon', cave: M + 'cave_cavern_enterance_exit_icon',
};
const TABS = `<tab_context x="8" y="0" width="480" height="32" params="17" style="3" name="tab_context">
  <children>
    <tab_button x="0" y="0" width="160" height="32" params="17" style="3" name="tab_world" caption="\${vortex.map.tab.world}" id="1"/>
    <tab_button x="160" y="0" width="160" height="32" params="17" style="3" name="tab_region" caption="\${vortex.map.tab.region}" id="2"/>
    <tab_button x="320" y="0" width="160" height="32" params="17" style="3" name="tab_local" caption="\${vortex.map.tab.local}" id="3"/>
  </children>
</tab_context>`;

// ---------- map window
write('vortex_map_region_row_xml', layout('vortex_map_region_row_xml', 170, 36, box(0, 0, 170, 36, [
    selectedOverlay(170, 36),
    bmp(8, 10, 16, 16, MAP.region, {name: 'region_icon', color: '0x40a040'}),
    txt(32, 10, 134, 16, {name: 'region_name', size: 10, bold: true}),
], {name: 'region_row', params: 17, dyn: 'lifted_hover'})));
write('vortex_map_filter_row_xml', layout('vortex_map_filter_row_xml', 156, 24, cont(0, 0, 156, 24, [
    `<checkbox x="0" y="3" width="18" height="18" params="17" style="3" name="filter_check"/>`,
    bmp(26, 4, 16, 16, I.lamp, {name: 'filter_icon', color: '0xf0c030'}),
    txt(48, 4, 108, 16, {name: 'filter_txt', size: 10}),
], {name: 'filter_row'})));
write('vortex_map_legend_row_xml', layout('vortex_map_legend_row_xml', 156, 20, cont(0, 0, 156, 20, [
    bmp(4, 2, 16, 16, MAP.pin, {name: 'legend_icon', color: '0x2a8fd6'}),
    shape(0, 9, 24, 2, '0x8a7a50', {name: 'legend_line', radius: 1, hidden: true}),
    txt(30, 2, 126, 16, {name: 'legend_txt', size: 9}),
], {name: 'legend_row'})));
write('vortex_map_marker_xml', layout('vortex_map_marker_xml', 40, 40, cont(0, 0, 40, 40, [
    shape(2, 2, 36, 36, '0x00000000', {name: 'marker_ring', radius: 18, stroke: '0xffffd040', hidden: true}),
    bmp(4, 4, 32, 32, I.lamp, {name: 'marker_icon', color: '0xf0c030', zoom: 2}),
], {name: 'map_marker', params: 17})));
write('vortex_map_xml', frame('vortex_map_xml', 790, 440, '${vortex.map.title}', [
    cont(0, 0, 790, 32, [TABS]),
    txt(10, 40, 170, 14, {caption: '${vortex.map.current_region}', size: 10, bold: true, color: C.title}),
    box(8, 58, 180, 338, [list(5, 5, 170, 328, 'region_list', 4)], {style: 102, name: 'regions'}),
    box(196, 40, 404, 356, [
        bmp(0, 0, 404, 356, 'arena_12_preview', {name: 'map_image', tags: false, stretch: true}),
        cont(0, 0, 404, 356, [], {name: 'marker_layer'}),
        bmp(356, 8, 32, 32, MAP.compass, {name: 'compass', color: '0xffd890', zoom: 2}),
        cont(8, 310, 200, 38, [bmp(0, 0, 200, 38, 'rpg/parchement', {tags: false, stretch: true}), txt(0, 11, 200, 16, {name: 'region_title', size: 12, bold: true, color: '0x3a2a10', align: 'center'})], {name: 'region_banner'}),
    ], {style: 102, name: 'map_box'}),
    box(608, 40, 174, 356, [
        txt(8, 6, 160, 14, {caption: '${vortex.map.filters}', size: 10, bold: true, color: C.panelTitle}),
        list(8, 26, 160, 160, 'filter_list', 2),
        sep(8, 194, 158),
        txt(8, 202, 160, 14, {caption: '${vortex.map.legend}', size: 10, bold: true, color: C.panelTitle}),
        list(8, 222, 160, 128, 'legend_list', 2),
    ], {style: 103, name: 'filters'}),
]));
// place tooltip on hover
write('vortex_map_place_tip_xml', layout('vortex_map_place_tip_xml', 230, 118, box(0, 0, 230, 118, [
    box(6, 6, 40, 40, [bmp(4, 4, 32, 32, MAP.town, {name: 'place_icon', color: '0xd8a060', zoom: 2})], {name: 'place_box', style: 9, color: '0x2a2438'}),
    txt(52, 6, 172, 16, {name: 'place_name', size: 11, bold: true, color: C.title}),
    txt(52, 24, 172, 14, {name: 'place_kind', size: 9, color: C.light}),
    txt(8, 52, 216, 44, {name: 'place_txt', size: 9, color: C.light, multi: true}),
    txt(8, 98, 216, 14, {name: 'place_hint', size: 9, color: C.link, align: 'center'}),
], {name: 'place_tip', style: 9, color: '0x3a3254'})));

// ---------- fast travel
write('vortex_teleport_row_xml', layout('vortex_teleport_row_xml', 404, 60, box(0, 0, 404, 60, [
    selectedOverlay(404, 60),
    box(6, 6, 48, 48, [bmp(8, 8, 32, 32, MAP.town, {name: 'place_icon', color: '0xd8a060', zoom: 2})], {name: 'place_box', style: 102}),
    txt(62, 10, 180, 16, {name: 'place_name', bold: true}),
    txt(62, 30, 180, 16, {name: 'place_sub', size: 10, color: C.sub}),
    bmp(244, 22, 16, 16, I.coin, {name: 'cost_icon', color: '0xf0c030'}), txt(264, 22, 44, 16, {name: 'cost_txt', size: 11, bold: true}),
    bmp(262, 12, 16, 16, I.lock, {name: 'lock_icon', color: '0xd23a2a', hidden: true}), txt(236, 30, 74, 14, {name: 'lock_txt', size: 9, bold: true, color: C.red, align: 'center', hidden: true}),
    btn(314, 16, 82, 'travel_button', '${vortex.map.travel}', {style: 301, color: '0x2a6aa0'}),
], {name: 'teleport_row', params: 17, dyn: 'lifted_hover'})));
write('vortex_teleport_xml', frame('vortex_teleport_xml', 420, 380, '${vortex.map.fast_travel}', [
    box(8, 4, 404, 330, [list(0, 4, 404, 322, 'place_list', 4, {scroll: true})], {style: 102, name: 'places'}),
]));
write('vortex_teleport_confirm_xml', frame('vortex_teleport_confirm_xml', 320, 270, '${vortex.map.teleport_title}', [
    box(8, 4, 48, 48, [bmp(8, 8, 32, 32, MAP.region, {name: 'place_icon', color: '0x40a040', zoom: 2})], {name: 'place_box', style: 102}),
    txt(64, 8, 248, 14, {caption: '${vortex.map.teleport_to}', size: 10, color: C.light}),
    txt(64, 26, 248, 18, {name: 'place_name', size: 13, bold: true, color: C.title}),
    box(8, 60, 304, 60, [
        bmp(8, 8, 16, 16, I.coin, {color: '0xf0c030'}), txt(30, 8, 140, 16, {caption: '${vortex.map.cost}', size: 10}), txt(176, 8, 120, 16, {name: 'cost_txt', size: 10, bold: true, color: C.amber, align: 'right'}),
        bmp(8, 34, 16, 16, I.hourglass, {color: '0xb07840'}), txt(30, 34, 140, 16, {caption: '${vortex.map.cast_time}', size: 10}), txt(176, 34, 120, 16, {name: 'cast_txt', size: 10, bold: true, color: C.amber, align: 'right'}),
    ], {style: 103, name: 'cost_box'}),
    box(8, 128, 304, 40, [bmp(10, 12, 16, 16, I.x, {color: '0xffffff'}), txt(34, 12, 262, 16, {name: 'error_txt', size: 10, bold: true, color: C.title})], {name: 'error_box', style: 9, color: '0x8a2a2a', hidden: true}),
    btn(8, 176, 148, 'cancel_button', '${vortex.ui.cancel}', {style: 301, color: '0xd23a2a'}),
    btn(164, 176, 148, 'confirm_button', '${vortex.ui.confirm}', {style: 301, color: '0x2f9e2f'}),
]));

// ---------- zone discovered: a banner over the world, then the points of interest found
write('vortex_map_poi_row_xml', layout('vortex_map_poi_row_xml', 196, 28, cont(0, 0, 196, 28, [
    bmp(4, 6, 16, 16, MAP.town, {name: 'poi_icon', color: '0xd8a060'}),
    txt(28, 6, 168, 16, {name: 'poi_txt', size: 10, color: C.title}),
], {name: 'poi_row'})));
write('vortex_zone_discovered_xml', layout('vortex_zone_discovered_xml', 600, 240, cont(0, 0, 600, 240, [
    box(0, 0, 384, 240, [
        bmp(0, 0, 384, 240, 'arena_10_preview', {name: 'zone_image', tags: false, stretch: true}),
        txt(0, 40, 384, 22, {name: 'discovered_txt', caption: '${vortex.map.discovered}', size: 16, bold: true, color: '0xffd040', align: 'center'}),
        cont(32, 68, 320, 56, [bmp(0, 0, 320, 56, 'rpg/parchement', {tags: false, stretch: true}), txt(0, 14, 320, 26, {name: 'zone_name', size: 20, bold: true, color: '0x3a2a10', align: 'center'})], {name: 'zone_banner'}),
        box(92, 132, 200, 26, [txt(0, 4, 200, 18, {name: 'level_txt', size: 12, bold: true, color: C.title, align: 'center'})], {name: 'level_box', style: 9, color: '0x2a2438'}),
        box(92, 166, 200, 30, [bmp(10, 7, 16, 16, I.star, {color: '0xc080ff'}), txt(32, 6, 160, 18, {name: 'xp_txt', size: 12, bold: true, color: '0xffd040'})], {name: 'xp_box', style: 9, color: '0x2a2438'}),
    ], {name: 'banner_box', style: 102}),
    box(392, 0, 208, 240, [txt(8, 8, 192, 16, {caption: '${vortex.map.poi_found}', size: 11, bold: true, color: '0xffd890'}), list(6, 30, 196, 202, 'poi_list', 2)], {name: 'poi_box', style: 9, color: '0x3a3254'}),
], {name: 'zone_discovered'})));

// ---------- tracked quest route
write('vortex_quest_route_xml', frame('vortex_quest_route_xml', 460, 300, '${vortex.map.tracked_quest}', [
    portrait(8, 4, 56, 'head_image'),
    txt(72, 4, 230, 18, {name: 'quest_name', size: 13, bold: true, color: C.title}),
    txt(72, 24, 230, 32, {name: 'quest_desc', size: 10, color: C.light, multi: true}),
    box(8, 66, 300, 120, [list(6, 6, 288, 108, 'objective_list', 4)], {style: 103, name: 'objectives'}),
    box(316, 4, 136, 182, [bmp(0, 0, 136, 182, 'arena_9_preview', {name: 'minimap_image', tags: false, stretch: true}), bmp(52, 40, 32, 32, MAP.pin, {name: 'target_pin', color: '0xd23a2a', zoom: 2}), shape(54, 140, 12, 12, '0x2a8fd6', {name: 'player_dot', radius: 6, stroke: '0xffffffff'})], {style: 102, name: 'minimap_box'}),
    btn(8, 196, 300, 'show_button', '${vortex.map.show_on_map}', {style: 301, color: '0x2a6aa0', h: 34}),
    bmp(318, 202, 16, 16, I.right, {color: '0xffd890'}), txt(338, 194, 114, 16, {name: 'distance_txt', size: 10, color: C.light}), txt(338, 212, 114, 16, {name: 'direction_txt', size: 10, color: C.light}),
]));

locales('map', {
    'vortex.map.title': 'Carte du monde', 'vortex.map.tab.world': 'Monde', 'vortex.map.tab.region': 'Région', 'vortex.map.tab.local': 'Zone locale', 'vortex.map.current_region': 'Région actuelle',
    'vortex.map.filters': 'Filtres de carte', 'vortex.map.legend': 'Légende', 'vortex.map.filter.quests': 'Quêtes', 'vortex.map.filter.towns': 'Villes', 'vortex.map.filter.dungeons': 'Donjons', 'vortex.map.filter.waypoints': 'Points de voyage', 'vortex.map.filter.poi': 'Points d’intérêt', 'vortex.map.filter.custom': 'Marqueurs perso.',
    'vortex.map.legend.position': 'Votre position', 'vortex.map.legend.cursor': 'Position du curseur', 'vortex.map.legend.undiscovered': 'Zone non découverte', 'vortex.map.legend.path': 'Chemin', 'vortex.map.legend.road': 'Route principale',
    'vortex.map.fast_travel': 'Téléportation rapide', 'vortex.map.travel': 'Voyager', 'vortex.map.undiscovered': 'Non découvert', 'vortex.map.level_range': 'Niv. %min% - %max%',
    'vortex.map.teleport_title': 'Téléportation', 'vortex.map.teleport_to': 'Téléportation vers :', 'vortex.map.cost': 'Coût :', 'vortex.map.cast_time': 'Temps d’incantation :', 'vortex.map.in_combat': 'Impossible de se téléporter en combat !',
    'vortex.map.discovered': 'Zone découverte !', 'vortex.map.recommended': 'Niveau recommandé : %min% - %max%', 'vortex.map.xp': '+ %n% points d’expérience', 'vortex.map.poi_found': 'Points d’intérêt découverts',
    'vortex.map.tracked_quest': 'Quête suivie', 'vortex.map.show_on_map': 'Afficher sur la carte', 'vortex.map.distance': 'Distance : %n% m', 'vortex.map.direction': 'Direction : %dir%', 'vortex.map.click_hint': 'Clic gauche : voir sur la carte',
}, {
    'vortex.map.title': 'World map', 'vortex.map.tab.world': 'World', 'vortex.map.tab.region': 'Region', 'vortex.map.tab.local': 'Local area', 'vortex.map.current_region': 'Current region',
    'vortex.map.filters': 'Map filters', 'vortex.map.legend': 'Legend', 'vortex.map.filter.quests': 'Quests', 'vortex.map.filter.towns': 'Towns', 'vortex.map.filter.dungeons': 'Dungeons', 'vortex.map.filter.waypoints': 'Waypoints', 'vortex.map.filter.poi': 'Points of interest', 'vortex.map.filter.custom': 'Custom markers',
    'vortex.map.legend.position': 'Your position', 'vortex.map.legend.cursor': 'Cursor position', 'vortex.map.legend.undiscovered': 'Undiscovered area', 'vortex.map.legend.path': 'Path', 'vortex.map.legend.road': 'Main road',
    'vortex.map.fast_travel': 'Fast travel', 'vortex.map.travel': 'Travel', 'vortex.map.undiscovered': 'Undiscovered', 'vortex.map.level_range': 'Lv. %min% - %max%',
    'vortex.map.teleport_title': 'Teleport', 'vortex.map.teleport_to': 'Teleport to:', 'vortex.map.cost': 'Cost:', 'vortex.map.cast_time': 'Cast time:', 'vortex.map.in_combat': 'You cannot teleport while in combat!',
    'vortex.map.discovered': 'Area discovered!', 'vortex.map.recommended': 'Recommended level: %min% - %max%', 'vortex.map.xp': '+ %n% experience points', 'vortex.map.poi_found': 'Points of interest found',
    'vortex.map.tracked_quest': 'Tracked quest', 'vortex.map.show_on_map': 'Show on the map', 'vortex.map.distance': 'Distance: %n% m', 'vortex.map.direction': 'Direction: %dir%', 'vortex.map.click_hint': 'Left click: show on the map',
});
console.log('map layouts written');
