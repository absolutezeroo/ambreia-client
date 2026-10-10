const frame = root;
tab(frame, 'tab_overview');
const content = find(frame, 'tab_content');
const t = place(content, 'vortex_character_tab_overview_xml', 0, 0);
const sheet = place(find(t, 'character_sheet_slot'), 'vortex_character_sheet_xml', 0, 0);

const STATS = [
    ['Force', '28', '+4', 'rpg/ui-icons/rpg_stat_strength_fist_melee_attack_icon', 0xe09a60],
    ['Agilité', '18', '', 'rpg/ui-icons/boardgames_card_draw_hand_icon', 0xc0a060],
    ['Intelligence', '12', '', 'rpg/ui-icons/alchemy_potion_vial_bottle_star_mana_full_icon', 0x60a0e0],
    ['Défense', '35', '+6', 'rpg/ui-icons/boardgames_card_defense_shield_icon', 0x6090c0],
    ['Critique', '15%', '', 'rpg/ui-icons/boardgames_card_star_icon', 0xd0b040],
    ['Vitesse', '110', '', 'rpg/ui-icons/arrows_right_east_icon', 0x80b080],
    ['Points de vie', '1 240 / 1 240', '', 'rpg/ui-icons/cosmetics_lips_lipstick_kiss_heart_icon', 0xd04040],
    ['Mana', '320 / 320', '', 'rpg/ui-icons/alchemy_potion_vial_bottle_star_mana_full_icon', 0x4080d0],
];
const summary = find(sheet, 'summary_list');
for(const [label, value, bonus, uri, color] of STATS)
{
    add(summary, 'vortex_character_stat_row_xml', (row) => { text(row, 'label', label); text(row, 'value', value); text(row, 'bonus', bonus); icon(row, 'icon', uri); tint(row, 'icon', color); });
}

// Informations
text(t, 'name_txt', 'Clayton');
text(t, 'level_txt', 'Niveau 32');
text(t, 'class_txt', 'Aventurier');
text(t, 'title_txt', 'Explorateur d’Ambre');
text(t, 'guild_link', 'Les Aventuriers [HAB]');

// Featured title
const featured = find(t, 'active_title');
text(featured, 'title_name', 'Explorateur d’Ambre');
text(featured, 'title_desc', 'Découvrir de nouveaux horizons et percer les secrets de la ville.');

// Reputation
const FACTIONS = [
    ['Ville d’Ambre', 'Niv. 4', '280 / 500', 76, 'Neutre', 0xe4e4dc, 0x444444],
    ['Région des Lacs', 'Niv. 3', '120 / 500', 33, 'Neutre', 0xe4e4dc, 0x444444],
    ['Montagnes du Nord', 'Niv. 1', '0 / 500', 0, 'Inconnu', 0xe4e4dc, 0x999999],
    ['Forêt d’Émeraude', 'Niv. 5', '420 / 500', 114, 'Amical', 0xb8e090, 0x2b7000],
];
const list = find(t, 'faction_list');
for(const [name, level, points, px, standing, pill, color] of FACTIONS)
{
    add(list, 'vortex_character_faction_compact_row_xml', (row) => {
        text(row, 'faction_name', name); text(row, 'faction_level', level); text(row, 'points', points); bar(row, 'faction_bar', px);
        text(row, 'standing_txt', standing); tint(row, 'standing', pill); tcolor(row, 'standing_txt', color);
    });
}
