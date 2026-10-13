// Writes the inbox (sheet "Courrier") and trade (sheet "Échange entre joueurs") layouts and texts.
import {DIR, V, indent, bmp, txt, btn, iconBtn, sep, box, cont, list, shape, bar, input, portrait, selectedOverlay, frame, layout, hud, write, locales, I, C} from '../../tools/ui_helpers.mjs';

// ---------- inbox
// category row: icon, label, count badge, selected overlay (first child)
write('vortex_inbox_category_row_xml', layout('vortex_inbox_category_row_xml', 150, 30, box(0, 0, 150, 30, [
    selectedOverlay(150, 30),
    bmp(8, 7, 16, 16, I.inbox, {name: 'category_icon', color: '0x5a4a7a'}),
    txt(30, 7, 86, 16, {name: 'category_txt', bold: true}),
    box(118, 5, 26, 20, [txt(0, 2, 26, 16, {name: 'count_txt', size: 10, bold: true, color: C.title, align: 'center'})], {name: 'count_badge', style: 6, color: '0xd83030', hidden: true}),
], {name: 'category_row', params: 17, dyn: 'lifted_hover'})));
// message row: icon box, sender, subject, time, marker (clip / pin / expired); unread = bold sender + yellow envelope by the view
write('vortex_inbox_message_row_xml', layout('vortex_inbox_message_row_xml', 300, 50, box(0, 0, 300, 50, [
    selectedOverlay(300, 50),
    box(6, 6, 38, 38, [bmp(11, 11, 16, 16, I.unread, {name: 'message_icon', color: '0xf0c030'})], {name: 'message_icon_box'}),
    txt(52, 7, 160, 16, {name: 'sender_txt', bold: true}),
    txt(52, 26, 200, 16, {name: 'subject_txt', size: 10, color: C.sub}),
    txt(216, 7, 76, 14, {name: 'time_txt', size: 9, color: C.sub, align: 'right'}),
    bmp(276, 26, 16, 16, I.clip, {name: 'marker_icon', color: '0x6a6a72', hidden: true}),
], {name: 'message_row', params: 17, dyn: 'lifted_hover'})));
write('vortex_inbox_xml', frame('vortex_inbox_xml', 700, 520, '${vortex.inbox.title}', [
    // left column
    btn(8, 2, 160, 'new_message_button', '${vortex.inbox.new_message}', {style: 301, color: '0x2a6aa0'}),
    box(8, 38, 160, 440, [list(5, 5, 150, 430, 'category_list', 4)], {style: 103, name: 'categories'}),
    // middle column
    box(176, 2, 310, 476, [list(5, 5, 300, 466, 'message_list', 4, {scroll: true})], {style: 102, name: 'messages'}),
    // reading pane
    box(494, 2, 200, 476, [
        box(8, 8, 38, 38, [bmp(11, 11, 16, 16, I.gift, {name: 'read_icon', color: '0xd23a2a'})], {name: 'read_icon_box'}),
        txt(54, 10, 138, 16, {name: 'read_sender', bold: true}),
        txt(54, 28, 138, 14, {name: 'read_time', size: 9, color: C.sub}),
        sep(8, 54, 184),
        txt(8, 62, 184, 18, {name: 'read_subject', size: 12, bold: true}),
        txt(8, 84, 184, 200, {name: 'read_body', size: 10, multi: true}),
        box(8, 292, 184, 120, [
            bmp(6, 6, 16, 16, I.clip, {color: '0x6a6a72'}), txt(26, 6, 150, 16, {name: 'attachments_title', size: 10, bold: true, color: C.panelTitle}),
            list(6, 28, 172, 60, 'attachment_list', 4, {horizontal: true}),
            btn(6, 90, 172, 'take_all_button', '${vortex.inbox.take_all}', {style: 301, color: '0x2f9e2f', h: 24}),
        ], {style: 102, name: 'attachments_box', hidden: true}),
        btn(8, 420, 184, 'reply_button', '${vortex.inbox.reply}', {style: 301, color: '0x2a6aa0', h: 24}),
        btn(8, 448, 184, 'delete_button', '${vortex.inbox.delete}', {style: 301, color: '0xd23a2a', h: 24}),
        cont(0, 0, 200, 476, [
            box(76, 150, 48, 48, [bmp(8, 8, 32, 32, I.read, {color: '0x808078', zoom: 2})]),
            txt(8, 206, 184, 32, {name: 'empty_message', caption: '${vortex.inbox.no_selection}', color: '0x888888', align: 'center', multi: true}),
        ], {name: 'no_selection', hidden: true}),
    ], {style: 103, name: 'reader'}),
]));
// compose window
write('vortex_inbox_attach_slot_xml', layout('vortex_inbox_attach_slot_xml', 180, 50, box(0, 0, 180, 50, [
    box(6, 6, 38, 38, [bmp(3, 3, 32, 32, '', {name: 'item_icon', tags: false})], {name: 'item_frame'}),
    txt(52, 8, 96, 16, {name: 'item_name', size: 10, bold: true}),
    txt(52, 26, 96, 14, {name: 'item_count', size: 10, color: C.sub}),
    iconBtn(150, 13, 'remove_button', I.x, {color: C.title, w: 24, h: 24, style: 6, tint: '0xc03028'}),
], {name: 'attach_slot'})));
write('vortex_inbox_compose_xml', frame('vortex_inbox_compose_xml', 440, 360, '${vortex.inbox.compose}', [
    txt(8, 8, 90, 16, {caption: '${vortex.inbox.recipient}', size: 10, color: C.light}),
    box(100, 4, 290, 24, [input(6, 4, 278, 'recipient_input', '')], {style: 103, name: 'recipient_box'}),
    iconBtn(396, 3, 'search_button', I.search, {w: 30, h: 26}),
    txt(8, 40, 90, 16, {caption: '${vortex.inbox.subject}', size: 10, color: C.light}),
    box(100, 36, 326, 24, [input(6, 4, 314, 'subject_input', '')], {style: 103, name: 'subject_box'}),
    txt(8, 72, 90, 16, {caption: '${vortex.inbox.message}', size: 10, color: C.light}),
    box(100, 68, 326, 120, [input(6, 6, 314, 'message_input', '', {h: 108})], {style: 103, name: 'message_box'}),
    txt(8, 200, 90, 30, {caption: '${vortex.inbox.attach}', size: 10, color: C.light, multi: true}),
    cont(100, 196, 180, 50, [], {name: 'attach_slot'}),
    box(288, 196, 138, 50, [bmp(10, 17, 16, 16, I.plus, {color: '0x5a4a7a'}), txt(32, 10, 100, 30, {caption: '${vortex.inbox.add_item}', size: 10, color: C.panelTitle, multi: true})], {name: 'add_item_button', params: 17, dyn: 'button'}),
    btn(8, 288, 200, 'clear_button', '${vortex.inbox.clear}', {style: 301, color: '0x8c8c86'}),
    btn(226, 288, 200, 'send_button', '${vortex.inbox.send}', {style: 301, color: '0x2a6aa0'}),
]));
locales('inbox', {
    'vortex.inbox.title': 'Courrier', 'vortex.inbox.new_message': 'Nouveau message', 'vortex.inbox.inbox': 'Boîte de réception', 'vortex.inbox.sent': 'Envoyés', 'vortex.inbox.system': 'Système', 'vortex.inbox.rewards': 'Récompenses', 'vortex.inbox.trash': 'Corbeille',
    'vortex.inbox.attachments': 'Pièces jointes (%count%)', 'vortex.inbox.take_all': 'Tout récupérer', 'vortex.inbox.take_attachments': 'Récupérer les pièces jointes', 'vortex.inbox.reply': 'Répondre', 'vortex.inbox.delete': 'Supprimer', 'vortex.inbox.delete_all': 'Tout supprimer', 'vortex.inbox.no_selection': 'Sélectionnez un message pour le lire.',
    'vortex.inbox.compose': 'Nouveau message', 'vortex.inbox.recipient': 'Destinataire', 'vortex.inbox.subject': 'Sujet', 'vortex.inbox.message': 'Message', 'vortex.inbox.attach': 'Joindre un objet', 'vortex.inbox.add_item': 'Ajouter un objet', 'vortex.inbox.clear': 'Effacer', 'vortex.inbox.send': 'Envoyer',
    'vortex.inbox.sent_toast': 'Message envoyé !', 'vortex.inbox.sent_toast.sub': 'Votre message a été envoyé à %name%.', 'vortex.inbox.expired': 'Expiré', 'vortex.inbox.ago.min': 'Il y a %count% min', 'vortex.inbox.ago.hour': 'Il y a %count% h', 'vortex.inbox.ago.day': 'Il y a %count% j',
}, {
    'vortex.inbox.title': 'Mail', 'vortex.inbox.new_message': 'New message', 'vortex.inbox.inbox': 'Inbox', 'vortex.inbox.sent': 'Sent', 'vortex.inbox.system': 'System', 'vortex.inbox.rewards': 'Rewards', 'vortex.inbox.trash': 'Trash',
    'vortex.inbox.attachments': 'Attachments (%count%)', 'vortex.inbox.take_all': 'Take all', 'vortex.inbox.take_attachments': 'Take the attachments', 'vortex.inbox.reply': 'Reply', 'vortex.inbox.delete': 'Delete', 'vortex.inbox.delete_all': 'Delete all', 'vortex.inbox.no_selection': 'Select a message to read it.',
    'vortex.inbox.compose': 'New message', 'vortex.inbox.recipient': 'Recipient', 'vortex.inbox.subject': 'Subject', 'vortex.inbox.message': 'Message', 'vortex.inbox.attach': 'Attach an item', 'vortex.inbox.add_item': 'Add an item', 'vortex.inbox.clear': 'Clear', 'vortex.inbox.send': 'Send',
    'vortex.inbox.sent_toast': 'Message sent!', 'vortex.inbox.sent_toast.sub': 'Your message was sent to %name%.', 'vortex.inbox.expired': 'Expired', 'vortex.inbox.ago.min': '%count% min ago', 'vortex.inbox.ago.hour': '%count% h ago', 'vortex.inbox.ago.day': '%count% d ago',
});

// ---------- trade
// one side: portrait, name, level, ready badge, 4x2 slots, gold stepper
const side = (x, prefix) => box(x, 2, 280, 266, [
    portrait(8, 8, 48, `${prefix}head_image`),
    txt(64, 12, 208, 16, {name: `${prefix}name`, size: 12, bold: true}),
    txt(64, 30, 100, 14, {name: `${prefix}level`, size: 10, color: C.sub}),
    cont(182, 28, 90, 18, [bmp(0, 1, 16, 16, I.check, {name: `${prefix}ready_icon`, color: '0x2f9e2f'}), txt(20, 2, 70, 14, {name: `${prefix}ready_txt`, caption: '${vortex.trading.ready}', size: 10, bold: true, color: C.green})], {name: `${prefix}ready`, hidden: true}),
    box(8, 64, 264, 124, [list(5, 5, 254, 116, `${prefix}grid`, 4, {grid: true})], {style: 102, name: `${prefix}bag`}),
    box(8, 196, 264, 60, [
        bmp(8, 8, 16, 16, I.coin, {color: '0xf0c030'}), txt(30, 8, 200, 16, {caption: '${vortex.trading.gold}', size: 10, color: C.sub}),
        box(8, 28, 214, 24, [input(6, 4, 180, `${prefix}gold_input`, '0')], {style: 102, name: `${prefix}gold_box`}),
        iconBtn(226, 28, `${prefix}gold_up`, I.up, {w: 30, h: 12, color: '0x5a4a7a'}),
        iconBtn(226, 40, `${prefix}gold_down`, I.down, {w: 30, h: 12, color: '0x5a4a7a'}),
    ], {style: 103, name: `${prefix}gold`}),
    box(0, 0, 280, 266, [bmp(132, 118, 16, 16, I.lock, {color: C.title, zoom: 2})], {name: `${prefix}locked`, style: 103, color: '0xb0a8c0', hidden: true}),
], {style: 103, name: `${prefix}side`});
write('vortex_trade_xml', frame('vortex_trade_xml', 600, 408, '${vortex.trading.title}', [
    side(8, 'own_'), side(312, 'other_'),
    bmp(284, 140, 32, 32, I.swap, {color: '0x8ac8ff', zoom: 2}),
    box(8, 276, 584, 40, [bmp(10, 12, 16, 16, I.lock, {name: 'notice_icon', color: '0x5a4a7a'}), txt(34, 6, 542, 30, {name: 'notice_txt', caption: '${vortex.trading.notice}', size: 10, multi: true})], {style: 103, name: 'notice_box'}),
    btn(8, 328, 286, 'cancel_button', '${vortex.ui.cancel}', {style: 301, color: '0xd23a2a'}),
    btn(306, 328, 286, 'confirm_button', '${vortex.trading.confirm}', {style: 301, color: '0x9a9a9a'}),
]));
// final confirmation with countdown
write('vortex_trade_confirm_xml', frame('vortex_trade_confirm_xml', 340, 280, '${vortex.trading.confirm_title}', [
    bmp(10, 6, 32, 32, I.lamp, {color: '0xffd040', zoom: 2}),
    txt(52, 6, 276, 32, {name: 'message', caption: '${vortex.trading.confirm_message}', size: 11, color: C.title, multi: true}),
    shape(142, 48, 50, 50, '0x2a2438', {name: 'countdown_ring', radius: 25, stroke: '0xffffd040'}),
    txt(142, 60, 50, 28, {name: 'countdown_txt', size: 22, bold: true, color: '0xffd040', align: 'center'}),
    box(8, 108, 324, 60, [
        portrait(8, 6, 48, 'own_head_image'), txt(64, 14, 80, 16, {name: 'own_name', bold: true}), txt(64, 32, 80, 14, {name: 'own_level', size: 10, color: C.sub}),
        bmp(150, 22, 16, 16, I.swap, {color: '0x2a8fd6'}),
        portrait(176, 6, 48, 'other_head_image'), txt(232, 14, 86, 16, {name: 'other_name', bold: true}), txt(232, 32, 86, 14, {name: 'other_level', size: 10, color: C.sub}),
    ], {style: 103, name: 'players_box'}),
    box(8, 178, 324, 40, [bmp(10, 12, 16, 16, I.hourglass, {color: '0x5a4a7a'}), txt(34, 12, 280, 16, {name: 'status_txt', caption: '${vortex.trading.in_progress}', size: 11, bold: true, color: C.panelTitle})], {style: 102, name: 'status_box'}),
]));
locales('trading', {
    'vortex.trading.title': 'Échange entre joueurs', 'vortex.trading.gold': 'Pièces d’Ambre', 'vortex.trading.ready': 'Prêt', 'vortex.trading.notice': 'Vérifiez bien les objets et la somme proposée. Une fois les deux joueurs prêts, l’échange sera effectué.',
    'vortex.trading.confirm': 'Confirmer l’échange', 'vortex.trading.waiting': 'En attente de %name%...', 'vortex.trading.in_progress': 'Échange en cours...', 'vortex.trading.locked': 'Échange verrouillé', 'vortex.trading.locked_sub': 'En attente de validation finale...',
    'vortex.trading.confirm_title': 'Confirmer l’échange', 'vortex.trading.confirm_message': 'Les deux joueurs ont confirmé. L’échange va être effectué dans :', 'vortex.trading.warning': 'Vérifiez bien les objets et la somme proposée. Les deux joueurs doivent confirmer pour valider l’échange. Une fois confirmé, l’échange ne peut pas être annulé.',
    'vortex.trading.offer_quantity': 'Quantité à offrir :', 'vortex.trading.owned': 'Quantité possédée : %count%', 'vortex.trading.stackable': 'Empilable : %count%', 'vortex.trading.value': 'Valeur :',
}, {
    'vortex.trading.title': 'Player trade', 'vortex.trading.gold': 'Amber coins', 'vortex.trading.ready': 'Ready', 'vortex.trading.notice': 'Check the items and the offered sum. Once both players are ready the trade goes through.',
    'vortex.trading.confirm': 'Confirm the trade', 'vortex.trading.waiting': 'Waiting for %name%...', 'vortex.trading.in_progress': 'Trade in progress...', 'vortex.trading.locked': 'Trade locked', 'vortex.trading.locked_sub': 'Waiting for the final validation...',
    'vortex.trading.confirm_title': 'Confirm the trade', 'vortex.trading.confirm_message': 'Both players confirmed. The trade goes through in:', 'vortex.trading.warning': 'Check the items and the offered sum. Both players must confirm to validate the trade. Once confirmed, the trade cannot be cancelled.',
    'vortex.trading.offer_quantity': 'Quantity to offer:', 'vortex.trading.owned': 'Owned: %count%', 'vortex.trading.stackable': 'Stackable: %count%', 'vortex.trading.value': 'Value:',
});
console.log('inbox + trade written');
