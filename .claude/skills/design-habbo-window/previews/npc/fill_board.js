// Fills the "États – Dialogues PNJ" board (states_npc.xml).
const at = (name) => find(root, name);
const I = {
    chat: 'rpg/ui-icons/software_speech_bubble_three_dots_dialogue_icon', scroll: 'rpg/ui-icons/tools_crafting_writing_parchment_scroll_document_icon', bag: 'rpg/ui-icons/rpg_loot_bag_money_coins_purse_icon',
    x: 'rpg/ui-icons/software_signs_maths_multiplication_x_crossout_checkmark_cancel_icon', lock: 'rpg/ui-icons/map_markers_doorway_enterance_exit_locked_icon', lamp: 'rpg/ui-icons/software_warning_sign_circle_exclaimation_mark_error_icon',
    gear: 'rpg/ui-icons/software_options_settings_cogwheel_gear_mechanics_icon', check: 'rpg/ui-icons/software_signs_checkmark_checkbox_ticked_todo_icon', chest: 'rpg/ui-icons/tools_crafting_chest_locked_loot_icon',
    shop: 'rpg/ui-icons/map_markers_store_shopping_bag_1_icon', tp: 'rpg/ui-icons/map_markers_location_pin_small_icon', hammer: 'rpg/ui-icons/software_options_settings_tools_mechanics_wrench_icon', anvil: 'rpg/ui-icons/tools_crafting_chest_locked_loot_2_icon',
    warn: 'rpg/ui-icons/software_warning_sign_triangle_exclaimation_mark_error_icon', coin: 'rpg/ui-icons/rpg_coin_gold_currency_money_gp_icon',
};
const choice = (list, label, uri, c, {selected = false, locked = false} = {}) => add(list, 'vortex_npc_choice_row_xml', (r) => {
    text(r, 'choice_txt', label); icon(r, 'choice_icon', uri); tint(r, 'choice_icon', c); show(r, 'selected', selected);
    if(locked) { tint(r, null, 0xf0b0a8); icon(r, 'choice_icon', I.lock); tint(r, 'choice_icon', 0xd23a2a); tcolor(r, 'choice_txt', 0xb02818); }
});
const dialog = (slotName, {name, role, status, statusIcon, statusColor, txt: body, choices = [], objective = null, rewards = null, action = null, height}) => place(at(slotName), 'vortex_npc_dialog_xml', 0, 0, (d) => {
    text(d, 'npc_name', name); text(d, 'npc_role', role); text(d, 'dialog_txt', body);
    if(status) { show(d, 'status_badge', true); text(d, 'status_txt', status); icon(d, 'status_icon', statusIcon); tint(d, 'status_icon', statusColor); }
    const cl = find(d, 'choice_list'); show(d, 'choice_list', choices.length > 0);
    for(const [l, uri, c, o] of choices) choice(cl, l, uri, c, o);
    if(choices.length) cl.height = choices.length * 46;
    const bodyBox = find(d, 'dialog_box'); const lines = Math.ceil(body.length / 52); bodyBox.height = 16 + lines * 18; find(d, 'dialog_txt').height = lines * 18;
    if(objective) { show(d, 'objective_box', true); text(d, 'objective_txt', objective.txt); bar(d, 'objective_bar', objective.px); text(d, 'objective_count', objective.count); }
    if(rewards) { show(d, 'reward_list', true); const rl = find(d, 'reward_list'); for(const [uri, n, c] of rewards) add(rl, 'vortex_inventory_item_slot_xml', (s) => { icon(s, 'item_icon', uri); if(c) tint(s, 'item_icon', c); text(s, 'item_count', n); }); }
    if(action) { show(d, 'action_button', true); text(d, 'action_button', action); }
    d.height = height;
});
dialog('dialog_main', {name: 'Intendant', role: 'PNJ - Services', txt: 'Bienvenue à Ambre, voyageur ! Notre ville offre de nombreux services pour vous aider dans vos aventures. Que puis-je faire pour vous aujourd’hui ?', height: 420,
    choices: [['Parler de la ville.', I.chat, 0x2a8fd6, {selected: true}], ['Voir les quêtes disponibles.', I.scroll, 0xd8a060], ['Quels services proposez-vous ?', I.bag, 0xd8a060], ['Niveau 20 requis', I.lock, 0, {locked: true}], ['Au revoir.', I.x, 0xd23a2a]]});
dialog('dialog_available', {name: 'Messager', role: 'PNJ - Quêtes', status: 'Quête disponible', statusIcon: I.lamp, statusColor: 0xffd040, txt: 'J’ai une nouvelle mission pour vous. La ville a besoin d’aide et je pense que vous êtes la personne idéale pour cette tâche.', action: 'Accepter la quête', height: 260});
dialog('dialog_progress', {name: 'Intendant', role: 'PNJ - Services', status: 'Quête en cours', statusIcon: I.gear, statusColor: 0x8a94a0, txt: 'Vous travaillez déjà sur cette quête. Continuez vos efforts, vous y êtes presque !', objective: {txt: 'Collecter des Bois d’Ambre', px: 120, count: '2 / 5'}, height: 250});
dialog('dialog_done', {name: 'Léa', role: 'PNJ - Quêtes', status: 'Quête terminée', statusIcon: I.check, statusColor: 0x40b030, txt: 'Excellent ! Vous avez accompli tout ce que je vous avais demandé. Voici votre récompense, comme convenu.', action: 'Recevoir la récompense', height: 250});
dialog('dialog_reward', {name: 'Léa', role: 'PNJ - Quêtes', status: 'Remise de récompense', statusIcon: I.chest, statusColor: 0xd8a060, txt: 'Merci encore pour votre aide ! Voici ce que je vous offre pour votre travail.', rewards: [[I.coin, '500', 0xf0c030], ['rpg/consumables-potions/icon_00', '10'], ['rpg/materials/icon_00', '5'], ['rpg/gems-materials/icon_00', '2']], action: 'Récupérer les récompenses', height: 300});

place(at('npc_menu'), 'vortex_npc_menu_xml', 0, 0, (m) => {
    text(m, 'npc_name', 'Intendant'); text(m, 'npc_role', 'PNJ - Services');
    const l = find(m, 'menu_list');
    for(const [t, uri, c, sel] of [['Parler', I.chat, 0x2a8fd6, true], ['Quêtes', I.scroll, 0xd8a060], ['Boutique', I.shop, 0xd8a060], ['Téléportation', I.tp, 0x2a8fd6], ['Réparer', I.hammer, 0x6a6a72], ['Fabriquer', I.anvil, 0x6a6a72]]) add(l, 'vortex_ui_menu_row_xml', (r) => { text(r, 'row_label', t); icon(r, 'row_icon', uri); tint(r, 'row_icon', c); if(sel) tint(r, null, 0xffd890); });
});
place(at('marker_quest'), 'vortex_npc_marker_xml', 0, 0);
place(at('marker_talk'), 'vortex_npc_marker_xml', 0, 0, (m) => { show(m, 'marker_icon', false); show(m, 'talk_icon', true); });
place(at('prompt'), 'vortex_npc_prompt_xml', 0, 0);
place(at('warning'), 'vortex_hud_alert_xml', 0, 0, (a) => { a.width = 520; find(a, 'alert').width = 520; text(a, 'alert_txt', 'Vous devez terminer la quête précédente avant d’accéder à ce service.'); find(a, 'alert_txt').width = 460; });
const toast = (slotName, c, title, body, uri, ic) => place(at(slotName), 'vortex_hud_toast_xml', 0, 0, (t) => { tint(t, 'toast_frame', c); text(t, 'toast_title', title); text(t, 'toast_txt', body); icon(t, 'toast_icon', uri); tint(t, 'toast_icon', 0xffffff); icon(t, 'toast_mark', ic); tint(t, 'toast_mark', 0xffffff); });
toast('toast_ok', 0x2f7a2f, 'Quête acceptée !', 'Elle a été ajoutée à votre journal.', I.scroll, I.check);
toast('toast_err', 0xb02818, 'Impossible d’effectuer cette action.', 'Veuillez réessayer plus tard.', I.warn, I.x);
place(at('confirm'), 'vortex_ui_confirm_xml', 0, 0, (c) => { c.caption = 'Confirmation'; text(c, 'message', 'Êtes-vous sûr de vouloir accepter cette quête ?'); });
const one = (slotName, label, uri, c, o, dx = 0) => place(at(slotName), 'vortex_npc_choice_row_xml', dx, dx, (r) => { r.width = 350; find(r, 'selected').width = 350; find(r, 'choice_txt').width = 276; find(r, 'chevron').x = 326; text(r, 'choice_txt', label); icon(r, 'choice_icon', uri); tint(r, 'choice_icon', c); show(r, 'selected', !!o.selected); if(o.locked) { tint(r, null, 0xf0b0a8); icon(r, 'choice_icon', I.lock); tint(r, 'choice_icon', 0xd23a2a); tcolor(r, 'choice_txt', 0xb02818); } });
one('choice_normal', 'Parler de la ville.', I.chat, 0x2a8fd6, {});
one('choice_hover', 'Parler de la ville.', I.chat, 0x2a8fd6, {}, -1);
one('choice_selected', 'Parler de la ville.', I.chat, 0x2a8fd6, {selected: true});
one('choice_locked', 'Niveau 20 requis', I.lock, 0, {locked: true});
place(at('tip'), 'vortex_inventory_tip_xml', 0, 0, (t) => { icon(t, 'tip_icon', 'rpg/gems-materials/icon_00'); text(t, 'tip_name', 'Minerai de Fer'); text(t, 'tip_kind', 'Ressource'); text(t, 'tip_rarity', ''); text(t, 'tip_desc', 'Un minerai commun utilisé pour la forge. On en trouve dans les montagnes d’Ambre.'); text(t, 'tip_quantity', 'Valeur : 25'); });
