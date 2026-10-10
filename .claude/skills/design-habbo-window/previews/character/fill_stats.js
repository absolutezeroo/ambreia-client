const frame = root;
tab(frame, 'tab_stats');
const content = find(frame, 'tab_content');
const t = place(content, 'vortex_character_tab_stats_xml', 0, 0);
const sheet = place(find(t, 'character_sheet_slot'), 'vortex_character_sheet_xml', 0, 0);

const SUMMARY = [
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
for(const [label, value, bonus, uri, color] of SUMMARY)
{
    add(summary, 'vortex_character_stat_row_xml', (row) => { text(row, 'label', label); text(row, 'value', value); text(row, 'bonus', bonus); icon(row, 'icon', uri); tint(row, 'icon', color); });
}

const ATTR = [
    ['Force', 'Augmente les dégâts physiques.', '28', '+4', 'rpg/ui-icons/rpg_stat_strength_fist_melee_attack_icon', 0xe09a60, true],
    ['Agilité', 'Augmente l’esquive et la vitesse.', '18', '', 'rpg/ui-icons/boardgames_card_draw_hand_icon', 0xc0a060, false],
    ['Intelligence', 'Augmente les dégâts magiques.', '12', '', 'rpg/ui-icons/alchemy_potion_vial_bottle_star_mana_full_icon', 0x60a0e0, false],
    ['Défense', 'Réduit les dégâts subis.', '35', '+6', 'rpg/ui-icons/boardgames_card_defense_shield_icon', 0x6090c0, false],
];
const attributes = find(t, 'attributes_list');
for(const [label, desc, value, bonus, uri, color, selected] of ATTR)
{
    add(attributes, 'vortex_character_attribute_row_xml', (row) => { text(row, 'label', label); text(row, 'desc', desc); text(row, 'value', value); text(row, 'bonus', bonus); icon(row, 'icon', uri); tint(row, 'icon', color); show(row, 'selected', selected); });
}
const SECTIONS = {
    offense_list: [['Dégâts physiques', '45 – 62'], ['Dégâts magiques', '18 – 28'], ['Chance critique', '15%'], ['Dégâts critiques', '+50%'], ['Pénétration d’armure', '6']],
    defense_list: [['Armure', '120'], ['Résistance magique', '85'], ['Esquive', '18%'], ['Blocage', '8%'], ['Réduction des dégâts', '6%']],
    secondary_list: [['Vitesse de déplacement', '110'], ['Régénération de vie', '24 / 5s'], ['Régénération de mana', '18 / 5s'], ['Gain d’XP', '+25%'], ['Gain d’or', '+10%'], ['Portée d’interaction', '3 cases']],
};
for(const [name, lines] of Object.entries(SECTIONS))
{
    const list = find(t, name);
    for(const [label, value] of lines) add(list, 'vortex_character_stat_row_xml', (row) => { text(row, 'label', label); text(row, 'value', value); text(row, 'bonus', ''); tint(row, 'icon', 0xa0a098); });
}
