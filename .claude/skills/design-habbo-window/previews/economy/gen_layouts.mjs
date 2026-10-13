// Writes the bank layouts (sheet "Banque") and the popups the shop / market / craft sheets add
// (edit price, craft bonus), plus their texts. Shop, market and craft layouts already exist.
import {bmp, txt, btn, iconBtn, sep, box, cont, list, shape, bar, input, portrait, selectedOverlay, frame, layout, write, locales, I, C} from '../../tools/ui_helpers.mjs';
const E = {
    bank: 'rpg/ui-icons/map_markers_building_bank_greek_temple_icon', chest: 'rpg/ui-icons/tools_crafting_chest_locked_loot_icon', bag: 'rpg/ui-icons/rpg_loot_bag_money_coins_purse_icon', guild: 'rpg/ui-icons/map_markers_banner_heraldry_icon',
    deposit: 'rpg/ui-icons/software_file_document_page_arrow_send_import_icon', withdraw: 'rpg/ui-icons/software_file_document_page_arrow_send_export_icon', view: 'rpg/ui-icons/software_clipbaord_list_file_copy_paste_icon', gem: 'rpg/ui-icons/rpg_gem_jewelcrafting_diamond_points_currency_icon',
    stack: 'rpg/ui-icons/boardgames_tetris_piece_block_icon', tree: 'rpg/ui-icons/map_markers_tree_forest_pine_icon', cart: 'rpg/ui-icons/software_shopping_cart_icon',
};

// ---------- bank
const tabBody = (prefix, {guild = false} = {}) => layout(`vortex_bank_tab_${prefix}_xml`, 654, 520, cont(0, 0, 654, 520, [
    // toolbar
    box(8, 0, 200, 24, [bmp(4, 4, 16, 16, I.search, {color: '0x888880'}), input(24, 4, 170, 'search_input', '${vortex.bank.search}')], {style: 103, name: 'search_box'}),
    `<dropmenu x="214" y="0" width="120" height="24" params="17" style="3" name="category_menu" caption="\${vortex.bank.all_categories}"/>`,
    `<dropmenu x="340" y="0" width="100" height="24" params="17" style="3" name="sort_menu" caption="\${vortex.bank.sort_name}"/>`,
    iconBtn(446, 0, 'view_button', E.view, {w: 28, h: 24}),
    // grid
    box(8, 30, 466, 356, [list(5, 5, 456, 346, 'item_grid', 4, {grid: true})], {style: 102, name: 'bag'}),
    // capacity
    box(8, 392, 466, 28, [
        bmp(8, 6, 16, 16, E.chest, {color: '0xb08050'}), txt(30, 6, 190, 16, {name: 'capacity_txt', size: 10, bold: true}),
        bar(226, 8, 200, 'capacity_bar', 84, '0x6cbb2d', {text: false}),
        iconBtn(432, 2, 'layout_button', E.view, {w: 28, h: 24}),
    ], {style: 103, name: 'capacity_box'}),
    // purse and actions
    box(8, 426, 466, 36, [
        bmp(8, 10, 16, 16, I.coin, {name: 'gold_icon', color: '0xf0c030'}), txt(30, 10, 80, 16, {name: 'gold_txt', bold: true}),
        bmp(116, 10, 16, 16, E.gem, {name: 'gems_icon', color: '0x40b0e0'}), txt(138, 10, 60, 16, {name: 'gems_txt', bold: true}),
        btn(214, 4, 110, 'deposit_button', '${vortex.bank.deposit}', {style: 301, color: '0xb07a10'}),
        btn(330, 4, 96, 'withdraw_button', '${vortex.bank.withdraw}', {style: 301, color: '0x2a6aa0'}),
        iconBtn(432, 5, 'trash_button', I.trash, {color: '0xd03a2a', w: 28, h: 26}),
    ], {style: 103, name: 'purse'}),
    // guild permission banner
    box(8, 468, 466, 28, [bmp(8, 6, 16, 16, I.info, {color: '0x2a8fd6'}), txt(30, 6, 300, 16, {name: 'permission_txt', caption: '${vortex.bank.guild_permission}', size: 10}), txt(334, 6, 124, 16, {name: 'guild_capacity_txt', size: 10, bold: true, align: 'right'})], {style: 103, name: 'permission_box', hidden: !guild}),
    // detail
    box(482, 0, 164, 462, [
        box(8, 8, 48, 48, [bmp(8, 8, 32, 32, '', {name: 'item_icon', tags: false})], {name: 'item_frame'}),
        txt(62, 10, 96, 32, {name: 'item_name', size: 11, bold: true, multi: true}),
        txt(62, 42, 96, 14, {name: 'item_kind', size: 9, color: C.sub}),
        sep(8, 64, 148),
        txt(8, 70, 148, 88, {name: 'item_desc', size: 10, multi: true}),
        txt(8, 164, 148, 14, {name: 'item_quantity', size: 10}),
        txt(8, 180, 148, 14, {name: 'item_weight', size: 10}),
        box(8, 202, 70, 20, [txt(0, 2, 70, 16, {name: 'tag_1_txt', size: 9, bold: true, color: C.panelTitle, align: 'center'})], {name: 'tag_1', hidden: true}),
        box(84, 202, 72, 20, [txt(0, 2, 72, 16, {name: 'tag_2_txt', size: 9, bold: true, color: C.panelTitle, align: 'center'})], {name: 'tag_2', hidden: true}),
        sep(8, 232, 148),
        btn(8, 242, 148, 'withdraw_some_button', '${vortex.bank.withdraw_some}', {style: 301, color: '0x2a6aa0'}),
        btn(8, 276, 148, 'withdraw_stack_button', '${vortex.bank.withdraw_stack}', {style: 301, color: '0x2a6aa0'}),
        btn(8, 310, 148, 'deposit_item_button', '${vortex.bank.deposit}', {style: 301, color: '0x9a9a9a'}),
        cont(0, 0, 164, 462, [box(58, 140, 48, 48, [bmp(8, 8, 32, 32, E.chest, {color: '0x808078', zoom: 2})]), txt(8, 196, 148, 48, {name: 'empty_message', caption: '${vortex.bank.no_selection}', size: 10, color: '0x888888', align: 'center', multi: true})], {name: 'no_selection', hidden: true}),
    ], {style: 103, name: 'detail'}),
], {name: 'tab_root'}));
write('vortex_bank_tab_bag_xml', tabBody('bag'));
write('vortex_bank_tab_personal_xml', tabBody('personal'));
write('vortex_bank_tab_guild_xml', tabBody('guild', {guild: true}));
write('vortex_bank_xml', frame('vortex_bank_xml', 660, 600, '${vortex.bank.title}', [
    `<tab_context x="6" y="2" width="640" height="32" params="17" style="3" name="tab_context">
  <children>
    <tab_button x="0" y="0" width="150" height="32" params="17" style="3" name="tab_bag" caption="\${vortex.bank.tab.bag}" id="1"/>
    <tab_button x="150" y="0" width="170" height="32" params="17" style="3" name="tab_personal" caption="\${vortex.bank.tab.personal}" id="2"/>
    <tab_button x="320" y="0" width="170" height="32" params="17" style="3" name="tab_guild" caption="\${vortex.bank.tab.guild}" id="3"/>
  </children>
</tab_context>`,
    cont(0, 40, 654, 520, [], {name: 'tab_content'}),
]));
// withdraw quantity popup (stepper + Max)
write('vortex_bank_quantity_xml', frame('vortex_bank_quantity_xml', 300, 176, '${vortex.bank.withdraw_some}', [
    box(8, 4, 48, 48, [bmp(8, 8, 32, 32, '', {name: 'item_icon', tags: false})], {name: 'item_frame'}),
    txt(64, 8, 228, 18, {name: 'item_name', size: 12, bold: true, color: C.title}),
    txt(64, 28, 228, 14, {name: 'available_txt', size: 10, color: C.light}),
    iconBtn(8, 64, 'minus_button', I.minus, {w: 32, h: 28}),
    box(44, 64, 120, 28, [txt(0, 7, 120, 16, {name: 'quantity_txt', size: 12, bold: true, align: 'center'})], {style: 102, name: 'quantity_box'}),
    iconBtn(168, 64, 'plus_button', I.plus, {w: 32, h: 28}),
    btn(208, 64, 84, 'max_button', '${vortex.shop.max}', {style: 301, color: '0x8c8c86'}),
    btn(8, 104, 138, 'cancel_button', '${vortex.ui.cancel}', {style: 301, color: '0x8c8c86'}),
    btn(154, 104, 138, 'confirm_button', '${vortex.bank.withdraw}', {style: 301, color: '0x2a6aa0'}),
]));
locales('bank', {
    'vortex.bank.title': 'Banque', 'vortex.bank.tab.bag': 'Sac', 'vortex.bank.tab.personal': 'Coffre personnel', 'vortex.bank.tab.guild': 'Coffre de guilde', 'vortex.bank.search': 'Rechercher un objet...', 'vortex.bank.all_categories': 'Toutes catégories', 'vortex.bank.sort_name': 'Trier : Nom',
    'vortex.bank.capacity': '%used% / %max% emplacements utilisés', 'vortex.bank.deposit': 'Déposer', 'vortex.bank.withdraw': 'Retirer', 'vortex.bank.withdraw_some': 'Retirer une quantité', 'vortex.bank.withdraw_stack': 'Retirer la pile', 'vortex.bank.drop': 'Jeter l’objet', 'vortex.bank.no_selection': 'Sélectionnez un objet pour voir ses détails.',
    'vortex.bank.available': 'Quantité disponible : %count%', 'vortex.bank.quantity': 'Quantité : %count%', 'vortex.bank.weight': 'Poids : %unit% (%total% au total)', 'vortex.bank.guild_permission': 'Vous avez un accès Dépôt uniquement.', 'vortex.bank.guild_capacity': '%used% / %max%',
}, {
    'vortex.bank.title': 'Bank', 'vortex.bank.tab.bag': 'Bag', 'vortex.bank.tab.personal': 'Personal chest', 'vortex.bank.tab.guild': 'Guild chest', 'vortex.bank.search': 'Search an item...', 'vortex.bank.all_categories': 'All categories', 'vortex.bank.sort_name': 'Sort: Name',
    'vortex.bank.capacity': '%used% / %max% slots used', 'vortex.bank.deposit': 'Deposit', 'vortex.bank.withdraw': 'Withdraw', 'vortex.bank.withdraw_some': 'Withdraw a quantity', 'vortex.bank.withdraw_stack': 'Withdraw the stack', 'vortex.bank.drop': 'Drop the item', 'vortex.bank.no_selection': 'Select an item to see its details.',
    'vortex.bank.available': 'Available: %count%', 'vortex.bank.quantity': 'Quantity: %count%', 'vortex.bank.weight': 'Weight: %unit% (%total% total)', 'vortex.bank.guild_permission': 'You have Deposit-only access.', 'vortex.bank.guild_capacity': '%used% / %max%',
});

// ---------- market: edit price popup
write('vortex_market_edit_price_xml', frame('vortex_market_edit_price_xml', 300, 176, '${vortex.market.edit_price}', [
    box(8, 4, 48, 48, [bmp(8, 8, 32, 32, '', {name: 'item_icon', tags: false})], {name: 'item_frame'}),
    txt(64, 8, 228, 18, {name: 'item_name', size: 12, bold: true, color: C.title}),
    bmp(64, 28, 16, 16, I.coin, {color: '0xf0c030'}), txt(84, 28, 208, 16, {name: 'current_price_txt', size: 10, color: C.light}),
    txt(8, 66, 140, 16, {caption: '${vortex.market.new_unit_price}', size: 10, color: C.light}),
    box(150, 62, 110, 24, [input(6, 4, 98, 'price_input', '')], {style: 102, name: 'price_box'}),
    iconBtn(264, 62, 'price_up', I.up, {w: 28, h: 12}), iconBtn(264, 74, 'price_down', I.down, {w: 28, h: 12}),
    btn(8, 104, 138, 'cancel_button', '${vortex.ui.cancel}', {style: 301, color: '0x8c8c86'}),
    btn(154, 104, 138, 'confirm_button', '${vortex.ui.confirm}', {style: 301, color: '0x2f9e2f'}),
]));
locales('market', {'vortex.market.new_unit_price': 'Nouveau prix unitaire', 'vortex.market.withdraw_confirm': 'Êtes-vous sûr de vouloir retirer cet objet de l’hôtel des ventes ? Il sera rendu dans votre inventaire.', 'vortex.market.commission_help': 'Une commission de 5 % est appliquée lors de la mise en vente. Elle est déduite automatiquement lors de la vente.', 'vortex.market.lowest_help': 'Prix le plus bas actuellement sur le marché pour cet objet.'},
    {'vortex.market.new_unit_price': 'New unit price', 'vortex.market.withdraw_confirm': 'Withdraw this item from the auction house? It goes back to your inventory.', 'vortex.market.commission_help': 'A 5% commission applies when listing. It is deducted automatically on sale.', 'vortex.market.lowest_help': 'Lowest price currently on the market for this item.'});

// ---------- craft: specialisation bonus popup
write('vortex_craft_bonus_xml', frame('vortex_craft_bonus_xml', 300, 150, '${vortex.craft.specialisation}', [
    box(8, 4, 48, 48, [bmp(8, 8, 32, 32, E.tree, {name: 'bonus_icon', color: '0x2f9e2f', zoom: 2})], {name: 'bonus_frame'}),
    txt(64, 6, 228, 16, {name: 'bonus_title', size: 11, bold: true, color: C.title}),
    txt(64, 24, 228, 32, {name: 'bonus_desc', size: 10, color: C.light, multi: true}),
    btn(8, 78, 284, 'close_button', '${vortex.ui.close}', {style: 301, color: '0x2a6aa0'}),
]));
locales('craft', {'vortex.craft.specialisation': 'Spécialisation / bonus', 'vortex.craft.cancel_confirm': 'Voulez-vous vraiment annuler cette fabrication ?', 'vortex.craft.accept_order_confirm': 'Vous vous engagez à terminer cette commande pour %name%.', 'vortex.craft.time_left_help': 'Temps restant avant expiration de la commande.'},
    {'vortex.craft.specialisation': 'Specialisation / bonus', 'vortex.craft.cancel_confirm': 'Really cancel this craft?', 'vortex.craft.accept_order_confirm': 'You commit to finish this order for %name%.', 'vortex.craft.time_left_help': 'Time left before the order expires.'});
locales('rpg-common', {'vortex.ui.close': 'Fermer', 'vortex.ui.yes': 'Oui', 'vortex.ui.no': 'Non'}, {'vortex.ui.close': 'Close', 'vortex.ui.yes': 'Yes', 'vortex.ui.no': 'No'});
console.log('economy layouts written');
