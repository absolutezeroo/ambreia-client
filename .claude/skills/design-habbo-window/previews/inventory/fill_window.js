// The inventory window on its equipment tab: the character sheet on the left, a filled bag on the right.
const frame = root;
tab(frame, 'tab_equipment');
const content = find(frame, 'tab_content');
const sheet = place(find(content, 'left_slot'), 'vortex_character_sheet_xml', 0, 0, (s) => {
    for(const [key, uri] of [['head', 'rpg/armor/icon_03'], ['chest', 'rpg/armor/icon_10'], ['legs', 'rpg/armor/icon_20'], ['feet', 'rpg/armor/icon_30'], ['weapon', 'rpg/weapons/icon_05'], ['neck', 'rpg/gems-materials/icon_12']])
    {
        icon(s, `slot_${key}_icon`, uri); show(s, `slot_${key}_empty`, false);
    }
    const list = find(s, 'summary_list');
    for(const [label, value, bonus, uri, c] of [
        ['Force', '28', '(+4)', 'rpg/ui-icons/rpg_stat_strength_fist_melee_attack_icon', 0xe09a60],
        ['Agilité', '18', '', 'rpg/ui-icons/rpg_stat_dexterity_agility_boots_movement_speed_icon', 0x6cbb2d],
        ['Intelligence', '12', '', 'rpg/ui-icons/boardgames_card_star_icon', 0x40b0e0],
        ['Défense', '35', '(+6)', 'rpg/ui-icons/rpg_difficulty_3_medium_buckler_targe_shield_icon', 0x8a94a0],
        ['Critique', '15 %', '', 'rpg/ui-icons/rpg_skill_dash_dodge_movement_speed_run_sprint_icon', 0xf0b020],
        ['Vitesse', '110', '', 'rpg/ui-icons/rpg_stat_dexterity_agility_boots_movement_speed_small_icon', 0x40b030],
        ['Points de vie', '1 240 / 1 240', '', 'rpg/ui-icons/rpg_stat_hp_health_heart_icon', 0xe03a3a],
        ['Mana', '320 / 320', '', 'rpg/ui-icons/rpg_gem_jewelcrafting_diamond_points_currency_icon', 0x4090e0],
    ]) add(list, 'vortex_character_stat_row_xml', (r) => { text(r, 'label', label); text(r, 'value', value); text(r, 'bonus', bonus); icon(r, 'icon', uri); tint(r, 'icon', c); });
});
const grid = find(content, 'item_grid');
const items = [
    ['rpg/materials/icon_00', '12'], ['rpg/gems-materials/icon_00', '8', {selected: true}], ['rpg/plants-crops/icon_02', '4'], ['rpg/fish-loot/icon_00', '3'], ['rpg/consumables-potions/icon_00', '25'],
    ['rpg/consumables-potions/icon_01', '12'], ['rpg/materials/icon_03', '7'], ['rpg/gems-materials/icon_05', '3', {rarity: 0xc080ff}], ['rpg/plants-crops/icon_05', '5'], ['rpg/plants-crops/icon_06', '4'],
    ['rpg/materials/icon_04', '2'], ['rpg/dungeon-objects/icon_02', '1', {quest: true}], ['rpg/dungeon-objects/icon_37', '2'], ['rpg/dungeon-objects/icon_05', '1', {isNew: true}], ['rpg/dungeon-objects/icon_12', '1'],
    ['rpg/gems-materials/icon_08', '6'], ['rpg/gems-materials/icon_09', '3'], ['rpg/gems-materials/icon_10', '1'], ['rpg/gems-materials/icon_11', '4'], ['rpg/materials/icon_05', '8'],
    ['rpg/materials/icon_06', '4'], ['rpg/materials/icon_07', '10'], ['rpg/materials/icon_01', '6'], ['rpg/materials/icon_02', '5'], ['rpg/plants-crops/icon_00', '1'],
    ['rpg/consumables-potions/icon_04', '3'], ['rpg/dungeon-objects/icon_20', '1'], ['rpg/dungeon-objects/icon_25', '1'], ['rpg/fish-loot/icon_03', '2'], ['rpg/fish-loot/icon_07', '3'],
];
for(const [uri, count, {selected = false, rarity = 0, quest = false, isNew = false} = {}] of items)
{
    add(grid, 'vortex_inventory_item_slot_xml', (c) => { icon(c, 'item_icon', uri); text(c, 'item_count', count); show(c, 'selected', selected); show(c, 'quest_icon', quest); show(c, 'new_dot', isNew); if(rarity) { show(c, 'rarity', true); tint(c, 'rarity', rarity); } });
}
for(let i = 0; i < 5; i++) add(grid, 'vortex_inventory_item_slot_xml', (c) => { text(c, 'item_count', ''); });
text(content, 'gold_amount', '12 450');
text(content, 'gems_amount', '120');
text(content, 'bag_count', '30 / 40');
