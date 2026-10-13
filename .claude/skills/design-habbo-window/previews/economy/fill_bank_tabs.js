// @include fill_common.js
// The bank window on the tab named by TAB.
tab(root, TAB);
const t = place(find(root, 'tab_content'), `vortex_bank_${TAB}_xml`, 0, 0);
const BANK = [['rpg/materials/icon_00', '124', {selected: true}], ['rpg/gems-materials/icon_00', '87'], ['rpg/gems-materials/icon_08', '45'], ['rpg/plants-crops/icon_02', '32'], ['rpg/fish-loot/icon_00', '28'], ['rpg/fish-loot/icon_03', '16'], ['rpg/materials/icon_04', '11'], ['rpg/consumables-potions/icon_04', '9'], ['rpg/consumables-potions/icon_00', '64'], ['rpg/consumables-potions/icon_01', '38'], ['rpg/plants-crops/icon_00', '27'], ['rpg/dungeon-objects/icon_05', '6'], ['rpg/plants-crops/icon_05', '14'], ['rpg/plants-crops/icon_06', '12'], ['rpg/materials/icon_03', '8'], ['rpg/dungeon-objects/icon_02', '3'], ['rpg/dungeon-objects/icon_12', '5'], ['rpg/dungeon-objects/icon_20', '3'], ['rpg/gems-materials/icon_05', '4'], ['rpg/gems-materials/icon_09', '2'], ['rpg/dungeon-objects/icon_37', '6'], ['rpg/materials/icon_05', '15'], ['rpg/materials/icon_06', '20'], ['rpg/materials/icon_07', '12'], ['rpg/plants-crops/icon_01', '7', {isNew: true}], ['rpg/plants-crops/icon_03', '18'], ['rpg/plants-crops/icon_04', '9'], ['rpg/plants-crops/icon_07', '23'], ['rpg/gems-materials/icon_10', '11', {locked: true}], ['rpg/gems-materials/icon_11', '40']];
const g = find(t, 'item_grid');
const items = TAB === 'tab_bag' ? BANK.slice(0, 12) : TAB === 'tab_guild' ? BANK.slice(0, 8) : BANK;
items.forEach(([uri, n, {selected = false, isNew = false, locked = false} = {}]) => add(g, 'vortex_inventory_item_slot_xml', (s) => { icon(s, 'item_icon', uri); text(s, 'item_count', n); show(s, 'selected', selected); show(s, 'new_dot', isNew); show(s, 'lock_icon', locked); if(locked) tint(s, 'item_icon', 0x8080a0); }));
for(let i = items.length; i < (TAB === 'tab_bag' ? 40 : 42); i++) add(g, 'vortex_inventory_item_slot_xml', (s) => text(s, 'item_count', ''));
text(t, 'capacity_txt', TAB === 'tab_bag' ? '12 / 40 emplacements utilisés' : TAB === 'tab_guild' ? '12 / 200 emplacements utilisés' : '42 / 100 emplacements utilisés'); bar(t, 'capacity_bar', TAB === 'tab_bag' ? 60 : TAB === 'tab_guild' ? 12 : 84);
text(t, 'gold_txt', '12 450'); text(t, 'gems_txt', '120');
icon(t, 'detail_icon', 'rpg/materials/icon_00'); text(t, 'item_name', 'Bois d’Ambre'); text(t, 'item_kind', 'Ressource'); text(t, 'item_desc', 'Un bois solide issu des forêts d’Ambre. Très utilisé pour l’artisanat et la construction.');
text(t, 'item_quantity', 'Quantité : 124'); text(t, 'item_weight', 'Poids : 0,1 (12,4 au total)');
show(t, 'tag_1', true); text(t, 'tag_1_txt', 'Ressource'); show(t, 'tag_2', true); text(t, 'tag_2_txt', 'Matériau');
if(TAB === 'tab_bag') { text(t, 'withdraw_some_button', 'Déposer une quantité'); text(t, 'withdraw_stack_button', 'Déposer la pile'); text(t, 'deposit_item_button', 'Retirer'); }
if(TAB === 'tab_guild') { text(t, 'guild_capacity_txt', '12 / 200'); tint(t, 'withdraw_some_button', 0x9a9a9a); tint(t, 'withdraw_stack_button', 0x9a9a9a); tint(t, 'deposit_item_button', 0xb07a10); }
