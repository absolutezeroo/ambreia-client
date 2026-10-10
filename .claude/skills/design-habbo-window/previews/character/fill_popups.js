// Fills whichever popup frame is open as the root (one layout per run).
const name = root.name;
if(name === 'character_confirm')
{
    text(root, 'message', 'Voulez-vous vraiment retirer le titre "Explorateur d’Ambre" ?');
}
else if(name === 'stat_compare')
{
    root.caption = 'Force';
    text(root, 'stat_value', '28'); text(root, 'stat_bonus', '(+4)');
    text(root, 'base_value', '24'); text(root, 'equipment_value', '+4'); text(root, 'title_value', '+0'); text(root, 'guild_value', '+0');
    text(root, 'total_value', '28'); text(root, 'total_bonus', '(+4)');
}
else if(name === 'reward_panel')
{
    text(root, 'reward_name', 'Accès au marché avancé');
    text(root, 'reward_desc', 'Débloque le marché de la ville d’Ambre et de nouveaux objets.');
    const list = find(root, 'reward_list');
    for(const [label, uri, color] of [['Accès au marché de la ville', 'rpg/ui-icons/map_markers_building_shop_storefront_icon', 0xc08040], ['3 nouveaux objets décoratifs', 'rpg/ui-icons/software_package_box_crate_archive_closed_sealed_icon', 0xa08060], ['Nouvelles quêtes secondaires', 'rpg/ui-icons/map_markers_scroll_map_location_icon', 0xd0a040], ['+5% d’expérience dans la ville d’Ambre', 'rpg/ui-icons/boardgames_card_star_icon', 0xe0b020]])
    {
        add(list, 'vortex_character_title_reward_row_xml', (row) => { text(row, 'label', label); icon(row, 'icon', uri); tint(row, 'icon', color); });
    }
}
else if(name === 'faction_detail')
{
    text(root, 'faction_name', 'Ville d’Ambre'); text(root, 'faction_level', 'Niveau 4'); text(root, 'points', '280 / 500'); bar(root, 'faction_bar', 131);
    text(root, 'faction_desc', 'Votre réputation auprès de cette région influence l’accès à de nouvelles quêtes, objets, services et zones spéciales.');
    text(root, 'next_reward_name', 'Accès au marché avancé'); text(root, 'next_reward_desc', 'Débloque le marché de la ville d’Ambre et de nouveaux objets.');
    const list = find(root, 'condition_list');
    for(const [label, progress] of [['Atteindre le niveau 10', '10 / 10'], ['Visiter tous les quartiers d’Ambre', '5 / 5'], ['Terminer 20 quêtes principales', '20 / 20']])
    {
        add(list, 'vortex_character_condition_row_xml', (row) => { text(row, 'label', label); text(row, 'progress', progress); });
    }
}
