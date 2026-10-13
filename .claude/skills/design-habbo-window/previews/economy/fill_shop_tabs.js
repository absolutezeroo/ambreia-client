// @include fill_common.js
// The shop window on the tab named by TAB.
tab(root, TAB);
const t = place(find(root, 'tab_content'), `vortex_shop_${TAB}_xml`, 0, 0);
const inv = find(t, 'inventory_grid'); if(inv) grid(inv, ITEMS.slice(0, 10).map(([n, u], i) => [n, u, String([12, 8, 4, 3, 25, 12, 7, 3, 5, 4][i])]));
if(TAB === 'tab_buy')
{
    categories(find(t, 'category_list'), CATEGORIES, 0, {width: 168});
    const list = find(t, 'stock_list');
    STOCK.forEach(([name, uri, price], i) => add(list, 'vortex_shop_row_xml', (r) => { text(r, 'item_name', name); icon(r, 'item_icon', uri); text(r, 'price_txt', price); show(r, 'selected', i === 0); }));
    header(find(t, 'item_header_slot'), {name: 'Potion de vie (petite)', category: 'Consommable', desc: 'Restaure rapidement une petite quantité de points de vie.', uri: I.potion, width: 302});
    add(find(t, 'effect_list'), 'vortex_craft_ingredient_row_xml', (r) => { text(r, 'ingredient_name', '+ 250 PV'); text(r, 'ingredient_count', ''); icon(r, 'ingredient_icon', 'rpg/ui-icons/rpg_stat_hp_health_heart_icon'); tint(r, 'ingredient_icon', 0xe03a3a); show(r, 'state_icon', false); r.width = 302; });
    kv(find(t, 'unit_price_slot'), 'Prix unitaire', '50', {width: 286}); quantity(find(t, 'quantity_slot'), '1', {max: true}); kv(find(t, 'total_price_slot'), 'Prix total', '50', {width: 286});
}
else if(TAB === 'tab_sell')
{
    categories(find(t, 'category_list'), CATEGORIES, 0, {width: 168});
    grid(find(t, 'sell_grid'), ITEMS.slice(0, 10).map(([n, u], i) => [n, u, String([12, 8, 4, 3, 25, 12, 7, 3, 5, 4][i])]), {selected: 6});
    header(find(t, 'item_header_slot'), {name: 'Plume fine', category: 'Matériau', desc: 'Une plume légère, prisée des scribes et des artisans.', uri: 'rpg/materials/icon_03', width: 302});
    kv(find(t, 'owned_slot'), 'Quantité possédée', '2', {width: 286}); kv(find(t, 'unit_price_slot'), 'Prix de vente unitaire', '20', {width: 286}); quantity(find(t, 'quantity_slot'), '1', {max: true}); kv(find(t, 'total_price_slot'), 'Prix de vente total', '20', {width: 286});
    place(find(t, 'merchant_note_slot'), 'vortex_shop_merchant_note_xml', 0, 0, (n) => text(n, 'merchant_note', 'Bienvenue ! J’ai de quoi équiper pour tes prochaines aventures.'));
}
else
{
    const list = find(t, 'buyback_list');
    for(const [name, uri, time, price, sel] of [['Épée rouillée', 'rpg/weapons/icon_02', '2h 15m', '120'], ['Potion de mana (petite)', 'rpg/consumables-potions/icon_01', '5h 32m', '50'], ['Ancien bouclier', 'rpg/armor/icon_05', '8h 47m', '200', true], ['Bottes usées', 'rpg/armor/icon_30', '12h 10m', '80'], ['Collier terni', 'rpg/gems-materials/icon_12', '18h 26m', '150']])
        add(list, 'vortex_shop_buyback_row_xml', (r) => { text(r, 'item_name', name); icon(r, 'item_icon', uri); text(r, 'time_txt', time); text(r, 'price_txt', price); show(r, 'selected', !!sel); });
    header(find(t, 'item_header_slot'), {name: 'Ancien bouclier', category: 'Équipement', desc: 'Un bouclier marqué par les combats, encore solide.', uri: 'rpg/armor/icon_05', width: 302});
    const d = find(t, 'detail_list'); kv(d, 'Prix d’origine', '240', {width: 302}); kv(d, 'Prix de rachat', '200', {width: 302}); kv(d, 'Vendu il y a', '8h 47m', {width: 302});
    place(find(t, 'info_banner_slot'), 'vortex_skill_info_banner_xml', 0, 0, (b) => { b.width = 838; text(b, 'banner_title', 'Rachat'); text(b, 'banner_desc', 'Les objets vendus restent disponibles au rachat pendant 24 heures, à leur prix de vente.'); });
}
