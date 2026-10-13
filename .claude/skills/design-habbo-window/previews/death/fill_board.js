// Fills the "États – Mort et progression" board (states_death.xml).
const at = (name) => find(root, name);
const I = {
    temple: 'rpg/ui-icons/map_markers_building_church_faith_temple_icon', tent: 'rpg/ui-icons/map_markers_building_tent_campsite_icon', door: 'rpg/ui-icons/map_markers_doorway_enterance_exit_open_icon', house: 'rpg/ui-icons/map_markers_building_home_house_icon',
    tree: 'rpg/ui-icons/map_markers_tree_forest_pine_icon', warn: 'rpg/ui-icons/software_warning_sign_triangle_exclaimation_mark_error_icon', skull: 'rpg/ui-icons/rpg_skull_death_dead_small_icon',
    hp: 'rpg/ui-icons/rpg_stat_hp_health_heart_icon', mana: 'rpg/ui-icons/rpg_gem_jewelcrafting_diamond_points_currency_icon', fist: 'rpg/ui-icons/rpg_stat_strength_fist_melee_attack_icon', int: 'rpg/ui-icons/boardgames_card_star_icon', end: 'rpg/ui-icons/rpg_difficulty_3_medium_buckler_targe_shield_icon',
    plus: 'rpg/ui-icons/software_signs_maths_plus_addition_bonus_add_new_icon', book: 'rpg/ui-icons/tools_crafting_books_manual_codex_instructions_tutorial_documentation_icon', scroll: 'rpg/ui-icons/tools_crafting_writing_parchment_scroll_document_icon',
    sword: 'rpg/ui-icons/rpg_item_weapon_sword_attack_melee_slashing_damage_icon', speed: 'rpg/ui-icons/rpg_skill_dash_dodge_movement_speed_run_sprint_icon', armor: 'rpg/ui-icons/rpg_item_armor_equipment_slot_chest_breastplate_body_icon',
};
const statRow = (list, label, value, uri, c, {width = 246} = {}) => add(list, 'vortex_inventory_compare_row_xml', (r) => { text(r, 'stat_name', label); text(r, 'stat_value', ''); text(r, 'stat_delta', value); icon(r, 'stat_icon', uri); tint(r, 'stat_icon', c); r.width = width; const n = find(r, 'stat_name'); n.width = width - 80; const d = find(r, 'stat_delta'); d.x = width - 50; d.width = 50; });

place(at('death'), 'vortex_death_xml', 0, 0, (d) => { text(d, 'level_txt', 'Niveau 18'); text(d, 'class_txt', 'Aventurier'); text(d, 'death_desc', 'Vous avez été vaincu. Réapparaissez au sanctuaire ou attendez qu’un allié vous ressuscite.'); text(d, 'respawn_timer', 'Réapparition possible dans 2 min 35 s'); });
place(at('resurrect'), 'vortex_resurrect_xml', 0, 0, (r) => { text(r, 'caster_name', 'Léa'); text(r, 'caster_level', 'Niveau 20 — Prêtresse'); text(r, 'message', 'Léa veut utiliser un sort de résurrection pour vous ramener à la vie ici. Acceptez-vous ?'); text(r, 'expire_txt', 'Cette proposition expire dans 18 s'); bar(r, 'expire_bar', 240); });
place(at('respawn'), 'vortex_respawn_xml', 0, 0, (w) => {
    const list = find(w, 'respawn_list');
    for(const [name, region, zone, zc, zi, cost, pi, selected] of [
        ['Sanctuaire d’Ambreia', 'Ville principale', 'Zone sûre', 0x2f9e2f, I.tree, 'Gratuit', I.temple, true],
        ['Relais des Voyageurs', 'Route du Nord', 'Zone sûre', 0x2f9e2f, I.tree, '25', I.house, false],
        ['Camp des Explorateurs', 'Forêt de Sombrebois', 'Zone peu sûre', 0xd08020, I.warn, '50', I.tent, false],
        ['Dernier point visité', 'Antre des Kharzogs', 'Zone dangereuse', 0xd23a2a, I.skull, '100', I.door, false],
    ]) add(list, 'vortex_respawn_row_xml', (r) => { text(r, 'place_name', name); text(r, 'place_region', region); text(r, 'zone_txt', zone); tcolor(r, 'zone_txt', zc); icon(r, 'zone_icon', zi); tint(r, 'zone_icon', zc); text(r, 'cost_txt', cost); icon(r, 'place_icon', pi); show(r, 'selected', selected); const rb = find(r, 'radio'); if(rb && 'isSelected' in rb) rb.isSelected = selected; if(cost === 'Gratuit') { show(r, 'cost_icon', false); const c = find(r, 'cost_txt'); c.x = 212; c.width = 80; } });
});
place(at('wipe'), 'vortex_wipe_xml', 0, 0);
place(at('levelup'), 'vortex_levelup_xml', 0, 0, (l) => {
    text(l, 'level_title', 'Niveau 20 !');
    const st = find(l, 'stat_list');
    for(const [a, b, uri, c] of [['PV maximum', '+30', I.hp, 0xe03a3a], ['Mana maximum', '+20', I.mana, 0x4090e0], ['Force', '+2', I.fist, 0xe09a60], ['Intelligence', '+2', I.int, 0x40b0e0], ['Endurance', '+2', I.end, 0x8a94a0]]) statRow(st, a, b, uri, c);
    const ul = find(l, 'unlock_list');
    for(const [t, uri, c] of [['1 emplacement de compétence', I.plus, 0x2a8fd6], ['Sorts de niveau 2', I.book, 0x8a3ad0], ['Nouvelles quêtes disponibles', I.scroll, 0xd8a060]]) add(ul, 'vortex_unlock_row_xml', (r) => { text(r, 'unlock_txt', t); icon(r, 'unlock_icon', uri); tint(r, 'unlock_icon', c); r.width = 126; find(r, 'unlock_txt').width = 82; });
});
place(at('summary'), 'vortex_quest_summary_xml', 0, 0, (s) => {
    text(s, 'summary_sub', 'Les Bois d’Ambre sont à nouveau en sécurité.'); text(s, 'xp_value', '3 500'); text(s, 'gold_value', '250'); text(s, 'reputation_label', 'Réputation : Garde d’Ambreia'); text(s, 'reputation_value', '+250');
    const il = find(s, 'item_list');
    for(const [uri, n] of [['rpg/plants-crops/icon_02', '3'], ['rpg/consumables-potions/icon_00', '2'], ['rpg/gems-materials/icon_00', '1'], ['rpg/materials/icon_00', '5'], ['rpg/dungeon-objects/icon_02', '1']]) add(il, 'vortex_inventory_item_slot_xml', (c) => { icon(c, 'item_icon', uri); text(c, 'item_count', n); });
});
place(at('reward_choice'), 'vortex_reward_choice_xml', 0, 0, (w) => {
    text(w, 'giver_name', 'Messager'); text(w, 'giver_txt', 'Voici votre récompense pour cette quête. Choisissez 1 objet parmi les propositions :');
    const cl = find(w, 'choice_list');
    for(const [name, uri, stats, selected] of [
        ['Lame du Voyageur', 'rpg/weapons/icon_05', [['Attaque', '+8', I.sword], ['Vitesse', '+4', I.speed], ['Endurance', '+3', I.end]], true],
        ['Cuirasse de l’Explorateur', 'rpg/armor/icon_10', [['Armure', '+18', I.armor], ['Endurance', '+5', I.end], ['Esquive', '+4', I.speed]], false],
        ['Bâton d’Ambreia', 'rpg/weapons/icon_20', [['Dégâts magiques', '+12', I.int], ['Mana', '+6', I.mana], ['Intelligence', '+3', I.int]], false],
    ]) add(cl, 'vortex_reward_choice_card_xml', (c) => { text(c, 'item_name', name); text(c, 'item_level', 'Niveau 20'); icon(c, 'item_icon', uri); show(c, 'selected', selected); const rb = find(c, 'radio'); if(rb && 'isSelected' in rb) rb.isSelected = selected; const sl = find(c, 'stat_list'); for(const [a, b, u] of stats) statRow(sl, a, b, u, 0x6a6a72, {width: 160}); });
});
place(at('confirm'), 'vortex_ui_confirm_xml', 0, 0, (c) => { c.caption = 'Confirmation'; text(c, 'message', 'Êtes-vous sûr de vouloir utiliser cet objet ?'); });
