// Writes the layouts of the "Housing, logement & décoration" sheet: room navigator, room management, placement
// toolbar, furniture catalogue, access permissions, room preview with the selected object. Pictures are placeholders.
import {bmp, txt, btn, iconBtn, sep, box, cont, list, shape, input, portrait, selectedOverlay, frame, layout, write, locales, I, C} from '../../tools/ui_helpers.mjs';
const U = 'rpg/ui-icons/';
const S = {
    house: U + 'map_markers_building_home_house_icon', pin: U + 'map_markers_location_pin_small_icon', users: U + 'travel_person_people_two_icon', heart: U + 'rpg_stat_hp_health_heart_icon',
    door: U + 'map_markers_doorway_enterance_exit_door_icon', chest: I.chest, visitors: U + 'travel_person_people_three_icon', scroll: I.scroll, move: U + 'arrows_movement_cursor_drag_orthogonal_icon',
    save: U + 'software_save_button_floppy_disk_icon', shield: U + 'map_markers_banner_heraldry_icon',
};
const TABS = (names, w) => `<tab_context x="8" y="0" width="${names.length * w}" height="32" params="17" style="3" name="tab_context">
  <children>
${names.map((n, i) => `    <tab_button x="${i * w}" y="0" width="${w}" height="32" params="17" style="3" name="tab_${n}" caption="\${vortex.housing.tab.${n}}" id="${i + 1}"/>`).join('\n')}
  </children>
</tab_context>`;
const thumb = (x, y, s, name = 'room_image') => box(x, y, s, s, [bmp(0, 0, s, s, 'arena_11_preview', {name, tags: false, stretch: true})], {name: `${name}_box`, style: 102});

// ---------- navigator
write('vortex_housing_room_row_xml', layout('vortex_housing_room_row_xml', 544, 76, box(0, 0, 544, 76, [
    selectedOverlay(544, 76),
    thumb(6, 6, 64),
    txt(78, 6, 220, 18, {name: 'room_name', size: 12, bold: true}),
    txt(78, 26, 220, 16, {name: 'room_type', size: 10, color: C.sub}),
    bmp(78, 48, 16, 16, S.pin, {color: '0x8a94a0'}), txt(98, 48, 200, 16, {name: 'room_place', size: 10, color: C.sub}),
    bmp(306, 8, 16, 16, S.users, {color: '0x6a6a72'}), txt(326, 8, 50, 16, {name: 'users_txt', size: 10, bold: true}),
    bmp(380, 8, 16, 16, I.star, {color: '0xf0c030'}), txt(400, 8, 40, 16, {name: 'rating_txt', size: 10, bold: true}),
    btn(436, 8, 100, 'open_button', '${vortex.housing.open}', {style: 301, color: '0x2f9e2f'}),
    btn(436, 42, 100, 'manage_button', '${vortex.housing.manage}', {style: 301, color: '0x2a6aa0'}),
    btn(404, 42, 100, 'visit_button', '${vortex.housing.visit}', {style: 301, color: '0x2a6aa0', hidden: true}),
    iconBtn(510, 43, 'favorite_button', S.heart, {color: '0xd23a2a', w: 28, h: 26, hidden: true}),
], {name: 'room_row', params: 17, dyn: 'lifted_hover'})));
write('vortex_housing_xml', frame('vortex_housing_xml', 560, 400, '${vortex.housing.title}', [
    cont(0, 0, 560, 32, [TABS(['mine', 'guild', 'favorites', 'popular', 'visit'], 108)]),
    box(8, 40, 544, 316, [list(0, 4, 544, 308, 'room_list', 4, {scroll: true})], {style: 102, name: 'rooms'}),
]));

// ---------- room management
write('vortex_housing_action_row_xml', layout('vortex_housing_action_row_xml', 364, 34, box(0, 0, 364, 34, [
    bmp(10, 9, 16, 16, S.users, {name: 'action_icon', color: '0x5a4a7a'}),
    txt(36, 9, 300, 16, {name: 'action_txt', size: 11}),
    bmp(338, 9, 16, 16, I.right, {color: '0x5a4a7a'}),
], {name: 'action_row', params: 17, dyn: 'lifted_hover'})));
const statBox = (x, label, icon, color, name) => box(x, 0, 116, 60, [txt(0, 6, 116, 14, {caption: label, size: 10, bold: true, color: C.panelTitle, align: 'center'}), bmp(22, 28, 16, 16, icon, {color}), txt(44, 28, 64, 16, {name, size: 12, bold: true})], {style: 103});
write('vortex_housing_manage_xml', frame('vortex_housing_manage_xml', 380, 520, '${vortex.housing.manage_title}', [
    thumb(8, 4, 80),
    txt(96, 8, 276, 20, {name: 'room_name', size: 14, bold: true, color: C.title}),
    txt(96, 30, 276, 16, {name: 'room_type', size: 10, color: C.light}),
    bmp(96, 52, 16, 16, S.pin, {color: '0xd8d0e8'}), txt(116, 52, 256, 16, {name: 'room_place', size: 10, color: C.light}),
    box(8, 92, 364, 64, [portrait(6, 6, 52, 'head_image'), txt(66, 6, 160, 16, {caption: '${vortex.housing.owner}', size: 10, bold: true, color: C.panelTitle}), txt(66, 24, 160, 16, {name: 'owner_name', size: 11, bold: true}), txt(66, 42, 160, 14, {name: 'owner_role', size: 9, color: C.sub}), btn(236, 18, 120, 'rename_button', '${vortex.housing.rename}', {style: 301, color: '0x2a6aa0'})], {style: 103, name: 'owner_box'}),
    box(8, 164, 364, 56, [txt(8, 6, 300, 14, {caption: '${vortex.housing.description}', size: 10, bold: true, color: C.panelTitle}), txt(8, 22, 310, 30, {name: 'description_txt', size: 10, color: C.sub, multi: true}), iconBtn(330, 6, 'edit_button', I.pencil, {color: '0x5a4a7a', w: 26, h: 24})], {style: 103, name: 'description_box'}),
    cont(8, 228, 364, 60, [statBox(0, '${vortex.housing.rooms}', S.door, '0xb07840', 'rooms_txt'), statBox(124, '${vortex.housing.chest}', S.chest, '0xb07840', 'chest_txt'), statBox(248, '${vortex.housing.visitors}', S.visitors, '0x5a4a7a', 'visitors_txt')], {name: 'stats'}),
    list(8, 296, 364, 114, 'action_list', 4),
    btn(8, 420, 364, 'leave_button', '${vortex.housing.leave}', {style: 301, color: '0xd23a2a', h: 32}),
]));

// ---------- placement toolbar
write('vortex_housing_tool_xml', layout('vortex_housing_tool_xml', 86, 66, box(0, 0, 86, 66, [
    selectedOverlay(86, 66),
    bmp(27, 8, 32, 32, S.move, {name: 'tool_icon', color: '0x5a4a7a', zoom: 2}),
    txt(0, 46, 86, 14, {name: 'tool_txt', size: 10, bold: true, align: 'center'}),
], {name: 'tool', params: 17, dyn: 'lifted_hover'})));
write('vortex_housing_edit_xml', frame('vortex_housing_edit_xml', 380, 360, '${vortex.housing.edit_title}', [
    box(8, 4, 44, 44, [bmp(6, 6, 32, 32, S.house, {color: '0xd8a060', zoom: 2})], {style: 102}),
    txt(60, 4, 160, 18, {caption: '${vortex.housing.placement}', size: 13, bold: true, color: C.title}),
    txt(60, 24, 160, 28, {caption: '${vortex.housing.placement_desc}', size: 9, color: C.light, multi: true}),
    cont(222, 12, 150, 26, [], {name: 'mode_switch'}),
    cont(8, 56, 364, 140, [], {name: 'tool_grid'}),
    box(8, 204, 364, 70, [
        `<checkbox x="8" y="10" width="18" height="18" params="17" style="3" name="grid_check"/>`, txt(32, 12, 150, 16, {caption: '${vortex.housing.show_grid}', size: 10}),
        `<checkbox x="8" y="40" width="18" height="18" params="17" style="3" name="snap_check"/>`, txt(32, 42, 150, 16, {caption: '${vortex.housing.snap}', size: 10}),
        txt(196, 8, 160, 14, {caption: '${vortex.housing.grid_size}', size: 10, bold: true, color: C.panelTitle}),
        `<dropmenu x="196" y="30" width="160" height="24" params="17" style="3" name="grid_menu" caption="1 case (32 px)"/>`,
    ], {style: 103, name: 'options'}),
    btn(8, 282, 148, 'cancel_button', '${vortex.ui.cancel}', {style: 301, color: '0xd23a2a', h: 32}),
    btn(164, 282, 208, 'save_button', '${vortex.housing.save}', {style: 301, color: '0x2f9e2f', h: 32}),
]));

// ---------- furniture catalogue
write('vortex_housing_category_row_xml', layout('vortex_housing_category_row_xml', 150, 34, box(0, 0, 150, 34, [
    selectedOverlay(150, 34),
    bmp(8, 9, 16, 16, S.house, {name: 'category_icon', color: '0xb07840'}),
    txt(32, 9, 114, 16, {name: 'category_name', size: 10, bold: true}),
], {name: 'category_row', params: 17, dyn: 'lifted_hover'})));
write('vortex_housing_catalog_xml', frame('vortex_housing_catalog_xml', 560, 440, '${vortex.housing.catalog}', [
    box(8, 4, 160, 392, [list(5, 5, 150, 382, 'category_list', 3)], {style: 102, name: 'categories'}),
    `<dropmenu x="176" y="4" width="150" height="24" params="17" style="3" name="category_menu" caption="\${vortex.housing.all_categories}"/>`,
    box(334, 2, 218, 28, [bmp(8, 6, 16, 16, I.search, {color: '0x6a6a72'}), input(30, 6, 180, 'search_input', '${vortex.housing.search}')], {style: 102, name: 'search_box'}),
    box(176, 36, 376, 324, [list(10, 10, 360, 308, 'item_grid', 6, {grid: true})], {style: 102, name: 'items'}),
    iconBtn(302, 368, 'previous_page', I.left, {w: 28, h: 26}), txt(334, 373, 60, 16, {name: 'page_txt', size: 10, bold: true, color: C.title, align: 'center'}), iconBtn(400, 368, 'next_page', I.right, {w: 28, h: 26}),
]));

// ---------- permissions
write('vortex_housing_permission_row_xml', layout('vortex_housing_permission_row_xml', 344, 34, cont(0, 0, 344, 34, [
    bmp(6, 9, 16, 16, S.users, {name: 'who_icon', color: '0xd8a030'}),
    txt(30, 9, 150, 16, {name: 'who_txt', size: 10}),
    `<dropmenu x="184" y="5" width="156" height="24" params="17" style="3" name="right_menu" caption=""/>`,
], {name: 'permission_row'})));
write('vortex_housing_permissions_xml', frame('vortex_housing_permissions_xml', 380, 360, '${vortex.housing.permissions}', [
    box(8, 4, 44, 44, [bmp(6, 6, 32, 32, S.users, {color: '0xd8d0e8', zoom: 2})], {style: 9, color: '0x2a2438'}),
    txt(60, 6, 312, 18, {caption: '${vortex.housing.permissions}', size: 13, bold: true, color: C.title}),
    txt(60, 26, 312, 28, {caption: '${vortex.housing.permissions_desc}', size: 9, color: C.light, multi: true}),
    box(8, 58, 364, 156, [list(10, 6, 344, 144, 'permission_list', 2)], {style: 103, name: 'permissions_box'}),
    box(8, 222, 364, 44, [bmp(10, 14, 16, 16, I.info, {color: '0xffffff'}), txt(34, 6, 322, 32, {caption: '${vortex.housing.permissions_info}', size: 9, color: C.title, multi: true})], {style: 9, color: '0x2a5a90', name: 'info_box'}),
    btn(8, 274, 178, 'cancel_button', '${vortex.ui.cancel}', {style: 301, color: '0xd23a2a'}),
    btn(194, 274, 178, 'confirm_button', '${vortex.ui.confirm}', {style: 301, color: '0x2f9e2f'}),
]));

// ---------- preview and decoration tools
write('vortex_housing_preview_xml', frame('vortex_housing_preview_xml', 400, 440, '${vortex.housing.preview}', [
    box(8, 4, 384, 230, [bmp(0, 0, 384, 230, 'arena_11_preview', {name: 'room_image', tags: false, stretch: true}),
        box(8, 8, 170, 28, [bmp(8, 6, 16, 16, S.house, {color: '0xffd890'}), txt(30, 6, 110, 16, {name: 'room_name', size: 11, bold: true, color: C.title}), bmp(146, 6, 16, 16, I.pencil, {color: '0xd8d0e8'})], {style: 9, color: '0x2a2438', name: 'room_chip'})], {style: 102, name: 'preview_box'}),
    txt(10, 242, 300, 14, {caption: '${vortex.housing.selected_object}', size: 10, bold: true, color: C.title}),
    box(8, 260, 184, 104, [
        box(6, 6, 56, 56, [bmp(12, 12, 32, 32, '', {name: 'object_icon', tags: false, zoom: 2})], {name: 'object_box'}),
        txt(70, 8, 108, 16, {name: 'object_name', size: 11, bold: true}),
        txt(70, 28, 108, 14, {name: 'object_category', size: 9, color: C.sub}),
        bmp(70, 46, 16, 16, I.coin, {color: '0xf0c030'}), txt(90, 46, 88, 16, {name: 'object_value', size: 10, bold: true}),
    ], {style: 103, name: 'object_panel'}),
    cont(200, 260, 192, 104, [], {name: 'variant_slot'}),
]));
write('vortex_housing_variant_xml', layout('vortex_housing_variant_xml', 60, 96, cont(0, 0, 60, 96, [
    box(2, 0, 56, 56, [selectedOverlay(56, 56), bmp(12, 12, 32, 32, '', {name: 'variant_icon', tags: false, zoom: 2}), bmp(36, 36, 16, 16, I.lock, {name: 'variant_lock', color: '0xd8a030', hidden: true})], {name: 'variant_box', params: 17, dyn: 'lifted_hover'}),
    txt(0, 60, 60, 30, {name: 'variant_txt', size: 9, color: C.title, align: 'center', multi: true}),
], {name: 'variant'})));

locales('housing', {
    'vortex.housing.title': 'Logements', 'vortex.housing.tab.mine': 'Mes logements', 'vortex.housing.tab.guild': 'Salle de guilde', 'vortex.housing.tab.favorites': 'Favoris', 'vortex.housing.tab.popular': 'Populaires', 'vortex.housing.tab.visit': 'Visiter',
    'vortex.housing.open': 'Ouvrir', 'vortex.housing.manage': 'Gérer', 'vortex.housing.visit': 'Visiter', 'vortex.housing.manage_title': 'Gestion du logement', 'vortex.housing.owner': 'Propriétaire', 'vortex.housing.rename': 'Renommer', 'vortex.housing.description': 'Description',
    'vortex.housing.rooms': 'Pièces', 'vortex.housing.chest': 'Coffre de maison', 'vortex.housing.visitors': 'Visiteurs (jour)', 'vortex.housing.action.permissions': 'Gérer les permissions', 'vortex.housing.action.visitors': 'Liste des visiteurs récents', 'vortex.housing.action.exterior': 'Changer d’apparence extérieure', 'vortex.housing.leave': 'Quitter ce logement',
    'vortex.housing.edit_title': 'Édition', 'vortex.housing.placement': 'Mode placement', 'vortex.housing.placement_desc': 'Placez, déplacez et organisez votre mobilier.', 'vortex.housing.on': 'Actif', 'vortex.housing.off': 'Désactivé',
    'vortex.housing.tool.move': 'Déplacer', 'vortex.housing.tool.rotate': 'Rotation', 'vortex.housing.tool.align': 'Aligner', 'vortex.housing.tool.grid': 'Grille', 'vortex.housing.tool.pick': 'Ramasser', 'vortex.housing.tool.store': 'Stocker', 'vortex.housing.tool.duplicate': 'Dupliquer', 'vortex.housing.tool.delete': 'Supprimer',
    'vortex.housing.show_grid': 'Afficher la grille', 'vortex.housing.snap': 'Alignement automatique', 'vortex.housing.grid_size': 'Taille de grille', 'vortex.housing.save': 'Enregistrer l’agencement',
    'vortex.housing.catalog': 'Catalogue de mobilier', 'vortex.housing.all_categories': 'Toutes les catégories', 'vortex.housing.search': 'Rechercher un objet…',
    'vortex.housing.cat.furniture': 'Mobilier', 'vortex.housing.cat.decoration': 'Décorations', 'vortex.housing.cat.trophies': 'Trophées', 'vortex.housing.cat.crafting': 'Stations de craft', 'vortex.housing.cat.lighting': 'Éclairage', 'vortex.housing.cat.plants': 'Plantes', 'vortex.housing.cat.floors': 'Tapis et revêtements', 'vortex.housing.cat.walls': 'Murs et cloisons', 'vortex.housing.cat.misc': 'Divers',
    'vortex.housing.permissions': 'Gérer les permissions', 'vortex.housing.permissions_desc': 'Définissez qui peut visiter, utiliser et modifier votre logement.', 'vortex.housing.permissions_info': 'Les permissions définissent qui peut entrer et quelles actions sont autorisées dans votre logement.',
    'vortex.housing.who.everyone': 'Visiteurs (tout le monde)', 'vortex.housing.who.friends': 'Amis', 'vortex.housing.who.guild': 'Membres de guilde', 'vortex.housing.who.owners': 'Co-propriétaires', 'vortex.housing.right.visit': 'Visiter uniquement', 'vortex.housing.right.interact': 'Visiter et interagir', 'vortex.housing.right.edit': 'Tout (modifier)',
    'vortex.housing.preview': 'Aperçu et décoration', 'vortex.housing.selected_object': 'Objet sélectionné', 'vortex.housing.variant.normal': 'Normal', 'vortex.housing.variant.preview': 'Aperçu (placement)', 'vortex.housing.variant.locked': 'Verrouillé',
    'vortex.housing.locked': 'Objet verrouillé', 'vortex.housing.locked_desc': 'Non modifiable', 'vortex.housing.delete_confirm': 'Voulez-vous vraiment supprimer cet objet ? Cette action est irréversible.', 'vortex.housing.store_confirm': 'Ranger cet objet dans le coffre de maison ?', 'vortex.housing.store': 'Ranger',
}, {
    'vortex.housing.title': 'Homes', 'vortex.housing.tab.mine': 'My homes', 'vortex.housing.tab.guild': 'Guild hall', 'vortex.housing.tab.favorites': 'Favourites', 'vortex.housing.tab.popular': 'Popular', 'vortex.housing.tab.visit': 'Visit',
    'vortex.housing.open': 'Open', 'vortex.housing.manage': 'Manage', 'vortex.housing.visit': 'Visit', 'vortex.housing.manage_title': 'Home management', 'vortex.housing.owner': 'Owner', 'vortex.housing.rename': 'Rename', 'vortex.housing.description': 'Description',
    'vortex.housing.rooms': 'Rooms', 'vortex.housing.chest': 'Home chest', 'vortex.housing.visitors': 'Visitors (today)', 'vortex.housing.action.permissions': 'Manage permissions', 'vortex.housing.action.visitors': 'Recent visitors', 'vortex.housing.action.exterior': 'Change the exterior', 'vortex.housing.leave': 'Leave this home',
    'vortex.housing.edit_title': 'Editing', 'vortex.housing.placement': 'Placement mode', 'vortex.housing.placement_desc': 'Place, move and arrange your furniture.', 'vortex.housing.on': 'On', 'vortex.housing.off': 'Off',
    'vortex.housing.tool.move': 'Move', 'vortex.housing.tool.rotate': 'Rotate', 'vortex.housing.tool.align': 'Align', 'vortex.housing.tool.grid': 'Grid', 'vortex.housing.tool.pick': 'Pick up', 'vortex.housing.tool.store': 'Store', 'vortex.housing.tool.duplicate': 'Duplicate', 'vortex.housing.tool.delete': 'Delete',
    'vortex.housing.show_grid': 'Show the grid', 'vortex.housing.snap': 'Snap to grid', 'vortex.housing.grid_size': 'Grid size', 'vortex.housing.save': 'Save the layout',
    'vortex.housing.catalog': 'Furniture catalogue', 'vortex.housing.all_categories': 'All categories', 'vortex.housing.search': 'Search an object…',
    'vortex.housing.cat.furniture': 'Furniture', 'vortex.housing.cat.decoration': 'Decorations', 'vortex.housing.cat.trophies': 'Trophies', 'vortex.housing.cat.crafting': 'Crafting stations', 'vortex.housing.cat.lighting': 'Lighting', 'vortex.housing.cat.plants': 'Plants', 'vortex.housing.cat.floors': 'Rugs and floors', 'vortex.housing.cat.walls': 'Walls and partitions', 'vortex.housing.cat.misc': 'Miscellaneous',
    'vortex.housing.permissions': 'Manage permissions', 'vortex.housing.permissions_desc': 'Choose who can visit, use and edit your home.', 'vortex.housing.permissions_info': 'Permissions decide who can enter and which actions are allowed in your home.',
    'vortex.housing.who.everyone': 'Visitors (everyone)', 'vortex.housing.who.friends': 'Friends', 'vortex.housing.who.guild': 'Guild members', 'vortex.housing.who.owners': 'Co-owners', 'vortex.housing.right.visit': 'Visit only', 'vortex.housing.right.interact': 'Visit and interact', 'vortex.housing.right.edit': 'Everything (edit)',
    'vortex.housing.preview': 'Preview and decoration', 'vortex.housing.selected_object': 'Selected object', 'vortex.housing.variant.normal': 'Normal', 'vortex.housing.variant.preview': 'Preview (placing)', 'vortex.housing.variant.locked': 'Locked',
    'vortex.housing.locked': 'Locked object', 'vortex.housing.locked_desc': 'Cannot be edited', 'vortex.housing.delete_confirm': 'Do you really want to delete this object? This cannot be undone.', 'vortex.housing.store_confirm': 'Store this object in the home chest?', 'vortex.housing.store': 'Store',
});
console.log('housing layouts written');
