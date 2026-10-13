// @include fill_common.js
// The market (auction house) window on the tab named by TAB.
tab(root, TAB);
const t = place(find(root, 'tab_content'), `vortex_market_${TAB}_xml`, 0, 0);
const MCATS = [['Tous les objets', I.all], ['Équipement', I.sword], ['Consommables', I.potion], ['Ressources', I.wood], ['Matériaux', 'rpg/gems-materials/icon_00'], ['Quêtes', I.scroll], ['Mobilier', I.chair], ['Cosmétiques', I.shirt], ['Autres', I.chest]];
const LISTINGS = [['Bois d’Ambre', 'rpg/materials/icon_00', '48', '12', 'Léa', true], ['Minerai de Fer', 'rpg/gems-materials/icon_00', '120', '8', 'Marek'], ['Feuille de Liane', 'rpg/plants-crops/icon_02', '35', '15', 'Sofia'], ['Poisson Bleu', 'rpg/fish-loot/icon_00', '95', '6', 'Tomy'], ['Potion de Vie (P)', 'rpg/consumables-potions/icon_00', '250', '4', 'Nina'], ['Fleur Solaire', 'rpg/plants-crops/icon_05', '80', '10', 'Aiko'], ['Plume d’Aérien', 'rpg/materials/icon_03', '320', '3', 'Zed'], ['Clé d’Exploration', 'rpg/dungeon-objects/icon_02', '500', '1', 'Kuro']];
const detailHeader = (name, uri, category, desc) => header(find(t, 'item_header_slot'), {name, category, desc, uri, width: 284});
if(TAB === 'tab_buy')
{
    categories(find(t, 'category_list'), MCATS, 0);
    const list = find(t, 'listing_list');
    LISTINGS.forEach(([name, uri, price, qty, seller, sel]) => add(list, 'vortex_market_listing_row_xml', (r) => { text(r, 'item_name', name); icon(r, 'item_icon', uri); text(r, 'price_txt', price); text(r, 'qty_txt', qty); text(r, 'seller_txt', seller); show(r, 'selected', !!sel); }));
    pager(find(t, 'pager_slot'), '1 / 8');
    detailHeader('Bois d’Ambre', 'rpg/materials/icon_00', 'Ressource locale', 'Un bois solide et précieux récolté dans les forêts d’Ambre.');
    text(t, 'lowest_price_txt', '48'); text(t, 'offer_count', '3 offres disponibles');
    const offers = find(t, 'offer_list');
    for(const [p, q] of [['48', 'x 12'], ['52', 'x 20'], ['55', 'x 6']]) add(offers, 'vortex_market_offer_row_xml', (o) => { text(o, 'price_txt', p); text(o, 'qty_txt', q); });
    text(t, 'price_input', '50'); text(t, 'qty_input', '12'); text(t, 'duration_menu', '24 heures'); text(t, 'commission_label', 'Commission (5 %)'); text(t, 'commission_txt', '2 (5 %)');
}
else if(TAB === 'tab_sell')
{
    categories(find(t, 'category_list'), MCATS, 0);
    const inv = find(t, 'inventory_list');
    ITEMS.forEach(([name, uri], i) => add(inv, 'vortex_market_inventory_row_xml', (r) => { text(r, 'item_name', name); icon(r, 'item_icon', uri); text(r, 'qty_txt', String([12, 8, 15, 4, 6, 10, 3, 1, 2, 1][i])); show(r, 'selected', i === 0); }));
    text(t, 'staged_title', 'Objets à mettre en vente (1/10)');
    add(find(t, 'staged_list'), 'vortex_market_staged_row_xml', (s) => { text(s, 'item_name', 'Bois d’Ambre'); text(s, 'item_kind', 'Ressource'); icon(s, 'item_icon', 'rpg/materials/icon_00'); text(s, 'qty_input', '12'); });
    detailHeader('Bois d’Ambre', 'rpg/materials/icon_00', 'Ressource locale', 'Un bois solide et précieux récolté dans les forêts d’Ambre.');
    text(t, 'rarity_pill_txt', 'Commun');
    const st = find(t, 'stat_list'); kv(st, 'Quantité possédée', '12'); kv(st, 'Prix moyen récent', '52', {coin: true}); kv(st, 'Prix le plus bas', '48 (12 en vente)'); kv(st, 'Prix suggéré', '50', {color: 0x2b9a00});
    text(t, 'price_input', '50'); quantity(find(t, 'quantity_slot'), '12'); text(t, 'available_txt', 'Disponible : 12'); text(t, 'duration_menu', '24 heures'); text(t, 'commission_label', 'Commission (5 %)'); text(t, 'commission_txt', '30 (5 %)'); text(t, 'revenue_txt', '570');
}
else if(TAB === 'tab_sales')
{
    categories(find(t, 'category_list'), [['Toutes mes ventes', I.all], ['En cours', I.clock], ['Vendues', I.check], ['Expirées', I.lock], ['Retirées', I.x]], 0);
    const list = find(t, 'sale_list');
    for(const [name, uri, price, qty, sold, status, c, time, sel] of [['Bois d’Ambre', 'rpg/materials/icon_00', '48', '12', '0/12', 'En vente', 0x2b9a00, '23h 14m', true], ['Minerai de Fer', 'rpg/gems-materials/icon_00', '120', '8', '3/8', 'En vente', 0x2b9a00, '17h 52m'], ['Feuille de Liane', 'rpg/plants-crops/icon_02', '35', '20', '5/20', 'En vente', 0x2b9a00, '12h 06m'], ['Poisson Bleu', 'rpg/fish-loot/icon_00', '95', '6', '6/6', 'Vendu', 0x2a8fd6, '–'], ['Potion de Vie (P)', 'rpg/consumables-potions/icon_00', '250', '4', '0/4', 'En vente', 0x2b9a00, '1j 08h'], ['Fleur Solaire', 'rpg/plants-crops/icon_05', '80', '10', '2/10', 'En vente', 0x2b9a00, '8h 33m']])
        add(list, 'vortex_market_sale_row_xml', (r) => { text(r, 'item_name', name); icon(r, 'item_icon', uri); text(r, 'price_txt', price); text(r, 'qty_txt', qty); text(r, 'sold_txt', sold); text(r, 'status_txt', status); tcolor(r, 'status_txt', c); tint(r, 'status_dot', c === 0x2b9a00 ? 0x4cc040 : 0x2a8fd6); text(r, 'time_txt', time); show(r, 'selected', !!sel); });
    pager(find(t, 'pager_slot'), '1 / 1');
    detailHeader('Bois d’Ambre', 'rpg/materials/icon_00', 'Ressource locale', 'Votre objet est actuellement en vente sur l’hôtel des ventes.');
    text(t, 'status_txt', 'En vente'); tcolor(t, 'status_txt', 0x2b9a00); tint(t, 'status_dot', 0x4cc040);
    const d = find(t, 'detail_list'); kv(d, 'Prix unitaire', '48'); kv(d, 'Quantité', '12'); kv(d, 'Vendu', '0 / 12'); kv(d, 'Mis en vente le', '12/04/2024 14:32'); kv(d, 'Expire le', '13/04/2024 14:32'); kv(d, 'Temps restant', '23h 14m');
    kv(find(t, 'fee_slot'), 'Frais de mise en vente', '29'); kv(find(t, 'gain_slot'), 'Gain potentiel', '547', {color: 0x2b9a00});
    text(t, 'offers_title', 'Offres sur cet objet'); text(t, 'offers_hint', 'Le prix le plus bas actuellement est 48. Votre offre est la plus basse du marché.');
}
else
{
    tint(t, 'type_filter_0', 0x6a4c9c);
    text(t, 'sort_menu', 'Plus récent en premier');
    const list = find(t, 'history_list');
    for(const [name, uri, kind, qty, total, unit, other, date] of [['Bois d’Ambre', 'rpg/materials/icon_00', 'Achat', '12', '576', '48', 'Léa', '12/04/2024 14:32'], ['Fragment de Cristal', 'rpg/gems-materials/icon_05', 'Vente', '3', '2 040', '680', 'Marek', '12/04/2024 13:17'], ['Plume d’Aérien', 'rpg/materials/icon_03', 'Vente', '5', '1 600', '320', 'Tomy', '12/04/2024 11:03'], ['Potion de Vie (P)', 'rpg/consumables-potions/icon_00', 'Achat', '6', '1 500', '250', 'Nina', '11/04/2024 22:41'], ['Poisson Bleu', 'rpg/fish-loot/icon_00', 'Achat', '10', '950', '95', 'Sofia', '11/04/2024 18:27'], ['Feuille de Liane', 'rpg/plants-crops/icon_02', 'Vente', '20', '700', '35', 'Aiko', '11/04/2024 16:12'], ['Minerai de Fer', 'rpg/gems-materials/icon_00', 'Achat', '16', '1 920', '120', 'Marek', '10/04/2024 21:06'], ['Fleur Solaire', 'rpg/plants-crops/icon_05', 'Vente', '8', '640', '80', 'Kuro', '10/04/2024 15:33']])
        add(list, 'vortex_market_history_row_xml', (r) => { text(r, 'item_name', name); icon(r, 'item_icon', uri); text(r, 'kind_txt', kind); tcolor(r, 'kind_txt', kind === 'Achat' ? 0x2b9a00 : 0xc30000); icon(r, 'kind_icon', I.cart); tint(r, 'kind_icon', kind === 'Achat' ? 0x40b030 : 0xd23a2a); text(r, 'qty_txt', qty); text(r, 'total_txt', total); text(r, 'unit_txt', unit); text(r, 'other_txt', other); text(r, 'date_txt', date); });
    pager(find(t, 'pager_slot'), '1 / 5');
    detailHeader('Bois d’Ambre', 'rpg/materials/icon_00', 'Achat · 12/04/2024 14:32', 'Acheté à Léa sur l’hôtel des ventes.');
    const d = find(t, 'detail_list'); kv(d, 'Type', 'Achat', {color: 0x2b9a00}); kv(d, 'Quantité', '12'); kv(d, 'Prix unitaire', '48'); kv(d, 'Prix total', '576'); kv(d, 'Contrepartie', 'Léa'); kv(d, 'Date et heure', '12/04/2024 14:32');
    text(t, 'period_0', 'Aujourd’hui'); text(t, 'period_1', '7 jours'); text(t, 'period_2', '30 jours'); tint(t, 'period_1', 0x6a4c9c);
    const s = find(t, 'summary_list'); kv(s, 'Achats', '5 946', {width: 268, color: 0xc30000}); kv(s, 'Ventes', '4 980', {width: 268, color: 0x2b9a00}); kv(s, 'Solde', '-966', {width: 268});
    text(t, 'count_txt', '8 transactions sur 7 jours');
}
