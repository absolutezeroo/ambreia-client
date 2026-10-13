// @include fill_common.js
// Fills the "États – Économie" board (states_economy.xml).
const at = (name) => find(root, name);
const one = (slotName, layout, fill, hover = false) => place(at(slotName), layout, hover ? -1 : 0, hover ? -1 : 0, fill);
const shopRow = (sel) => (r) => { text(r, 'item_name', 'Potion de mana (petite)'); icon(r, 'item_icon', 'rpg/consumables-potions/icon_01'); text(r, 'price_txt', '50'); show(r, 'selected', sel); };
one('shop_normal', 'vortex_shop_row_xml', shopRow(false)); one('shop_hover', 'vortex_shop_row_xml', shopRow(false), true); one('shop_selected', 'vortex_shop_row_xml', shopRow(true));
const listing = (own) => (r) => { text(r, 'item_name', 'Bois d’Ambre'); icon(r, 'item_icon', 'rpg/materials/icon_00'); text(r, 'price_txt', '48'); text(r, 'qty_txt', '12'); text(r, 'seller_txt', own ? '' : 'Léa'); show(r, 'own_pill', own); show(r, 'selected', own); };
one('listing_normal', 'vortex_market_listing_row_xml', listing(false)); one('listing_hover', 'vortex_market_listing_row_xml', listing(false), true); one('listing_own', 'vortex_market_listing_row_xml', listing(true));
const recipe = (o) => (r) => { text(r, 'recipe_name', o.name ?? 'Repas simple'); icon(r, 'recipe_icon', o.uri ?? 'rpg/plants-crops/icon_00'); text(r, 'recipe_category', o.cat ?? 'Cuisine'); text(r, 'recipe_level', o.level ?? 'Niv. 5'); show(r, 'selected', !!o.selected); show(r, 'lock_icon', !!o.locked); if(o.locked) { tint(r, 'recipe_icon', 0x8080a0); tcolor(r, 'recipe_name', 0x8a94a0); } };
one('recipe_normal', 'vortex_craft_recipe_row_xml', recipe({})); one('recipe_fav', 'vortex_craft_recipe_row_xml', recipe({selected: true})); one('recipe_locked', 'vortex_craft_recipe_row_xml', recipe({name: 'Poutre raffinée', uri: 'rpg/materials/icon_00', cat: 'Menuiserie', level: 'Niv. 15', locked: true}));
const order = (sel) => (r) => { r.width = 240; find(r, 'selected').width = 240; text(r, 'npc_name', 'Guide d’Avoria'); text(r, 'order_title', 'Cannes à pêche'); icon(r, 'item_icon', 'rpg/weapons/icon_12'); text(r, 'order_progress', '0/5'); text(r, 'order_gold', '400'); text(r, 'order_time', ''); find(r, 'open_button').x = 216; show(r, 'selected', sel); };
one('order_normal', 'vortex_craft_order_row_xml', order(false)); one('order_selected', 'vortex_craft_order_row_xml', order(true));

const statuses = at('status_list');
for(const [label, c, uri, i] of [['En vente', 0x4cc040], ['Vendu', 0x4cc040], ['Expiré', 0xd23a2a], ['Retiré', 0xd23a2a], ['Terminée', 0xffd040]].map((s, i) => [...s, null, i]))
    place(statuses, 'vortex_social_section_header_xml', 0, i * 28, (h) => { h.width = 300; text(h, 'section_txt', label); tint(h, 'status_dot', c); show(h, 'chevron', false); });
const bars = at('bars');
for(const [label, px, c, i] of [['En cours', 90, 0x2a8fd6], ['Terminée', 200, 0x6cbb2d], ['En pause', 110, 0xf0c030], ['Erreur', 60, 0xd23a2a]].map((b, i) => [...b, i]))
    place(bars, 'vortex_quest_progress_xml', 0, 0, (p) => { p.visible = false; }),
    place(bars, 'vortex_craft_queue_row_xml', 0, i * 26, (r) => { r.width = 300; text(r, 'item_name', label); text(r, 'item_qty', ''); text(r, 'points', ''); icon(r, 'item_icon', I.clock); tint(r, 'item_icon', c); bar(r, 'progress', Math.round(px * 0.6)); const f = find(find(r, 'progress'), 'fill'); f.color = c; find(r, 'progress').width = 120; find(find(r, 'progress'), 'bg').width = 120; text(r, 'time_txt', ''); show(r, 'cancel_button', false); });
const ms = at('milestones');
[['Niv. 5', 'Bois exotique débloqué', I.tree, 'done'], ['Niv. 15', 'Nouvelle recette débloquée', I.lock, 'locked'], ['Niv. 10', '+10 % rendement', 'rpg/plants-crops/icon_02', 'hover']].forEach(([level, label, uri, state], i) => place(ms, 'vortex_craft_milestone_xml', i * 130 + (state === 'hover' ? -1 : 0), state === 'hover' ? -1 : 0, (m) => { text(m, 'milestone_level', level); text(m, 'milestone_label', label); icon(m, 'milestone_icon', uri); if(state === 'locked') { tint(m, null, 0xe8e8e2); icon(m, 'state_icon', I.lock); tint(m, 'state_icon', 0x8a94a0); tint(m, 'milestone_icon', 0x8a94a0); } else { tint(m, null, 0xd8f0c0); icon(m, 'state_icon', I.check); } }));
pager(at('pager'), '1 / 5');
quantity(at('quantity'), '12'); quantity(at('quantity_max'), '1', {max: true});
const bankSlot = (slotName, o) => one(slotName, 'vortex_inventory_item_slot_xml', (s) => { if(o.uri) icon(s, 'item_icon', o.uri); else show(s, 'item_icon', false); text(s, 'item_count', o.count ?? ''); show(s, 'new_dot', !!o.isNew); show(s, 'lock_icon', !!o.locked); show(s, 'selected', !!o.selected); if(o.locked) tint(s, 'item_icon', 0x8080a0); }, !!o.hover);
bankSlot('slot_empty', {}); bankSlot('slot_new', {uri: 'rpg/plants-crops/icon_02', count: '8', isNew: true}); bankSlot('slot_stack', {uri: 'rpg/fish-loot/icon_03', count: '16'}); bankSlot('slot_locked', {uri: 'rpg/dungeon-objects/icon_37', count: '1', locked: true});
bankSlot('slot_hover', {uri: 'rpg/plants-crops/icon_02', count: '32', hover: true}); bankSlot('slot_selected', {uri: 'rpg/materials/icon_00', count: '124', selected: true});

const menu = (slotName, rows) => place(at(slotName), 'vortex_ui_menu_xml', 0, 0, (m) => {
    const h = rows.length * 25 + 12; m.height = h; find(m, 'menu_frame').height = h; find(m, 'menu_list').height = h - 12;
    for(const [l, uri, c, danger] of rows) add(find(m, 'menu_list'), 'vortex_ui_menu_row_xml', (r) => { text(r, 'row_label', l); icon(r, 'row_icon', uri); tint(r, 'row_icon', c); if(danger) tcolor(r, 'row_label', 0xb02818); });
});
menu('menu_listing', [['Modifier le prix', 'rpg/ui-icons/tools_crafting_graphic_design_pencil_icon', 0x5a4a7a], ['Retirer la vente', I.x, 0xd23a2a, true], ['Voir l’objet', 'rpg/ui-icons/media_eyeball_vision_shown_icon', 0x2a8fd6], ['Voir l’historique', I.scroll, 0xd8a060]]);
menu('menu_bank', [['Retirer une quantité', 'rpg/ui-icons/software_file_document_page_arrow_send_export_icon', 0x2a8fd6], ['Retirer la pile', 'rpg/ui-icons/boardgames_tetris_piece_block_icon', 0x2a8fd6], ['Déposer', 'rpg/ui-icons/software_file_document_page_arrow_send_import_icon', 0x9a9a9a], ['Jeter l’objet', 'rpg/ui-icons/software_trashcan_garbage_bin_rubbish_delete_erase_1_icon', 0xd23a2a, true]]);
place(at('edit_price'), 'vortex_market_edit_price_xml', 0, 0, (e) => { icon(e, 'detail_icon', 'rpg/materials/icon_00'); text(e, 'item_name', 'Bois d’Ambre'); text(e, 'current_price_txt', 'Prix actuel : 48'); text(e, 'price_input', '50'); });
place(at('withdraw'), 'vortex_bank_quantity_xml', 0, 0, (w) => { icon(w, 'detail_icon', 'rpg/materials/icon_00'); text(w, 'item_name', 'Bois d’Ambre'); text(w, 'available_txt', 'Quantité disponible : 124'); text(w, 'quantity_txt', '37'); });
place(at('bonus'), 'vortex_craft_bonus_xml', 0, 0, (b) => { text(b, 'bonus_title', 'Spécialisation : Bois noble'); text(b, 'bonus_desc', '+12 % de chance d’obtenir du bois rare.'); });
place(at('confirm_withdraw'), 'vortex_ui_confirm_xml', 0, 0, (c) => { c.caption = 'Retirer la vente ?'; text(c, 'message', 'Êtes-vous sûr de vouloir retirer cet objet de l’hôtel des ventes ? Il sera rendu dans votre inventaire.'); text(c, 'confirm_button', 'Retirer'); icon(c, 'confirm_icon', 'rpg/ui-icons/software_warning_sign_triangle_exclaimation_mark_error_icon'); });
place(at('tip_commission'), 'vortex_hud_tip_xml', 0, 0, (w) => { text(w, 'tip_title', 'Commission (5 %)'); text(w, 'tip_txt', 'Appliquée à la mise en vente, déduite automatiquement lors de la vente.'); icon(w, 'tip_icon', I.coin); tint(w, 'tip_icon', 0xf0c030); });
place(at('tip_item'), 'vortex_inventory_tip_xml', 0, 0, (t) => { icon(t, 'tip_icon', 'rpg/gems-materials/icon_05'); text(t, 'tip_name', 'Cristal lunaire'); text(t, 'tip_kind', 'Matériau rare'); tcolor(t, 'tip_kind', 0x8a3ad0); text(t, 'tip_rarity', ''); text(t, 'tip_desc', 'Un cristal imprégné d’énergie lunaire. Utilisé dans des fabrications de haut niveau.'); text(t, 'tip_quantity', 'Poids : 0,2 · Valeur : 250'); });
place(at('tip_time'), 'vortex_hud_tip_xml', 0, 0, (w) => { text(w, 'tip_title', '2h 14m'); text(w, 'tip_txt', 'Temps restant avant expiration de la commande.'); icon(w, 'tip_icon', I.clock); tint(w, 'tip_icon', 0x8ac8ff); });
place(at('merchant'), 'vortex_shop_merchant_note_xml', 0, 0, (n) => text(n, 'merchant_note', 'Bienvenue ! J’ai de quoi équiper pour tes prochaines aventures.'));
