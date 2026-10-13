// Fills the "États – Courrier et échange" board (states_inbox.xml).
const at = (name) => find(root, name);
const I = {
    unread: 'rpg/ui-icons/software_email_message_unread_closed_icon', read: 'rpg/ui-icons/software_email_message_read_opened_icon', gift: 'rpg/ui-icons/rpg_gift_present_icon', coin: 'rpg/ui-icons/rpg_coin_gold_currency_money_gp_icon',
    pin: 'rpg/ui-icons/software_pin_board_1_icon', clip: 'rpg/ui-icons/software_paper_clip_attachment_file_icon', expired: 'rpg/ui-icons/software_clock_time_wait_chronometer_timer_countdown_icon', trash: 'rpg/ui-icons/software_trashcan_garbage_bin_rubbish_delete_erase_1_icon',
    inbox: 'rpg/ui-icons/software_email_mailbox_unread_new_messages_icon', sent: 'rpg/ui-icons/software_email_message_forward_send_icon', system: 'rpg/ui-icons/software_options_settings_cogwheel_gear_mechanics_icon', scroll: 'rpg/ui-icons/tools_crafting_writing_parchment_scroll_document_icon',
    check: 'rpg/ui-icons/software_signs_checkmark_checkbox_ticked_todo_icon', download: 'rpg/ui-icons/software_internet_download_save_to_disk_icon', warn: 'rpg/ui-icons/software_warning_sign_triangle_exclaimation_mark_error_icon',
};
const KIND = {unread: [I.unread, 0xf0c030, true], read: [I.read, 0x8a94a0, false], gift: [I.gift, 0xd23a2a, true], system: [I.coin, 0xf0c030, false], scroll: [I.scroll, 0xd8a060, false]};
const message = (list, {sender, subject, time, kind = 'read', marker = null, markerColor = 0x6a6a72, selected = false, hover = false}) => {
    const fill = (r) => {
        text(r, 'sender_txt', sender); text(r, 'subject_txt', subject); text(r, 'time_txt', time);
        const [uri, c, bold] = KIND[kind]; icon(r, 'message_icon', uri); tint(r, 'message_icon', c);
        if(!bold) { find(r, 'sender_txt').textStyle = 'u_regular'; }
        if(marker) { show(r, 'marker_icon', true); icon(r, 'marker_icon', marker); tint(r, 'marker_icon', markerColor); }
        show(r, 'selected', selected);
        if(hover) { r.x -= 1; r.y -= 1; }
    };
    return typeof list === 'string' ? place(at(list), 'vortex_inbox_message_row_xml', 0, 0, fill) : add(list, 'vortex_inbox_message_row_xml', fill);
};
const MESSAGES = [
    {sender: 'Équipe d’Ambre', subject: 'Bienvenue à Ambre !', time: 'Il y a 5 min', kind: 'gift', marker: I.clip, selected: true},
    {sender: 'Marek', subject: 'Re: Expédition samedi', time: 'Il y a 1 h', kind: 'read'},
    {sender: 'Système', subject: 'Récompense de connexion', time: 'Il y a 3 h', kind: 'system', marker: I.pin, markerColor: 0xd8a030},
    {sender: 'Léa', subject: 'On se retrouve ce soir ?', time: 'Il y a 5 h', kind: 'unread'},
    {sender: 'Hôtel des Impôts', subject: 'Rappel : taxes de guilde', time: 'Il y a 1 j', kind: 'scroll'},
    {sender: 'Marchand d’Ambre', subject: 'Votre commande est arrivée', time: 'Il y a 2 j', kind: 'gift', marker: I.expired, markerColor: 0xd23a2a},
];
place(at('inbox'), 'vortex_inbox_xml', 0, 0, (w) => {
    const cats = find(w, 'category_list');
    for(const [label, uri, count, selected] of [['Boîte de réception', I.inbox, '4', true], ['Envoyés', I.sent, ''], ['Système', I.system, '2'], ['Récompenses', I.gift, '1'], ['Corbeille', I.trash, '']])
        add(cats, 'vortex_inbox_category_row_xml', (r) => { text(r, 'category_txt', label); icon(r, 'category_icon', uri); show(r, 'selected', !!selected); if(count) { show(r, 'count_badge', true); text(r, 'count_txt', count); } });
    const list = find(w, 'message_list');
    for(const m of MESSAGES) message(list, m);
    icon(w, 'read_icon', I.gift); text(w, 'read_sender', 'Équipe d’Ambre'); text(w, 'read_time', 'Il y a 5 min'); text(w, 'read_subject', 'Bienvenue à Ambre !');
    text(w, 'read_body', 'Bonjour Clayton,\n\nBienvenue dans la ville d’Ambre !\n\nPour vous aider dans vos premiers pas, nous vous offrons un petit kit d’aventurier. De nouvelles quêtes et de nombreux défis vous attendent !\n\nBonne aventure,\nL’équipe d’Ambre');
    show(w, 'attachments_box', true); text(w, 'attachments_title', 'Pièces jointes (3)');
    const al = find(w, 'attachment_list');
    for(const [uri, n, c] of [[I.coin, '500', 0xf0c030], ['rpg/consumables-potions/icon_00', '10'], ['rpg/dungeon-objects/icon_37', '1']]) add(al, 'vortex_inventory_item_slot_xml', (s) => { icon(s, 'item_icon', uri); if(c) tint(s, 'item_icon', c); text(s, 'item_count', n); });
});
message('msg_unread', {sender: 'Équipe d’Ambre', subject: 'Bienvenue à Ambre !', time: 'Il y a 5 min', kind: 'unread', marker: I.clip});
message('msg_read', {sender: 'Marek', subject: 'Re: Expédition samedi', time: 'Il y a 1 h', kind: 'read'});
message('msg_hover', {sender: 'Léa', subject: 'On se retrouve ce soir ?', time: 'Il y a 5 h', kind: 'read', hover: true});
message('msg_selected', {sender: 'Système', subject: 'Récompense de connexion', time: 'Il y a 3 h', kind: 'gift', marker: I.pin, markerColor: 0xd8a030, selected: true});
message('msg_attach', {sender: 'Arthas', subject: 'Matériaux pour la guilde', time: 'Il y a 6 h', kind: 'read', marker: I.clip});
message('msg_system', {sender: 'Système', subject: 'Maintenance terminée', time: 'Il y a 1 j', kind: 'system'});
message('msg_pinned', {sender: 'Marek', subject: 'Stratégie donjon', time: 'Il y a 2 j', kind: 'read', marker: I.pin, markerColor: 0xd8a030});
message('msg_expired', {sender: 'Marchand d’Ambre', subject: 'Votre commande a expiré', time: 'Il y a 5 j', kind: 'gift', marker: I.expired, markerColor: 0xd23a2a});
place(at('toast_sent'), 'vortex_hud_toast_xml', 0, 0, (t) => { t.width = 230; find(t, 'toast_frame').width = 230; tint(t, 'toast_frame', 0x2f7a2f); text(t, 'toast_title', 'Message envoyé !'); text(t, 'toast_txt', 'Envoyé à Marek.'); icon(t, 'toast_icon', I.check); tint(t, 'toast_icon', 0xffffff); icon(t, 'toast_mark', 'rpg/ui-icons/software_signs_maths_multiplication_x_crossout_checkmark_cancel_icon'); tint(t, 'toast_mark', 0xffffff); find(t, 'toast_mark').x = 204; for(const n of ['toast_title', 'toast_txt']) find(t, n).width = 150; });
place(at('tip_attach'), 'vortex_inventory_tip_xml', 0, 0, (t) => { t.width = 230; find(t, 'tip_frame').width = 230; icon(t, 'tip_icon', 'rpg/materials/icon_00'); text(t, 'tip_name', 'Bois d’Ambre'); text(t, 'tip_kind', 'Objet de quête'); text(t, 'tip_rarity', ''); text(t, 'tip_desc', 'Un bois solide issu des forêts d’Ambre. Très utilisé pour l’artisanat.'); text(t, 'tip_quantity', 'Progression : 2 / 5'); for(const n of ['tip_name', 'tip_desc', 'tip_quantity']) find(t, n).width = 214 - (n === 'tip_name' ? 58 : 0); });

place(at('compose'), 'vortex_inbox_compose_xml', 0, 0, (c) => {
    text(c, 'recipient_input', 'Marek'); text(c, 'subject_input', 'Expédition samedi'); text(c, 'message_input', 'Salut !\nOn se retrouve samedi pour l’expédition au donjon ?\n\nÀ bientôt !');
    place(find(c, 'attach_slot'), 'vortex_inbox_attach_slot_xml', 0, 0, (s) => { icon(s, 'item_icon', 'rpg/materials/icon_00'); text(s, 'item_name', 'Bois d’Ambre'); text(s, 'item_count', '1'); });
});
const OWN = [['rpg/materials/icon_00', '12'], ['rpg/gems-materials/icon_00', '8', true], ['rpg/plants-crops/icon_02', '4']];
const OTHER = [['rpg/gems-materials/icon_00', '10'], ['rpg/dungeon-objects/icon_05', '1']];
const trade = (slotName, {ownReady = false, otherReady = false, locked = false, confirmCaption = 'Confirmer l’échange', confirmColor = 0x9a9a9a, status = null}) => place(at(slotName), 'vortex_trade_xml', 0, 0, (t) => {
    text(t, 'own_name', 'Clayton'); text(t, 'own_level', 'Niv. 32'); text(t, 'other_name', 'Marek'); text(t, 'other_level', 'Niv. 28');
    show(t, 'own_ready', ownReady); show(t, 'other_ready', otherReady);
    for(const [prefix, items] of [['own_', OWN], ['other_', OTHER]])
    {
        const g = find(t, `${prefix}grid`);
        for(const [uri, n, sel] of items) add(g, 'vortex_inventory_item_slot_xml', (s) => { icon(s, 'item_icon', uri); text(s, 'item_count', n); show(s, 'selected', !!sel && !locked); if(locked) { show(s, 'lock_icon', true); tint(s, 'item_icon', 0x8080a0); } });
        for(let i = items.length; i < 8; i++) add(g, 'vortex_inventory_item_slot_xml', (s) => { text(s, 'item_count', ''); if(locked) show(s, 'lock_icon', true); });
    }
    text(t, 'own_gold_input', '0'); text(t, 'other_gold_input', '500');
    text(t, 'confirm_button', confirmCaption); tint(t, 'confirm_button', confirmColor);
    if(status) { text(t, 'notice_txt', status); icon(t, 'notice_icon', I.check); tint(t, 'notice_icon', 0x2f9e2f); }
});
trade('trade', {});
trade('trade_ready', {ownReady: true, confirmCaption: 'En attente de Marek...', confirmColor: 0x8c8c86});
trade('trade_locked', {ownReady: true, otherReady: true, locked: true, confirmCaption: 'Échange en cours...', confirmColor: 0x2f9e2f, status: 'Échange verrouillé. En attente de validation finale...'});
place(at('trade_confirm'), 'vortex_trade_confirm_xml', 0, 0, (c) => { text(c, 'countdown_txt', '3'); text(c, 'own_name', 'Clayton'); text(c, 'own_level', 'Niv. 32'); text(c, 'other_name', 'Marek'); text(c, 'other_level', 'Niv. 28'); });
place(at('warning'), 'vortex_hud_alert_xml', 0, 0, (a) => { a.width = 460; a.height = 60; find(a, 'alert').width = 460; find(a, 'alert').height = 60; tint(a, 'alert', 0x8a6a1a); text(a, 'alert_txt', 'Vérifiez bien les objets et la somme proposée. Une fois confirmé, l’échange ne peut pas être annulé.'); const x = find(a, 'alert_txt'); x.width = 400; x.height = 44; x.y = 8; x.textStyle = 'u_regular'; x.fontSize = 10; x.multiline = true; x.wordWrap = true; });
place(at('split'), 'vortex_inventory_split_xml', 0, 0, (s) => { s.caption = 'Séparer la pile'; icon(s, 'item_icon', 'rpg/gems-materials/icon_00'); text(s, 'split_value', '8 / 25'); });
place(at('tip_item'), 'vortex_inventory_tip_xml', 0, 0, (t) => { icon(t, 'tip_icon', 'rpg/dungeon-objects/icon_05'); text(t, 'tip_name', 'Orbe de Mana'); text(t, 'tip_kind', 'Objet rare'); tcolor(t, 'tip_kind', 0x2a8fd6); text(t, 'tip_rarity', ''); text(t, 'tip_desc', 'Un orbe imprégné d’énergie magique, utilisé pour l’artisanat et certaines quêtes.'); text(t, 'tip_quantity', 'Empilable : 20 · Valeur : 250'); });
