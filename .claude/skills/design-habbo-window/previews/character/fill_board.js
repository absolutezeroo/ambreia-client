const at = (name) => find(root, name);
const titleRow = (slotName, {name = 'Explorateur d’Ambre', cat = 'Aventure', rarity = ['Rare', 0x1077ac], locked = false, active = false, selected = false, dx = 0, dy = 0, pressed = false, uri = 'variablefx_icon_star_power'} = {}) =>
    place(at(slotName), 'vortex_character_title_row_xml', dx, dy, (row) => {
        text(row, 'title_name', name); text(row, 'category_txt', cat); text(row, 'rarity_txt', rarity[0]); tcolor(row, 'rarity_txt', rarity[1]);
        tcolor(row, 'title_name', locked ? 0x999999 : 0x222222); show(row, 'lock_icon', locked); show(row, 'active_badge', active); show(row, 'selected', selected);
        icon(row, 'icon', uri); if(pressed) tint(row, null, 0xb3b3b3);
    });

titleRow('row_normal');
titleRow('row_hover', {dx: -1, dy: -1});
titleRow('row_pressed', {pressed: true});
titleRow('row_locked', {name: 'Érudit', cat: 'Exploration', rarity: ['Épique', 0x8a2be2], locked: true, uri: 'rpg/ui-icons/misc_religion_christianity_bible_book_cross_tome_libram_icon'});
titleRow('row_active', {active: true});
titleRow('row_selected', {name: 'Randonneur', cat: 'Aventure', rarity: ['Commun', 0x777777], selected: true, uri: 'rpg/ui-icons/map_markers_travel_map_folded_icon'});
titleRow('row_active_selected', {active: true, selected: true});

// Menus: the closed filter is the titles tab's control; the open lists are the menu layout.
const titlesTab = build('vortex_character_tab_titles_xml');
const filter = find(titlesTab, 'category_filter');
filter.x = 0; filter.y = 0; at('filter_closed').addChild(filter);
const menu = (slotName, rows, height) => {
    const m = place(at(slotName), 'vortex_character_menu_xml', 0, 0);
    find(m, 'menu_frame').height = height; m.height = height; find(m, 'menu_list').height = height - 12;
    const list = find(m, 'menu_list');
    for(const [label, uri, tintColor, checked] of rows) add(list, 'vortex_character_menu_row_xml', (row) => { text(row, 'row_label', label); icon(row, 'row_icon', uri); tint(row, 'row_icon', tintColor); show(row, 'row_check', checked); if(checked) tint(row, null, 0xdde8f1); });
};
menu('menu_categories', [
    ['Tous les titres', 'rpg/ui-icons/software_filter_sort_funnel_icon', 0xf0c040, true],
    ['Aventure', 'rpg/ui-icons/map_markers_travel_map_folded_icon', 0xc08040, false],
    ['Combat', 'rpg/ui-icons/boardgames_card_attack_sword_icon', 0x8090a0, false],
    ['Collection', 'rpg/ui-icons/boardgames_chip_token_coin_counter_icon', 0xe0b020, false],
    ['Exploration', 'rpg/ui-icons/misc_religion_christianity_bible_book_cross_tome_libram_icon', 0x9060c0, false],
    ['Événement', 'rpg/ui-icons/hats_crown_king_monarch_ruler_emperor_icon', 0xe0a020, false],
    ['Social', 'rpg/ui-icons/software_speech_bubble_information_guide_tutorial_icon', 0x60a0e0, false],
    ['Guilde', 'rpg/ui-icons/boardgames_card_defense_shield_icon', 0x4080c0, false],
], 8 * 25 + 12);
menu('menu_titles', [
    ['Explorateur d’Ambre', 'variablefx_icon_star_power', 0xffffff, true],
    ['Randonneur', 'rpg/ui-icons/map_markers_travel_map_folded_icon', 0xc08040, false],
    ['Conquérant', 'rpg/ui-icons/boardgames_card_attack_sword_icon', 0x8090a0, false],
    ['Collectionneur', 'rpg/ui-icons/boardgames_chip_token_coin_counter_icon', 0xe0b020, false],
    ['Érudit', 'rpg/ui-icons/misc_religion_christianity_bible_book_cross_tome_libram_icon', 0x9060c0, false],
], 5 * 25 + 12);

// Status rows
const status = at('status_rows');
[['Factions amicales', '2', 'rpg/ui-icons/rpg_trade_handshake_deal_exchange_icon', 0x40b030, 0x2b9a00], ['Factions neutres', '2', 'rpg/ui-icons/emoji_face_neutral_icon', 0x888880, 0x444444], ['Factions hostiles', '0', 'rpg/ui-icons/emoji_face_angry_anger_icon', 0xd04040, 0xc30000]]
    .forEach(([label, count, uri, ic, cc], i) => place(status, 'vortex_character_status_row_xml', 0, i * 28, (row) => { text(row, 'label', label); text(row, 'count', count); icon(row, 'icon', uri); tint(row, 'icon', ic); tcolor(row, 'count', cc); }));

// Tooltips
const tip = (slotName, title, body) => place(at(slotName), 'vortex_character_tip_xml', 0, 0, (w) => { text(w, 'tip_title', title); text(w, 'tip_txt', body); show(w, 'tip_title', title !== ''); });
tip('tip_locked', 'Titre verrouillé', 'Terminez "20 quêtes principales" pour débloquer ce titre.');
tip('tip_stat', 'Chance critique', 'Augmente la probabilité d’infliger des dégâts critiques avec vos attaques et compétences.');
tip('tip_faction', 'Région des Lacs', 'Une région paisible connue pour ses ports et son commerce. Rencontrez ses habitants pour gagner leur confiance.');
tip('tip_edit', '', 'Modifier le pseudonyme');
tip('tip_search', '', 'Rechercher une guilde');
place(at('tip_equipment'), 'vortex_character_equipment_tip_xml', 0, 0, (w) => {
    text(w, 'item_name', 'Sac d’aventurier'); text(w, 'item_slot', 'Emplacement : Dos'); text(w, 'item_desc', 'Un sac robuste pour vos aventures.'); text(w, 'item_rarity', 'Rare');
    const list = find(w, 'bonus_list');
    for(const line of ['+5 places d’inventaire', '+2% vitesse de déplacement']) add(list, 'vortex_character_tip_line_xml', (l) => { l.caption = line; });
});

// Reputation rows
const faction = (slotName, {name, level, points, px, standing, pill, color, reward, selected = false, uri = 'variablefx_icon_star_power'}) =>
    place(at(slotName), 'vortex_character_faction_row_xml', 0, 0, (row) => {
        text(row, 'faction_name', name); text(row, 'faction_level', level); text(row, 'points', points); bar(row, 'faction_bar', px);
        text(row, 'standing_txt', standing); tint(row, 'standing', pill); tcolor(row, 'standing_txt', color); text(row, 'next_reward_txt', reward); icon(row, 'icon', uri); show(row, 'selected', selected);
    });
faction('faction_normal', {name: 'Ville d’Ambre', level: 'Niveau 4', points: '280 / 500', px: 65, standing: 'Neutre', pill: 0xe4e4dc, color: 0x444444, reward: 'Accès au marché avancé'});
faction('faction_selected', {name: 'Ville d’Ambre', level: 'Niveau 4', points: '280 / 500', px: 65, standing: 'Neutre', pill: 0xe4e4dc, color: 0x444444, reward: 'Accès au marché avancé', selected: true});
faction('faction_hostile', {name: 'Confrérie des Ombres', level: 'Niveau 2', points: '150 / 500', px: 35, standing: 'Hostile', pill: 0xf0b8b0, color: 0xa01e10, reward: 'Accès au quartier secret', uri: 'rpg/ui-icons/map_markers_graveyard_gravestone_death_1_icon'});
const compact = (slotName, {name, level, points, px, standing, pill, color, fill}) =>
    place(at(slotName), 'vortex_character_faction_compact_row_xml', 0, 0, (row) => {
        text(row, 'faction_name', name); text(row, 'faction_level', level); text(row, 'points', points); bar(row, 'faction_bar', px);
        text(row, 'standing_txt', standing); tint(row, 'standing', pill); tcolor(row, 'standing_txt', color); if(fill) tint(find(row, 'faction_bar'), 'fill', fill);
    });
compact('compact_normal', {name: 'Ville d’Ambre', level: 'Niv. 4', points: '280 / 500', px: 76, standing: 'Neutre', pill: 0xe4e4dc, color: 0x444444});
compact('compact_max', {name: 'Forêt d’Émeraude', level: 'Niv. 10', points: 'Niveau max', px: 136, standing: 'Amical', pill: 0xb8e090, color: 0x2b7000, fill: 0xf0b020});

// Stat rows
place(at('attr_normal'), 'vortex_character_attribute_row_xml', 0, 0, (row) => { text(row, 'label', 'Force'); text(row, 'desc', 'Augmente les dégâts physiques.'); text(row, 'value', '28'); text(row, 'bonus', '+4'); });
place(at('attr_selected'), 'vortex_character_attribute_row_xml', 0, 0, (row) => { text(row, 'label', 'Force'); text(row, 'desc', 'Augmente les dégâts physiques.'); text(row, 'value', '28'); text(row, 'bonus', '+4'); show(row, 'selected', true); });
place(at('stat_bonus'), 'vortex_character_stat_row_xml', 0, 0, (row) => { text(row, 'label', 'Force'); text(row, 'value', '28'); text(row, 'bonus', '+4'); });
place(at('stat_malus'), 'vortex_character_stat_row_xml', 0, 0, (row) => { text(row, 'label', 'Agilité'); text(row, 'value', '15'); text(row, 'bonus', '-3'); tcolor(row, 'bonus', 0xc30000); icon(row, 'icon', 'rpg/ui-icons/boardgames_card_draw_hand_icon'); tint(row, 'icon', 0xc0a060); });
