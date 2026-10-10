const frame = root;
tab(frame, 'tab_reputation');
const content = find(frame, 'tab_content');
const t = place(content, 'vortex_character_tab_reputation_xml', 0, 0);

const main = find(t, 'main_reputation');
text(main, 'main_name', 'Ville d’Ambre');
text(main, 'main_level', 'Niveau 4');
text(main, 'points', '280 / 500');
bar(main, 'main_bar', 146);

const status = find(t, 'status_list');
for(const [label, count, uri, iconColor, countColor] of [
    ['Factions amicales', '2', 'rpg/ui-icons/rpg_trade_handshake_deal_exchange_icon', 0x40b030, 0x2b9a00],
    ['Factions neutres', '2', 'rpg/ui-icons/emoji_face_neutral_icon', 0x888880, 0x444444],
    ['Factions hostiles', '0', 'rpg/ui-icons/emoji_face_angry_anger_icon', 0xd04040, 0xc30000],
])
{
    add(status, 'vortex_character_status_row_xml', (row) => { text(row, 'label', label); text(row, 'count', count); icon(row, 'icon', uri); tint(row, 'icon', iconColor); tcolor(row, 'count', countColor); });
}

const FACTIONS = [
    ['Ville d’Ambre', 'Niveau 4', '280 / 500', 65, 'Neutre', 0xe4e4dc, 0x444444, 'Accès au marché avancé', 'variablefx_icon_star_power', true],
    ['Région des Lacs', 'Niveau 3', '120 / 500', 28, 'Neutre', 0xe4e4dc, 0x444444, 'Bateau de transport débloqué', 'rpg/ui-icons/alchemy_element_water_icon', false],
    ['Montagnes du Nord', 'Niveau 1', '0 / 500', 0, 'Inconnu', 0xe4e4dc, 0x999999, 'Accès aux mines du Nord', 'rpg/ui-icons/map_markers_mountains_hills_cliffs_terrain_icon', false],
    ['Forêt d’Émeraude', 'Niveau 5', '420 / 500', 97, 'Amical', 0xb8e090, 0x2b7000, 'Recettes d’artisanat rares', 'rpg/ui-icons/map_markers_tree_forest_decidous_1_icon', false],
    ['Confrérie des Ombres', 'Niveau 2', '150 / 500', 35, 'Hostile', 0xf0b8b0, 0xa01e10, 'Accès au quartier secret', 'rpg/ui-icons/map_markers_graveyard_gravestone_death_1_icon', false],
    ['Ordre de la Lumière', 'Niveau 1', '0 / 500', 0, 'Inconnu', 0xe4e4dc, 0x999999, 'Quêtes de l’ordre débloquées', 'rpg/ui-icons/alchemy_gold_sol_sun_icon', false],
];
const list = find(t, 'faction_list');
for(const [name, level, points, px, standing, pill, color, reward, uri, selected] of FACTIONS)
{
    add(list, 'vortex_character_faction_row_xml', (row) => {
        text(row, 'faction_name', name); text(row, 'faction_level', level); text(row, 'points', points); bar(row, 'faction_bar', px);
        text(row, 'standing_txt', standing); tint(row, 'standing', pill); tcolor(row, 'standing_txt', color);
        text(row, 'next_reward_txt', reward); icon(row, 'icon', uri); show(row, 'selected', selected);
    });
}
