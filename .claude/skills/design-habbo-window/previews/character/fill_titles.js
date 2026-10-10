const frame = root;
tab(frame, 'tab_titles');
const content = find(frame, 'tab_content');
const t = place(content, 'vortex_character_tab_titles_xml', 0, 0);
text(t, 'title_count', '6 / 12');

const RARITY = {commun: ['Commun', 0x777777], rare: ['Rare', 0x1077ac], epique: ['Épique', 0x8a2be2], legendaire: ['Légendaire', 0xd09000]};
const TITLES = [
    ['Explorateur d’Ambre', 'Aventure', 'rare', 'active', 'variablefx_icon_star_power'],
    ['Randonneur', 'Aventure', 'commun', 'locked', 'rpg/ui-icons/map_markers_travel_map_folded_icon'],
    ['Ami des Habbos', 'Social', 'commun', 'locked', 'rpg/ui-icons/software_speech_bubble_information_guide_tutorial_icon'],
    ['Conquérant', 'Combat', 'rare', 'locked', 'rpg/ui-icons/boardgames_card_attack_sword_icon'],
    ['Collectionneur', 'Collection', 'rare', 'locked', 'rpg/ui-icons/boardgames_chip_token_coin_counter_icon'],
    ['Érudit', 'Exploration', 'epique', 'locked', 'rpg/ui-icons/misc_religion_christianity_bible_book_cross_tome_libram_icon'],
    ['Légende d’Ambre', 'Événement', 'legendaire', 'locked', 'rpg/ui-icons/hats_crown_king_monarch_ruler_emperor_icon'],
    ['Maître des Guildes', 'Guilde', 'epique', 'locked', 'rpg/ui-icons/boardgames_card_defense_shield_icon'],
    ['Citoyen des Saisons', 'Événement', 'rare', 'owned', 'rpg/ui-icons/alchemy_gold_sol_sun_icon'],
];
const list = find(t, 'title_list');
for(const [name, cat, rarity, state, uri] of TITLES)
{
    add(list, 'vortex_character_title_row_xml', (row) => {
        text(row, 'title_name', name);
        text(row, 'category_txt', cat);
        text(row, 'rarity_txt', RARITY[rarity][0]);
        tcolor(row, 'rarity_txt', RARITY[rarity][1]);
        icon(row, 'icon', uri);
        tcolor(row, 'title_name', state === 'locked' ? 0x999999 : 0x222222);
        show(row, 'lock_icon', state === 'locked');
        show(row, 'active_badge', state === 'active');
        show(row, 'selected', state === 'active');
    });
}

// Detail: the active title (looked up under the detail panel: the rows carry the same names).
const detail = find(t, 'title_detail');
text(detail, 'title_name', 'Explorateur d’Ambre');
text(detail, 'category_txt', 'Aventure');
text(detail, 'title_desc', 'Découvrir de nouveaux horizons et percer les secrets de la ville.');
const cond = find(t, 'condition_list');
for(const [label, progress] of [['Atteindre le niveau 10', '10 / 10'], ['Visiter tous les quartiers d’Ambre', '5 / 5'], ['Terminer 20 quêtes principales', '20 / 20']])
{
    add(cond, 'vortex_character_condition_row_xml', (row) => { text(row, 'label', label); text(row, 'progress', progress); });
}
const rewards = find(t, 'reward_list');
add(rewards, 'vortex_character_title_reward_row_xml', () => {});
add(rewards, 'vortex_character_title_reward_row_xml', (row) => { text(row, 'label', '+5% d’expérience sur les quêtes dans la ville d’Ambre.'); icon(row, 'icon', 'rpg/ui-icons/hats_crown_king_monarch_ruler_emperor_icon'); tint(row, 'icon', 0xf0c030); });
