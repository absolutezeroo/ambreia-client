// Fills the housing boards (states_housing.xml, states_parts.xml). Furniture pictures are the dungeon props
// until the furniture icons exist.
const at = (name) => find(root, name);
const U = 'rpg/ui-icons/';
const K = {
    house: U + 'map_markers_building_home_house_icon', users: U + 'travel_person_people_two_icon', group: U + 'travel_person_people_three_icon', crown: U + 'hats_crown_king_monarch_ruler_emperor_icon', shield: U + 'map_markers_banner_heraldry_icon',
    scroll: U + 'tools_crafting_writing_parchment_scroll_document_icon', move: U + 'arrows_movement_cursor_drag_orthogonal_icon', rotate: U + 'arrows_reload_refresh_rotate_clockwise_icon', align: U + 'software_options_settings_sliders_knobs_audio_icon',
    grid: U + 'boardgames_card_draw_hand_icon', hand: U + 'emoji_hand_wave_cursor_pan_open_icon', store: U + 'software_package_box_crate_archive_closed_sealed_icon', copy: U + 'software_clipbaord_list_file_copy_paste_icon', trash: U + 'software_trashcan_garbage_bin_rubbish_delete_erase_1_icon',
    trophy: U + 'sports_winner_award_cup_achievement_trophy_icon', hammer: U + 'rpg_item_weapon_hammer_mace_crushing_damage_icon', lamp: U + 'rpg_item_lantern_lamp_light_icon', plant: U + 'tools_crafting_farming_plant_crop_icon', painting: U + 'tools_crafting_painting_canvas_art_exhibition_icon',
    wall: U + 'map_markers_building_stone_wall_fortification_icon', crate: U + 'tools_crafting_box_crate_shipping_icon', candle: U + 'tools_crafting_wax_candle_flame_lighting_holder_icon', heart: U + 'rpg_stat_hp_health_heart_icon', help: U + 'software_warning_sign_circle_question_mark_help_icon',
};
const FURNI = (i) => `rpg/dungeon-objects/icon_${String(i).padStart(2, '0')}`;
const CATALOG = [50, 23, 24, 25, 20, 21, 34, 35, 49, 56, 8, 9, 55, 42, 43, 36, 30, 51, 63, 59];

// 1. navigator, catalogue
place(at('navigator'), 'vortex_housing_xml', 0, 0, (w) => {
    tab(w, 'tab_mine');
    for(const [n, type, place_, users, rating, own, fav] of [['Ma maison d’Ambre', 'Maison de ville (Petite)', 'Quartier des Artisans', '1/10', '12', true], ['Chalet du Lac', 'Chalet (Moyenne)', 'Rives d’Ambre', '0/12', '38', false, true], ['Salle des Veilleurs', 'Grande salle (Grande)', 'Cité d’Ambre', '8/50', '124', false, true], ['Tour de l’Aube', 'Tour (Grande)', 'Quartier des Mages', '2/20', '91', false, false]])
        add(find(w, 'room_list'), 'vortex_housing_room_row_xml', (r) => {
            text(r, 'room_name', n); text(r, 'room_type', type); text(r, 'room_place', place_); text(r, 'users_txt', users); text(r, 'rating_txt', rating);
            if(!own) { show(r, 'open_button', false); show(r, 'manage_button', false); show(r, 'visit_button'); show(r, 'favorite_button'); tint(find(r, 'favorite_button'), 'favorite_button_icon', fav ? 0xd23a2a : 0x8a94a0); }
        });
});
place(at('catalog'), 'vortex_housing_catalog_xml', 0, 0, (w) => {
    [['furniture', K.house, 0xb07840], ['decoration', K.painting, 0x8a6ab0], ['trophies', K.trophy, 0xf0c030], ['crafting', K.hammer, 0x8a94a0], ['lighting', K.lamp, 0xf0c030], ['plants', K.plant, 0x40a040], ['floors', K.crate, 0xb07840], ['walls', K.wall, 0x8a94a0], ['misc', K.store, 0xb07840]]
        .forEach(([k, uri, c]) => add(find(w, 'category_list'), 'vortex_housing_category_row_xml', (r) => { text(r, 'category_name', `\${vortex.housing.cat.${k}}`); icon(r, 'category_icon', uri); tint(r, 'category_icon', c); show(r, 'selected', k === 'furniture'); }));
    CATALOG.forEach((n, i) => add(find(w, 'item_grid'), 'vortex_inventory_item_slot_xml', (s) => { icon(s, 'item_icon', FURNI(n)); text(s, 'item_count', ''); show(s, 'selected', i === 0); }));
    text(w, 'page_txt', '1 / 4');
});

// 2. manage, preview, placement
place(at('manage'), 'vortex_housing_manage_xml', 0, 0, (w) => {
    text(w, 'room_name', 'Ma maison d’Ambre'); text(w, 'room_type', 'Maison de ville (Petite)'); text(w, 'room_place', 'Quartier des Artisans');
    text(w, 'owner_name', 'Intendant'); text(w, 'owner_role', 'PNJ · Services'); text(w, 'description_txt', 'Un petit chez-moi confortable au cœur de la ville. Bienvenue aux amis !');
    text(w, 'rooms_txt', '3 / 4'); text(w, 'chest_txt', '12 / 50'); text(w, 'visitors_txt', '4');
    [['permissions', K.users, 0x5a4a7a], ['visitors', K.scroll, 0xb07840], ['exterior', K.house, 0xd8a060]].forEach(([k, uri, c]) => add(find(w, 'action_list'), 'vortex_housing_action_row_xml', (r) => { text(r, 'action_txt', `\${vortex.housing.action.${k}}`); icon(r, 'action_icon', uri); tint(r, 'action_icon', c); }));
});
place(at('preview'), 'vortex_housing_preview_xml', 0, 0, (w) => {
    text(w, 'room_name', 'Salon principal'); icon(w, 'object_icon', FURNI(50)); text(w, 'object_name', 'Table du conseil'); text(w, 'object_category', 'Catégorie : Mobilier'); text(w, 'object_value', '250');
    [['normal', 0xffffff, false, false], ['preview', 0x80e0a0, true, false], ['locked', 0x9a9a9a, false, true]].forEach(([k, c, sel, lock], i) => place(find(w, 'variant_slot'), 'vortex_housing_variant_xml', i * 64, 0, (v) => { icon(v, 'variant_icon', FURNI(50)); tint(v, 'variant_icon', c); show(v, 'selected', sel); show(v, 'variant_lock', lock); text(v, 'variant_txt', `\${vortex.housing.variant.${k}}`); }));
});
place(at('edit'), 'vortex_housing_edit_xml', 0, 0, (w) => {
    let x = 0; [['${vortex.housing.on}', true], ['${vortex.housing.off}', false]].forEach(([t, on]) => { place(find(w, 'mode_switch'), 'vortex_hud_chip_xml', x, 0, (c) => { c.width = 72; find(c, 'chip_txt').width = 72; text(c, 'chip_txt', t); if(on) tint(c, null, 0x2a6aa0); }); x += 78; });
    [['move', K.move], ['rotate', K.rotate], ['align', K.align], ['grid', K.grid], ['pick', K.hand], ['store', K.store], ['duplicate', K.copy], ['delete', K.trash]].forEach(([k, uri], i) => place(find(w, 'tool_grid'), 'vortex_housing_tool_xml', (i % 4) * 93, Math.floor(i / 4) * 72, (t) => {
        text(t, 'tool_txt', `\${vortex.housing.tool.${k}}`); icon(t, 'tool_icon', uri); show(t, 'selected', k === 'move');
        if(k === 'delete') { tint(t, null, 0xd23a2a); tcolor(t, 'tool_txt', 0xffffff); tint(t, 'tool_icon', 0xffffff); }
    }));
    for(const n of ['grid_check', 'snap_check']) { const c = find(w, n); if(c && c.select) c.select(); }
});

// parts board
place(at('permissions'), 'vortex_housing_permissions_xml', 0, 0, (w) => {
    [['everyone', K.users, 0xd8a030, 'visit'], ['friends', K.heart, 0xd23a2a, 'interact'], ['guild', K.shield, 0x2a6aa0, 'interact'], ['owners', K.crown, 0xf0c030, 'edit']].forEach(([k, uri, c, right]) => add(find(w, 'permission_list'), 'vortex_housing_permission_row_xml', (r) => { text(r, 'who_txt', `\${vortex.housing.who.${k}}`); icon(r, 'who_icon', uri); tint(r, 'who_icon', c); text(r, 'right_menu', `\${vortex.housing.right.${right}}`); }));
});
if(at('tabs')) ['Normal', 'Survol', 'Sélectionné'].forEach((t, i) => place(at('tabs'), 'vortex_housing_tool_xml', i * 93, i === 1 ? 0 : 2, (x) => { text(x, 'tool_txt', t); icon(x, 'tool_icon', K.house); tint(x, 'tool_icon', 0xd8a060); show(x, 'selected', i === 2); }));
if(at('slots')) [true, false].forEach((sel, i) => place(at('slots'), 'vortex_inventory_item_slot_xml', i * 70, 0, (s) => { icon(s, 'item_icon', FURNI(50)); text(s, 'item_count', ''); show(s, 'selected', sel); }));
place(at('locked'), 'vortex_inventory_item_slot_xml', 0, 0, (s) => { icon(s, 'item_icon', FURNI(24)); tint(s, 'item_icon', 0x9a9a9a); text(s, 'item_count', ''); show(s, 'lock_icon'); });
place(at('tip'), 'vortex_inventory_tip_xml', 0, 0, (t) => { icon(t, 'tip_icon', K.plant); tint(t, 'tip_icon', 0x40a040); text(t, 'tip_name', 'Fougère d’Ambre'); text(t, 'tip_kind', 'Décoration'); text(t, 'tip_rarity', ''); text(t, 'tip_desc', 'Une plante luxuriante qui apporte une touche de vie à votre intérieur.'); text(t, 'tip_quantity', 'Valeur : 35'); });
place(at('confirm_delete'), 'vortex_ui_confirm_xml', 0, 0, (c) => { c.caption = 'Supprimer l’objet'; text(c, 'message', '${vortex.housing.delete_confirm}'); text(c, 'confirm_button', '${vortex.housing.tool.delete}'); tint(c, 'confirm_button', 0xd23a2a); });
place(at('confirm_store'), 'vortex_ui_confirm_xml', 0, 0, (c) => { c.caption = 'Ranger l’objet'; text(c, 'message', '${vortex.housing.store_confirm}'); icon(c, 'confirm_icon', K.help); text(c, 'confirm_button', '${vortex.housing.store}'); });
