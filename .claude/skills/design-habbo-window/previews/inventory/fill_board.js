// Fills the "États – Inventaire" board (states_inventory.xml) with every state of the inventory sheet.
const at = (name) => find(root, name);
const IRON = 'rpg/gems-materials/icon_00';
const slot = (slotName, {uri = IRON, count = '8', selected = false, rarity = 0, isNew = false, equipped = false, quest = false, locked = false, drop = false, dx = 0, dy = 0} = {}) =>
    place(at(slotName), 'vortex_inventory_item_slot_xml', dx, dy, (c) => {
        if(uri) icon(c, 'item_icon', uri); text(c, 'item_count', count);
        show(c, 'selected', selected); show(c, 'new_dot', isNew); show(c, 'equipped_icon', equipped); show(c, 'quest_icon', quest); show(c, 'lock_icon', locked); show(c, 'drop_target', drop);
        if(rarity) { show(c, 'rarity', true); tint(c, 'rarity', rarity); }
        if(locked) tint(c, null, 0xb8b8c0);
    });
slot('slot_normal');
slot('slot_hover', {dx: -1, dy: -1});
slot('slot_selected', {selected: true});
slot('slot_rare', {uri: 'rpg/gems-materials/icon_05', count: '1', rarity: 0xc080ff});
slot('slot_new', {uri: 'rpg/dungeon-objects/icon_05', count: '1', isNew: true});
slot('slot_equipped', {uri: 'rpg/armor/icon_30', count: '', equipped: true});
slot('slot_quest', {uri: 'rpg/dungeon-objects/icon_02', count: '1', quest: true});
slot('slot_locked', {uri: '', count: '', locked: true});
slot('slot_empty', {uri: '', count: ''});
slot('slot_drop', {uri: 'rpg/materials/icon_00', count: '12', drop: true});

const tip = (slotName, {uri, name, kind, rarity, desc, qty}) => place(at(slotName), 'vortex_inventory_tip_xml', 0, 0, (t) => {
    icon(t, 'tip_icon', uri); text(t, 'tip_name', name); text(t, 'tip_kind', kind); text(t, 'tip_rarity', rarity); text(t, 'tip_desc', desc); text(t, 'tip_quantity', qty);
});
tip('tip_1', {uri: IRON, name: 'Minerai de Fer', kind: 'Matériau', rarity: 'Commun', desc: 'Un minerai brut utilisé pour la forge et l’artisanat.', qty: 'Quantité : 8'});
tip('tip_2', {uri: 'rpg/fish-loot/icon_00', name: 'Poisson frais', kind: 'Consommable', rarity: 'Commun', desc: 'Un poisson frais, idéal pour cuisiner des plats nutritifs.', qty: 'Quantité : 3'});

place(at('menu_context'), 'vortex_ui_menu_xml', 0, 0, (m) => {
    const rows = [['Utiliser', 'rpg/ui-icons/media_eyeball_vision_shown_icon', 0x40b030], ['Équiper', 'rpg/ui-icons/rpg_item_armor_equipment_slot_chest_breastplate_body_icon', 0x8a94a0], ['Déplacer', 'rpg/ui-icons/arrows_movement_cursor_drag_diagonal_icon', 0xf0b020], ['Séparer la pile', 'rpg/ui-icons/boardgames_tetris_piece_block_icon', 0x40b0e0], ['Jeter', 'rpg/ui-icons/software_trashcan_garbage_bin_rubbish_delete_erase_1_icon', 0xd03a2a], ['Ajouter aux raccourcis', 'rpg/ui-icons/boardgames_card_draw_plus_icon', 0x40b0e0]];
    const list = find(m, 'menu_list');
    for(const [l, uri, c] of rows) add(list, 'vortex_ui_menu_row_xml', (r) => { text(r, 'row_label', l); icon(r, 'row_icon', uri); tint(r, 'row_icon', c); });
    const h = rows.length * 25 + 11; m.height = h; find(m, 'menu_frame').height = h; list.height = h - 12;
});

place(at('detail'), 'vortex_inventory_item_detail_xml', 0, 0, (d) => {
    show(d, 'no_selection', false);
    icon(d, 'item_icon', 'rpg/materials/icon_03'); text(d, 'item_name', 'Cuir robuste'); text(d, 'item_rarity', 'Rare'); tcolor(d, 'item_rarity', 0x2a8fd6); text(d, 'item_kind', 'Matériau');
    text(d, 'item_desc', 'Un cuir épais et résistant, très apprécié par les artisans pour la confection d’équipements solides.');
    const effects = find(d, 'effects_list');
    for(const [l, v] of [['Résistance', '+2'], ['Durabilité', '+10 %']]) add(effects, 'vortex_inventory_compare_row_xml', (r) => { text(r, 'stat_name', l); text(r, 'stat_value', v); icon(r, 'stat_icon', 'rpg/ui-icons/rpg_difficulty_3_medium_buckler_targe_shield_icon'); });
    text(d, 'item_quantity', '8'); text(d, 'item_weight', '0,5 (4,0 au total)'); text(d, 'item_value', '25');
    for(const [n, l] of [['use_tag_1', 'Artisanat'], ['use_tag_2', 'Équipement']]) { show(d, n, true); text(d, `${n}_txt`, l); }
    show(d, 'quest_note_box', false);
    text(d, 'primary_action', 'Utiliser'); text(d, 'secondary_action', 'Jeter');
});

place(at('split'), 'vortex_inventory_split_xml', 0, 0, (s) => { icon(s, 'item_icon', IRON); text(s, 'split_value', '4 / 8'); });

place(at('compare'), 'vortex_inventory_compare_xml', 0, 0, (c) => {
    const card = (slotName, {title, uri, name, rarity, rc, kind, stats, tinted}) => place(find(c, slotName), 'vortex_inventory_compare_card_xml', 0, 0, (k) => {
        text(k, 'card_title', title); icon(k, 'item_icon', uri); text(k, 'item_name', name); text(k, 'item_rarity', rarity); tcolor(k, 'item_rarity', rc); text(k, 'item_kind', kind);
        if(tinted) tint(k, null, 0xffd890);
        for(const [l, v, delta, i] of stats) add(find(k, 'stat_list'), 'vortex_inventory_compare_row_xml', (r) => { text(r, 'stat_name', l); text(r, 'stat_value', v); text(r, 'stat_delta', delta); icon(r, 'stat_icon', i); });
    });
    const I = {def: 'rpg/ui-icons/rpg_difficulty_3_medium_buckler_targe_shield_icon', agi: 'rpg/ui-icons/rpg_stat_dexterity_agility_boots_movement_speed_icon', spd: 'rpg/ui-icons/rpg_skill_dash_dodge_movement_speed_run_sprint_icon'};
    card('current_slot', {title: 'Actuellement équipé', uri: 'rpg/armor/icon_30', name: 'Bottes en cuir', rarity: 'Commun', rc: 0x666666, kind: 'Pieds', stats: [['Défense', '5', '', I.def], ['Agilité', '2', '', I.agi], ['Vitesse', '105', '', I.spd]]});
    card('new_slot', {title: 'Nouvel objet (survol)', uri: 'rpg/armor/icon_31', name: 'Bottes du voyageur', rarity: 'Rare', rc: 0x2a8fd6, kind: 'Pieds', tinted: true, stats: [['Défense', '8', '(+3)', I.def], ['Agilité', '4', '(+2)', I.agi], ['Vitesse', '118', '(+13)', I.spd]]});
});

place(at('hotkey'), 'vortex_inventory_hotkey_xml', 0, 0, (h) => {
    icon(h, 'item_icon', 'rpg/consumables-potions/icon_00'); text(h, 'item_name', 'Potion de vie');
    tint(h, 'key_5', 0xffd890);
});
