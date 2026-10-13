// Writes the mounts and pets (companions) layouts from the two sheets: one shared window shape
// (list + detail with stats, affection, actions) and the stable / team, appearances, equipment,
// skills and care tabs. Both windows share the row and card layouts, prefixed `companion_`.
import {bmp, txt, btn, iconBtn, sep, box, cont, list, shape, bar, input, portrait, selectedOverlay, frame, layout, write, locales, I, C} from '../../tools/ui_helpers.mjs';
const M = {
    paw: 'rpg/ui-icons/rpg_stat_pet_paw_animal_handling_tame_beast_mastery_icon', horse: 'rpg/ui-icons/travel_horse_riding_icon', saddle: 'rpg/ui-icons/travel_horseback_riding_saddle_icon', barn: 'rpg/ui-icons/map_markers_building_farmland_barn_icon',
    heart: 'rpg/ui-icons/rpg_stat_hp_health_heart_icon', speed: 'rpg/ui-icons/rpg_stat_dexterity_agility_boots_movement_speed_icon', stamina: 'rpg/ui-icons/software_power_electricity_battery_thunder_lightning_bolt_zap_icon', jump: 'rpg/ui-icons/arrows_pointer_up_north_icon',
    bag: 'rpg/ui-icons/rpg_loot_bag_money_coins_purse_icon', mountain: 'rpg/ui-icons/rpg_difficulty_4_hard_knightly_kite_heater_shield_icon', clock: 'rpg/ui-icons/software_clock_time_wait_1_icon', apple: 'rpg/ui-icons/food_fruit_apple_icon',
    brush: 'rpg/ui-icons/cosmetics_hair_brush_1_icon', bed: 'rpg/ui-icons/travel_backpack_bag_bedroll_icon', happy: 'rpg/ui-icons/emoji_face_happy_icon', fork: 'rpg/ui-icons/food_restaurant_eating_utensils_fork_knife_icon', gear: I.gear ?? 'rpg/ui-icons/software_options_settings_cogwheel_gear_mechanics_icon',
    sparkle: 'rpg/ui-icons/rpg_magic_sparkles_enchantment_icon', shirt: 'rpg/ui-icons/rpg_item_armor_equipment_slot_chest_breastplate_body_icon', banner: 'rpg/ui-icons/map_markers_banner_heraldry_icon', star: I.star, lock: I.lock, plus: I.plus, more: I.more, check: I.check, home: 'rpg/ui-icons/map_markers_building_home_house_icon',
};
const RAR = {common: '0xb8e090', uncommon: '0xc8e8c0', rare: '0xc8dcf4', epic: '0xdcc8f4', legendary: '0xf8e0a0'};

// ---- shared rows / cards
// list row: portrait, name, rarity dot + text, level, « ⋯ » ; selected overlay first
write('vortex_companion_row_xml', layout('vortex_companion_row_xml', 284, 56, box(0, 0, 284, 56, [
    selectedOverlay(284, 56),
    portrait(6, 6, 44, 'head_image'),
    txt(58, 8, 150, 16, {name: 'companion_name', bold: true}),
    shape(58, 31, 9, 9, '0x4cc040', {name: 'rarity_dot', radius: 4, stroke: '0xff444444'}),
    txt(72, 28, 100, 14, {name: 'rarity_txt', size: 10, color: C.sub}),
    txt(190, 28, 56, 14, {name: 'level_txt', size: 10, bold: true, align: 'right'}),
    iconBtn(250, 16, 'more_button', M.more, {w: 26, h: 24}),
    bmp(200, 8, 16, 16, M.lock, {name: 'lock_icon', color: '0x8a94a0', hidden: true}),
], {name: 'companion_row', params: 17, dyn: 'lifted_hover'})));
// stable / team card: portrait, name, level, state pill, « ⋯ », active dot; locked variant via view
write('vortex_companion_card_xml', layout('vortex_companion_card_xml', 128, 128, box(0, 0, 128, 128, [
    selectedOverlay(128, 128),
    box(8, 8, 60, 20, [txt(0, 2, 60, 16, {name: 'state_txt', size: 9, bold: true, color: C.title, align: 'center'})], {name: 'state_pill', style: 6, color: '0x2f7a2f', hidden: true}),
    iconBtn(96, 6, 'more_button', M.more, {w: 26, h: 22}),
    portrait(34, 30, 60, 'head_image'),
    txt(4, 92, 120, 16, {name: 'companion_name', size: 10, bold: true, align: 'center'}),
    txt(4, 108, 120, 14, {name: 'level_txt', size: 9, color: C.sub, align: 'center'}),
    shape(110, 34, 9, 9, '0x4cc040', {name: 'active_dot', radius: 4, stroke: '0xff444444', hidden: true}),
    cont(0, 0, 128, 128, [bmp(56, 36, 16, 16, M.lock, {color: '0x8a94a0', zoom: 2}), txt(4, 76, 120, 14, {name: 'locked_txt', size: 9, color: C.sub, align: 'center'})], {name: 'locked', hidden: true}),
    cont(0, 0, 128, 128, [bmp(56, 44, 16, 16, M.plus, {color: '0x8a94a0', zoom: 2}), txt(4, 84, 120, 14, {caption: '${vortex.companion.free_slot}', size: 9, color: C.sub, align: 'center'})], {name: 'free', hidden: true}),
], {name: 'companion_card', params: 17, dyn: 'lifted_hover'})));
// stat row: icon, label, value
write('vortex_companion_stat_row_xml', layout('vortex_companion_stat_row_xml', 250, 20, cont(0, 0, 250, 20, [
    bmp(2, 2, 16, 16, M.speed, {name: 'stat_icon', color: '0x6a6a72'}),
    txt(24, 2, 140, 16, {name: 'stat_label', size: 10}),
    txt(164, 2, 86, 16, {name: 'stat_value', size: 10, bold: true, color: C.green, align: 'right'}),
], {name: 'stat_row', params: 144})));
// appearance / skill / equipment row: icon box, name, sub (rarity or level), « ⋯ », equipped check
write('vortex_companion_item_row_xml', layout('vortex_companion_item_row_xml', 220, 44, box(0, 0, 220, 44, [
    selectedOverlay(220, 44),
    box(4, 4, 36, 36, [bmp(10, 10, 16, 16, M.sparkle, {name: 'item_icon', color: '0x8a3ad0'})], {name: 'item_box'}),
    txt(48, 6, 130, 16, {name: 'item_name', size: 10, bold: true}),
    shape(48, 27, 9, 9, '0x4cc040', {name: 'rarity_dot', radius: 4, stroke: '0xff444444'}),
    txt(62, 24, 110, 14, {name: 'item_sub', size: 9, color: C.sub}),
    iconBtn(188, 10, 'more_button', M.more, {w: 26, h: 24}),
    bmp(190, 14, 16, 16, M.check, {name: 'equipped_icon', color: '0x40b030', hidden: true}),
], {name: 'item_row', params: 17, dyn: 'lifted_hover'})));

// ---- the window: list on the left (search, two filters, rows, pager), detail on the right
const detail = (kind) => box(300, 0, 570, 500, [
    box(8, 8, 40, 40, [bmp(12, 12, 16, 16, M.sparkle, {name: 'rarity_icon', color: '0x4090e0'})], {name: 'rarity_box'}),
    txt(56, 6, 220, 20, {name: 'companion_name', size: 14, bold: true}),
    box(56, 28, 72, 18, [txt(0, 2, 72, 14, {name: 'rarity_pill_txt', size: 9, bold: true, color: '0x1a4a9a', align: 'center'})], {name: 'rarity_pill', color: RAR.rare}),
    bmp(300, 8, 16, 16, M.star, {color: '0xf0c030'}), txt(322, 8, 240, 14, {name: 'required_level', size: 10}),
    bmp(300, 28, 16, 16, kind === 'mount' ? M.horse : M.paw, {color: '0xb08050'}), txt(322, 28, 240, 14, {name: 'kind_txt', size: 10}),
    txt(8, 52, 284, 46, {name: 'companion_desc', size: 10, color: C.sub, multi: true}),
    // stage with the companion portrait and the appearance thumbnails below
    box(8, 102, 284, 190, [portrait(70, 10, 140, 'stage_image'), iconBtn(6, 156, 'prev_button', I.left, {w: 22, h: 26}), list(34, 154, 216, 32, 'thumb_list', 4, {horizontal: true}), iconBtn(256, 156, 'next_button', I.right, {w: 22, h: 26})], {style: 102, name: 'stage'}),
    // stats
    box(300, 52, 262, 132, [list(6, 6, 250, 120, 'stat_list', 2)], {style: 103, name: 'stats_box'}),
    // affection
    box(300, 190, 262, 58, [
        bmp(8, 8, 16, 16, M.heart, {color: '0xe03a3a'}), txt(30, 8, 120, 14, {caption: '${vortex.companion.affection}', size: 10, bold: true}),
        txt(30, 24, 60, 14, {name: 'affection_level', size: 9, color: C.sub}), txt(150, 24, 104, 14, {name: 'affection_txt', size: 9, color: C.sub, align: 'right'}),
        bar(30, 40, 224, 'affection_bar', 90, '0x2a8fd6', {text: false, stroke: '0xff1a5a90', h: 8}),
    ], {style: 103, name: 'affection_box'}),
    // summon time
    box(300, 254, 262, 28, [bmp(8, 6, 16, 16, M.clock, {color: '0xd8a030'}), txt(30, 7, 140, 14, {caption: '${vortex.companion.summon_time}', size: 10}), txt(170, 7, 84, 14, {name: 'summon_time', size: 10, bold: true, align: 'right'})], {style: 103, name: 'summon_box'}),
    // passive bonuses
    box(300, 288, 262, 68, [txt(8, 6, 240, 14, {caption: '${vortex.companion.passive_bonuses}', size: 10, bold: true, color: C.panelTitle}), list(8, 24, 246, 40, 'bonus_list', 2)], {style: 103, name: 'bonus_box'}),
    // actions
    btn(8, 364, 276, 'primary_button', kind === 'mount' ? '${vortex.mounts.ride}' : '${vortex.pets.summon}', {style: 301, color: '0x2f9e2f', h: 34}),
    btn(292, 364, 270, 'secondary_button', kind === 'mount' ? '${vortex.mounts.summon}' : '${vortex.pets.follow}', {style: 301, color: '0x2a6aa0', h: 34}),
    btn(8, 406, 176, 'rename_button', '${vortex.companion.rename}', {style: 301, color: '0x6a4c9c'}),
    btn(192, 406, 176, 'feed_button', '${vortex.companion.feed}', {style: 301, color: '0xd89a20'}),
    btn(376, 406, 186, 'stable_button', kind === 'mount' ? '${vortex.mounts.send_stable}' : '${vortex.pets.evolve}', {style: 301, color: kind === 'mount' ? '0xd23a2a' : '0x8a3ad0'}),
], {style: 103, name: 'detail'});
const tabCollection = (kind) => layout(`vortex_${kind}s_tab_collection_xml`, 874, 500, cont(0, 0, 874, 500, [
    box(0, 0, 292, 500, [
        box(6, 6, 280, 24, [bmp(4, 4, 16, 16, I.search, {color: '0x888880'}), input(24, 4, 250, 'search_input', kind === 'mount' ? '${vortex.mounts.search}' : '${vortex.pets.search}')], {style: 103, name: 'search_box'}),
        `<dropmenu x="6" y="36" width="136" height="24" params="17" style="3" name="type_menu" caption="\${vortex.companion.all_types}"/>`,
        `<dropmenu x="150" y="36" width="136" height="24" params="17" style="3" name="rarity_menu" caption="\${vortex.ui.all_rarities}"/>`,
        list(4, 66, 284, 400, 'companion_list', 4, {scroll: true}),
        cont(6, 470, 280, 24, [], {name: 'pager_slot'}),
    ], {style: 102, name: 'collection'}),
    detail(kind),
], {name: 'tab_root'}));
write('vortex_mounts_tab_collection_xml', tabCollection('mount'));
write('vortex_pets_tab_collection_xml', tabCollection('pet'));
// stable / team: slots grid + upgrade button
const tabStable = (kind) => layout(`vortex_${kind}s_tab_stable_xml`, 874, 500, cont(0, 0, 874, 500, [
    txt(8, 4, 400, 16, {name: 'slots_title', size: 11, bold: true, color: C.title}),
    box(690, 0, 180, 26, [bmp(6, 5, 16, 16, M.home, {color: C.title}), txt(26, 5, 148, 16, {caption: kind === 'mount' ? '${vortex.mounts.upgrade_stable}' : '${vortex.pets.enlarge}', size: 10, bold: true, color: C.title, align: 'center'})], {name: 'upgrade_button', style: 6, color: '0x2a6aa0', params: 17, dyn: 'button'}),
    box(0, 32, 870, 300, [list(8, 8, 854, 284, 'card_grid', 8, {grid: true})], {style: 102, name: 'slots'}),
    txt(8, 342, 860, 14, {name: 'slots_hint', size: 9, color: C.light}),
], {name: 'tab_root'}));
write('vortex_mounts_tab_stable_xml', tabStable('mount'));
write('vortex_pets_tab_stable_xml', tabStable('pet'));
// appearances: list + preview with equip button
const tabAppearances = (kind) => layout(`vortex_${kind}s_tab_appearances_xml`, 874, 500, cont(0, 0, 874, 500, [
    box(0, 0, 236, 500, [list(6, 6, 224, 488, 'appearance_list', 4, {scroll: true})], {style: 102, name: 'appearances'}),
    box(244, 0, 626, 500, [
        box(8, 8, 40, 40, [bmp(12, 12, 16, 16, M.sparkle, {name: 'rarity_icon', color: '0x4090e0'})], {name: 'rarity_box'}),
        txt(56, 6, 400, 18, {name: 'appearance_name', size: 13, bold: true}),
        box(56, 28, 72, 18, [txt(0, 2, 72, 14, {name: 'rarity_pill_txt', size: 9, bold: true, color: '0x1a4a9a', align: 'center'})], {name: 'rarity_pill', color: RAR.rare}),
        txt(8, 54, 610, 30, {name: 'appearance_desc', size: 10, color: C.sub, multi: true}),
        box(8, 90, 610, 300, [portrait(225, 60, 160, 'stage_image')], {style: 102, name: 'stage'}),
        btn(8, 400, 610, 'equip_button', '${vortex.companion.equipped}', {style: 301, color: '0x2f9e2f'}),
        bmp(8, 440, 16, 16, I.info, {color: '0x2a8fd6'}), txt(30, 440, 588, 30, {caption: '${vortex.companion.appearances_hint}', size: 9, color: C.sub, multi: true}),
    ], {style: 103, name: 'appearance_detail'}),
], {name: 'tab_root'}));
write('vortex_mounts_tab_appearances_xml', tabAppearances('mount'));
write('vortex_pets_tab_appearances_xml', tabAppearances('pet'));
// mounts equipment: slot list + item detail + preview
write('vortex_mounts_tab_equipment_xml', layout('vortex_mounts_tab_equipment_xml', 874, 500, cont(0, 0, 874, 500, [
    box(0, 0, 260, 500, [list(6, 6, 248, 488, 'slot_list', 4)], {style: 102, name: 'equipment'}),
    box(268, 0, 602, 500, [
        box(8, 8, 56, 56, [bmp(12, 12, 32, 32, M.saddle, {name: 'item_icon', color: '0xb08050'})], {name: 'item_box'}),
        txt(72, 10, 300, 18, {name: 'item_name', size: 13, bold: true}),
        shape(72, 33, 9, 9, '0x4cc040', {name: 'rarity_dot', radius: 4, stroke: '0xff444444'}), txt(86, 30, 200, 14, {name: 'rarity_txt', size: 10, color: C.sub}),
        txt(72, 46, 300, 14, {name: 'item_desc', size: 10, color: C.sub}),
        sep(8, 72, 586),
        list(8, 80, 400, 60, 'effect_list', 2),
        btn(8, 150, 186, 'remove_button', '${vortex.companion.remove}', {style: 301, color: '0x2a6aa0'}),
        btn(202, 150, 186, 'change_button', '${vortex.companion.change}', {style: 301, color: '0x6a4c9c'}),
        box(420, 80, 174, 110, [bmp(8, 8, 16, 16, M.coin ?? I.coin, {color: '0xf0c030'}), txt(30, 8, 136, 14, {caption: '${vortex.market.sale_price}', size: 9, color: C.sub}), txt(30, 24, 136, 16, {name: 'price_txt', size: 11, bold: true}), txt(8, 50, 158, 40, {caption: '${vortex.companion.right_click_hint}', size: 9, color: C.sub, multi: true})], {style: 103, name: 'price_box'}),
    ], {style: 103, name: 'item_detail'}),
], {name: 'tab_root'})));
// mounts active: the stable card of the active mount + quick info
write('vortex_mounts_tab_active_xml', layout('vortex_mounts_tab_active_xml', 874, 500, cont(0, 0, 874, 500, [
    txt(8, 4, 400, 16, {caption: '${vortex.mounts.active_title}', size: 11, bold: true, color: C.title}),
    cont(8, 28, 128, 128, [], {name: 'active_card_slot'}),
    box(148, 28, 722, 128, [
        txt(8, 8, 700, 16, {name: 'active_name', size: 12, bold: true}),
        txt(8, 28, 700, 30, {name: 'active_desc', size: 10, color: C.sub, multi: true}),
        bmp(8, 66, 16, 16, M.clock, {color: '0xd8a030'}), txt(30, 66, 200, 14, {name: 'active_summon', size: 10}),
        bmp(240, 66, 16, 16, M.heart, {color: '0xe03a3a'}), txt(262, 66, 200, 14, {name: 'active_affection', size: 10}),
        btn(8, 90, 200, 'dismiss_button', '${vortex.mounts.dismiss}', {style: 301, color: '0xd23a2a', h: 26}),
    ], {style: 103, name: 'active_box'}),
    txt(8, 170, 860, 14, {caption: '${vortex.mounts.shortcut_hint}', size: 9, color: C.light}),
], {name: 'tab_root'})));
// pets skills: list + detail with level up
write('vortex_pets_tab_skills_xml', layout('vortex_pets_tab_skills_xml', 874, 500, cont(0, 0, 874, 500, [
    box(0, 0, 236, 500, [list(6, 6, 224, 488, 'skill_list', 4, {scroll: true})], {style: 102, name: 'skills'}),
    box(244, 0, 626, 500, [
        box(8, 8, 48, 48, [bmp(16, 16, 16, 16, M.bag, {name: 'skill_icon', color: '0xd8a060'})], {name: 'skill_box'}),
        txt(64, 8, 400, 18, {name: 'skill_name', size: 13, bold: true}),
        txt(64, 28, 400, 14, {name: 'skill_level', size: 10, color: C.sub}),
        txt(8, 64, 610, 30, {name: 'skill_desc', size: 10, color: C.sub, multi: true}),
        box(8, 100, 300, 50, [txt(8, 6, 284, 14, {caption: '${vortex.companion.current_level}', size: 10, bold: true, color: C.panelTitle}), txt(8, 24, 284, 20, {name: 'current_effect', size: 10, multi: true})], {style: 102, name: 'current_box'}),
        box(318, 100, 300, 50, [txt(8, 6, 284, 14, {caption: '${vortex.companion.next_level}', size: 10, bold: true, color: C.green}), txt(8, 24, 284, 20, {name: 'next_effect', size: 10, multi: true})], {style: 102, name: 'next_box'}),
        bmp(8, 162, 16, 16, M.clock, {color: '0xd8a030'}), txt(30, 162, 280, 14, {name: 'cooldown_txt', size: 10}),
        bmp(8, 182, 16, 16, M.stamina, {color: '0x4090e0'}), txt(30, 182, 280, 14, {name: 'cost_txt', size: 10}),
        btn(318, 162, 300, 'upgrade_button', '${vortex.skill.upgrade.bare}', {style: 301, color: '0x2a6aa0', h: 34}),
    ], {style: 103, name: 'skill_detail'}),
], {name: 'tab_root'})));
// pets care: needs bars + food grid + food detail + actions
const need = (y, name, uri, c, label) => [bmp(8, y, 16, 16, uri, {color: c}), txt(30, y - 1, 90, 14, {caption: label, size: 10}), txt(200, y - 1, 60, 14, {name: `${name}_txt`, size: 10, bold: true, align: 'right'}), bar(30, y + 15, 230, `${name}_bar`, 140, c, {text: false, h: 8})];
write('vortex_pets_tab_care_xml', layout('vortex_pets_tab_care_xml', 874, 500, cont(0, 0, 874, 500, [
    box(0, 0, 280, 500, [
        portrait(70, 8, 140, 'stage_image'),
        box(8, 156, 262, 26, [bmp(8, 5, 16, 16, M.heart, {color: '0xe03a3a'}), txt(30, 6, 100, 14, {name: 'affection_level', size: 10, bold: true}), txt(140, 6, 114, 14, {name: 'affection_txt', size: 10, align: 'right'})], {style: 103, name: 'affection_box'}),
        txt(8, 190, 262, 30, {name: 'state_txt', size: 10, bold: true, color: C.green, align: 'center', multi: true}),
    ], {style: 102, name: 'pet_box'}),
    box(288, 0, 290, 160, [
        ...need(10, 'hunger', M.fork, '0xd89a20', '${vortex.pets.hunger}'),
        ...need(48, 'mood', M.happy, '0xf0c030', '${vortex.pets.mood}'),
        ...need(86, 'energy', M.stamina, '0x4090e0', '${vortex.pets.energy}'),
        ...need(124, 'affection', M.heart, '0xe03a3a', '${vortex.companion.affection}'),
    ], {style: 103, name: 'needs_box'}),
    box(288, 168, 290, 240, [txt(8, 6, 274, 14, {name: 'food_title', size: 10, bold: true, color: C.panelTitle}), list(6, 26, 278, 208, 'food_grid', 6, {grid: true})], {style: 103, name: 'food_box'}),
    box(586, 0, 284, 408, [
        box(8, 8, 48, 48, [bmp(8, 8, 32, 32, M.apple, {name: 'food_icon', color: '0xd23a2a'})], {name: 'food_icon_box'}),
        txt(64, 10, 210, 16, {name: 'food_name', size: 12, bold: true}),
        shape(64, 33, 9, 9, '0x4cc040', {name: 'rarity_dot', radius: 4, stroke: '0xff444444'}), txt(78, 30, 190, 14, {name: 'rarity_txt', size: 10, color: C.sub}),
        txt(8, 64, 268, 44, {name: 'food_desc', size: 10, color: C.sub, multi: true}),
        sep(8, 112, 268),
        list(8, 120, 268, 60, 'food_effect_list', 2),
        bmp(8, 190, 16, 16, I.coin, {color: '0xf0c030'}), txt(30, 190, 100, 14, {caption: '${vortex.market.sale_price}', size: 9, color: C.sub}), txt(130, 190, 146, 14, {name: 'price_txt', size: 10, bold: true, align: 'right'}),
    ], {style: 103, name: 'food_detail'}),
    btn(288, 420, 136, 'feed_button', '${vortex.companion.feed}', {style: 301, color: '0x2f9e2f', h: 32}),
    btn(432, 420, 136, 'play_button', '${vortex.pets.play}', {style: 301, color: '0x2a6aa0', h: 32}),
    btn(586, 420, 136, 'brush_button', '${vortex.pets.brush}', {style: 301, color: '0xd89a20', h: 32}),
    btn(730, 420, 140, 'rest_button', '${vortex.pets.rest}', {style: 301, color: '0xd23a2a', h: 32}),
], {name: 'tab_root'})));
// pets active: same shape as the mount one
write('vortex_pets_tab_active_xml', layout('vortex_pets_tab_active_xml', 874, 500, cont(0, 0, 874, 500, [
    txt(8, 4, 400, 16, {caption: '${vortex.pets.active_title}', size: 11, bold: true, color: C.title}),
    cont(8, 28, 128, 128, [], {name: 'active_card_slot'}),
    box(148, 28, 722, 128, [
        txt(8, 8, 700, 16, {name: 'active_name', size: 12, bold: true}),
        txt(8, 28, 700, 30, {name: 'active_desc', size: 10, color: C.sub, multi: true}),
        bmp(8, 66, 16, 16, M.clock, {color: '0xd8a030'}), txt(30, 66, 200, 14, {name: 'active_summon', size: 10}),
        bmp(240, 66, 16, 16, M.heart, {color: '0xe03a3a'}), txt(262, 66, 200, 14, {name: 'active_affection', size: 10}),
        btn(8, 90, 200, 'dismiss_button', '${vortex.pets.dismiss}', {style: 301, color: '0xd23a2a', h: 26}),
    ], {style: 103, name: 'active_box'}),
    txt(8, 170, 860, 14, {caption: '${vortex.pets.shortcut_hint}', size: 9, color: C.light}),
], {name: 'tab_root'})));
const tabs = (prefix, items) => `<tab_context x="6" y="2" width="860" height="32" params="17" style="3" name="tab_context">
  <children>
${items.map(([n, key], i) => `    <tab_button x="${i * 130}" y="0" width="130" height="32" params="17" style="3" name="tab_${n}" caption="\${${key}}" id="${i + 1}"/>`).join('\n')}
  </children>
</tab_context>`;
write('vortex_mounts_xml', frame('vortex_mounts_xml', 880, 580, '${vortex.mounts.title}', [
    tabs('mounts', [['collection', 'vortex.companion.tab.collection'], ['active', 'vortex.companion.tab.active'], ['stable', 'vortex.mounts.tab.stable'], ['appearances', 'vortex.companion.tab.appearances'], ['equipment', 'vortex.ui.equipment']]),
    iconBtn(838, 4, 'settings_button', M.gear, {w: 28, h: 26}),
    cont(0, 40, 874, 500, [], {name: 'tab_content'}),
]));
write('vortex_pets_xml', frame('vortex_pets_xml', 880, 580, '${vortex.pets.title}', [
    tabs('pets', [['collection', 'vortex.companion.tab.collection'], ['active', 'vortex.companion.tab.active'], ['stable', 'vortex.pets.tab.team'], ['skills', 'vortex.pets.tab.skills'], ['care', 'vortex.pets.tab.care'], ['appearances', 'vortex.companion.tab.appearances']]),
    cont(0, 40, 874, 500, [], {name: 'tab_content'}),
]));
locales('mounts', {
    'vortex.mounts.title': 'Montures', 'vortex.mounts.tab.stable': 'Écurie', 'vortex.mounts.search': 'Rechercher une monture...', 'vortex.mounts.ride': 'Monter', 'vortex.mounts.summon': 'Invoquer', 'vortex.mounts.send_stable': 'Envoyer à l’écurie', 'vortex.mounts.upgrade_stable': 'Améliorer l’écurie',
    'vortex.mounts.stable_slots': 'Emplacements dans l’écurie (%used%/%max%)', 'vortex.mounts.stable_required': 'Écurie niv. %level% requis', 'vortex.mounts.active_title': 'Monture active', 'vortex.mounts.dismiss': 'Renvoyer la monture', 'vortex.mounts.shortcut_hint': 'Raccourci d’invocation : touche F2.',
    'vortex.mounts.kind.ground': 'Monture terrestre', 'vortex.mounts.kind.flying': 'Monture volante', 'vortex.mounts.kind.water': 'Monture aquatique', 'vortex.mounts.stat.speed': 'Vitesse de déplacement', 'vortex.mounts.stat.stamina': 'Endurance', 'vortex.mounts.stat.jump': 'Saut', 'vortex.mounts.stat.capacity': 'Capacité de transport', 'vortex.mounts.stat.terrain': 'Bonus de terrain',
    'vortex.mounts.slot.saddle': 'Selle', 'vortex.mounts.slot.armor': 'Armure', 'vortex.mounts.slot.emblem': 'Emblème', 'vortex.mounts.slot.cosmetic': 'Cosmétique', 'vortex.mounts.slot.empty': 'Aucun objet équipé', 'vortex.mounts.release': 'Relâcher la monture', 'vortex.mounts.remove_stable': 'Retirer de l’écurie',
}, {
    'vortex.mounts.title': 'Mounts', 'vortex.mounts.tab.stable': 'Stable', 'vortex.mounts.search': 'Search a mount...', 'vortex.mounts.ride': 'Ride', 'vortex.mounts.summon': 'Summon', 'vortex.mounts.send_stable': 'Send to the stable', 'vortex.mounts.upgrade_stable': 'Upgrade the stable',
    'vortex.mounts.stable_slots': 'Stable slots (%used%/%max%)', 'vortex.mounts.stable_required': 'Stable lvl %level% required', 'vortex.mounts.active_title': 'Active mount', 'vortex.mounts.dismiss': 'Dismiss the mount', 'vortex.mounts.shortcut_hint': 'Summon shortcut: F2 key.',
    'vortex.mounts.kind.ground': 'Ground mount', 'vortex.mounts.kind.flying': 'Flying mount', 'vortex.mounts.kind.water': 'Water mount', 'vortex.mounts.stat.speed': 'Movement speed', 'vortex.mounts.stat.stamina': 'Stamina', 'vortex.mounts.stat.jump': 'Jump', 'vortex.mounts.stat.capacity': 'Carrying capacity', 'vortex.mounts.stat.terrain': 'Terrain bonus',
    'vortex.mounts.slot.saddle': 'Saddle', 'vortex.mounts.slot.armor': 'Armor', 'vortex.mounts.slot.emblem': 'Emblem', 'vortex.mounts.slot.cosmetic': 'Cosmetic', 'vortex.mounts.slot.empty': 'No item equipped', 'vortex.mounts.release': 'Release the mount', 'vortex.mounts.remove_stable': 'Remove from the stable',
});
locales('pets', {
    'vortex.pets.title': 'Compagnons', 'vortex.pets.tab.team': 'Équipe', 'vortex.pets.tab.skills': 'Compétences', 'vortex.pets.tab.care': 'Soins', 'vortex.pets.search': 'Rechercher un compagnon...', 'vortex.pets.summon': 'Invoquer', 'vortex.pets.follow': 'Suivre', 'vortex.pets.evolve': 'Faire évoluer', 'vortex.pets.enlarge': 'Agrandir l’enclos',
    'vortex.pets.team_slots': 'Emplacements d’équipe (%used%/%max%)', 'vortex.pets.unlock_slot': 'Débloquer un emplacement', 'vortex.pets.level_required': 'Niv. %level% requis', 'vortex.pets.active_title': 'Compagnon actif', 'vortex.pets.dismiss': 'Renvoyer le compagnon', 'vortex.pets.shortcut_hint': 'Raccourci d’invocation : touche F1.',
    'vortex.pets.role.support': 'Compagnon de soutien', 'vortex.pets.role.tank': 'Tank', 'vortex.pets.role.dps': 'DPS', 'vortex.pets.role.utility': 'Utilitaire', 'vortex.pets.stat.hp': 'PV bonus', 'vortex.pets.stat.energy': 'Énergie', 'vortex.pets.stat.capacity': 'Capacité de transport', 'vortex.pets.stat.aura': 'Zone d’effet des auras',
    'vortex.pets.hunger': 'Faim', 'vortex.pets.mood': 'Humeur', 'vortex.pets.energy': 'Énergie', 'vortex.pets.play': 'Jouer', 'vortex.pets.brush': 'Brosser', 'vortex.pets.rest': 'Envoyer au repos', 'vortex.pets.happy': 'Compagnon heureux et en bonne santé !', 'vortex.pets.food_available': 'Nourriture disponible (%count%)',
    'vortex.pets.state.active': 'Actif', 'vortex.pets.state.rest': 'Repos', 'vortex.pets.state.locked': 'Verrouillé', 'vortex.pets.set_active': 'Définir comme actif', 'vortex.pets.remove_team': 'Retirer de l’équipe', 'vortex.pets.release': 'Relâcher le compagnon', 'vortex.pets.active_skill': 'Compétence active',
}, {
    'vortex.pets.title': 'Companions', 'vortex.pets.tab.team': 'Team', 'vortex.pets.tab.skills': 'Skills', 'vortex.pets.tab.care': 'Care', 'vortex.pets.search': 'Search a companion...', 'vortex.pets.summon': 'Summon', 'vortex.pets.follow': 'Follow', 'vortex.pets.evolve': 'Evolve', 'vortex.pets.enlarge': 'Enlarge the pen',
    'vortex.pets.team_slots': 'Team slots (%used%/%max%)', 'vortex.pets.unlock_slot': 'Unlock a slot', 'vortex.pets.level_required': 'Lvl %level% required', 'vortex.pets.active_title': 'Active companion', 'vortex.pets.dismiss': 'Dismiss the companion', 'vortex.pets.shortcut_hint': 'Summon shortcut: F1 key.',
    'vortex.pets.role.support': 'Support companion', 'vortex.pets.role.tank': 'Tank', 'vortex.pets.role.dps': 'DPS', 'vortex.pets.role.utility': 'Utility', 'vortex.pets.stat.hp': 'Bonus HP', 'vortex.pets.stat.energy': 'Energy', 'vortex.pets.stat.capacity': 'Carrying capacity', 'vortex.pets.stat.aura': 'Aura range',
    'vortex.pets.hunger': 'Hunger', 'vortex.pets.mood': 'Mood', 'vortex.pets.energy': 'Energy', 'vortex.pets.play': 'Play', 'vortex.pets.brush': 'Brush', 'vortex.pets.rest': 'Send to rest', 'vortex.pets.happy': 'Happy and healthy companion!', 'vortex.pets.food_available': 'Available food (%count%)',
    'vortex.pets.state.active': 'Active', 'vortex.pets.state.rest': 'Rest', 'vortex.pets.state.locked': 'Locked', 'vortex.pets.set_active': 'Set as active', 'vortex.pets.remove_team': 'Remove from the team', 'vortex.pets.release': 'Release the companion', 'vortex.pets.active_skill': 'Active skill',
});
locales('rpg-common', {
    'vortex.companion.tab.collection': 'Collection', 'vortex.companion.tab.active': 'Active', 'vortex.companion.tab.appearances': 'Apparences', 'vortex.companion.all_types': 'Tous les types', 'vortex.companion.free_slot': 'Emplacement libre', 'vortex.companion.affection': 'Lien d’affection', 'vortex.companion.summon_time': 'Temps d’invocation',
    'vortex.companion.passive_bonuses': 'Bonus passifs', 'vortex.companion.rename': 'Renommer', 'vortex.companion.feed': 'Nourrir', 'vortex.companion.equipped': 'Équipée', 'vortex.companion.equip': 'Équiper', 'vortex.companion.appearances_hint': 'Certaines apparences peuvent être obtenues via des quêtes, événements ou la boutique.',
    'vortex.companion.remove': 'Retirer', 'vortex.companion.change': 'Changer', 'vortex.companion.right_click_hint': 'Clic droit pour plus d’options.', 'vortex.companion.current_level': 'Niveau actuel :', 'vortex.companion.next_level': 'Niveau suivant :', 'vortex.companion.required_level': 'Niveau requis : %level%',
    'vortex.companion.see_details': 'Voir les détails', 'vortex.companion.set_active': 'Définir comme active',
}, {
    'vortex.companion.tab.collection': 'Collection', 'vortex.companion.tab.active': 'Active', 'vortex.companion.tab.appearances': 'Appearances', 'vortex.companion.all_types': 'All types', 'vortex.companion.free_slot': 'Free slot', 'vortex.companion.affection': 'Affection bond', 'vortex.companion.summon_time': 'Summon time',
    'vortex.companion.passive_bonuses': 'Passive bonuses', 'vortex.companion.rename': 'Rename', 'vortex.companion.feed': 'Feed', 'vortex.companion.equipped': 'Equipped', 'vortex.companion.equip': 'Equip', 'vortex.companion.appearances_hint': 'Some appearances come from quests, events or the shop.',
    'vortex.companion.remove': 'Remove', 'vortex.companion.change': 'Change', 'vortex.companion.right_click_hint': 'Right click for more options.', 'vortex.companion.current_level': 'Current level:', 'vortex.companion.next_level': 'Next level:', 'vortex.companion.required_level': 'Required level: %level%',
    'vortex.companion.see_details': 'See details', 'vortex.companion.set_active': 'Set as active',
});
console.log('companion layouts written');
