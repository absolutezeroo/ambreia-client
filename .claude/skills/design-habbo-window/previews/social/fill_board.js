// @include fill_common.js
// Fills the "États – Social" board (states_social.xml).
const at = (name) => find(root, name);
const one = (slotName, layout, fill, dx = 0) => place(at(slotName), layout, dx, dx, fill);
one('friend_normal', 'vortex_social_friend_row_xml', (r) => { text(r, 'friend_name', 'Sofia'); text(r, 'presence_txt', 'Ville d’Ambre - Place Centrale'); tint(r, 'status_dot', STATUS.room); });
one('friend_hover', 'vortex_social_friend_row_xml', (r) => { text(r, 'friend_name', 'Sofia'); text(r, 'presence_txt', 'Ville d’Ambre - Place Centrale'); tint(r, 'status_dot', STATUS.room); }, -1);
one('friend_selected', 'vortex_social_friend_row_xml', (r) => { text(r, 'friend_name', 'Sofia'); text(r, 'presence_txt', 'Ville d’Ambre - Place Centrale'); tint(r, 'status_dot', STATUS.room); show(r, 'selected', true); });
one('request', 'vortex_social_request_row_xml', (r) => { text(r, 'player_name', 'Rayan'); text(r, 'player_level', 'Niv. 19'); text(r, 'request_context', 'Même guilde : Les Aventuriers'); });
one('sent', 'vortex_social_sent_row_xml', (r) => { text(r, 'player_name', 'Tomy'); text(r, 'player_level', 'Niv. 26'); text(r, 'sent_pill_txt', 'Demande envoyée'); });
one('blocked', 'vortex_social_blocked_row_xml', (r) => { text(r, 'player_name', 'LunaStar'); text(r, 'block_reason', 'Spam en chat'); text(r, 'block_date', 'Bloqué le 02/04/2024'); });
const member = (slotName, ready, selected) => one(slotName, 'vortex_social_group_member_xml', (m) => { text(m, 'member_name', 'Marek'); text(m, 'member_role', 'Tank'); text(m, 'points', '1650 / 1650'); bar(m, 'hp_bar', 180); show(m, 'ready_box', ready === true); show(m, 'waiting_box', ready === 'wait'); show(m, 'selected', selected); });
member('member_ready', true, false); member('member_wait', 'wait', false); member('member_selected', true, true);
const gmember = (slotName, selected) => one(slotName, 'vortex_social_member_row_xml', (r) => { text(r, 'member_name', 'Sofia'); text(r, 'member_role', 'Officier'); text(r, 'member_level', '28'); tint(r, 'status_dot', STATUS.online); text(r, 'member_status', 'En ligne'); tcolor(r, 'member_status', STATUS.online); text(r, 'member_last', 'Maintenant'); text(r, 'member_contribution_txt', '2 980'); show(r, 'selected', selected); });
gmember('gmember', false); gmember('gmember_selected', true);
one('notification', 'vortex_social_notification_xml', (n) => { text(n, 'notification_txt', 'Lucas vous a envoyé une demande d’ami.'); text(n, 'notification_time', 'Il y a 2 min'); });

one('profile_card', 'vortex_social_profile_card_xml', (c) => {
    c.caption = 'Ami – Profil contextuel'; text(c, 'player_name', 'Sofia'); text(c, 'player_level', 'Niv. 31'); text(c, 'presence_txt', 'En ligne'); text(c, 'location_txt', 'Ville d’Ambre - Place Centrale');
    text(c, 'last_seen', 'Il y a 5 min'); text(c, 'member_since', '12 janv. 2024'); text(c, 'same_guild', 'Non'); text(c, 'same_group', 'Oui (3 membres)');
    text(c, 'bio_txt', 'Passionnée d’exploration et de déco ! Toujours partante pour de nouvelles aventures !');
    const l = find(c, 'option_list');
    add(l, 'vortex_social_option_row_xml', (o) => { text(o, 'option_txt', 'Ajouter une note'); });
    add(l, 'vortex_social_option_row_xml', (o) => { text(o, 'option_txt', 'Bloquer ce joueur'); icon(o, 'option_icon', I.ban); tint(o, 'option_icon', 0xd23a2a); });
});
one('ready', 'vortex_group_ready_xml', (r) => {
    text(r, 'ready_desc', 'Clayton a lancé une vérification prêt. Prochaine expédition samedi 20h !');
    const l = find(r, 'ready_list');
    for(const [name, ok] of [['Clayton (chef)', true], ['Marek', true], ['Léa', false], ['Aiko', true]]) add(l, 'vortex_group_ready_row_xml', (m) => { text(m, 'member_name', name); text(m, 'status_txt', ok ? 'Prêt' : 'En attente'); tcolor(m, 'status_txt', ok ? 0x2f9e2f : 0xd08020); tint(m, 'status_dot', ok ? STATUS.online : STATUS.group); if(!ok) { tint(m, 'state_box', 0x6a6a72); icon(m, 'state_icon', I.clock); } });
    text(r, 'waiting_txt', 'En attente de 1 joueur...'); text(r, 'countdown_txt', '00:24');
});
one('invite', 'vortex_group_tab_invite_xml', (t) => {
    const l = find(t, 'invite_list');
    for(const [name, level, presence, role, online] of [['Tomy', 'Niv. 26', 'En ligne', 'DPS', true], ['Sofia', 'Niv. 31', 'En ligne', 'Soigneur', true], ['Rayan', 'Niv. 19', 'En ligne', 'Tank', true], ['Nina', 'Niv. 27', 'Dans un app.', 'DPS', true], ['Zed', 'Niv. 29', 'Hors ligne', 'DPS', false], ['Kuro', 'Niv. 24', 'En ligne', 'DPS', true]])
        add(l, 'vortex_group_invite_row_xml', (r) => { text(r, 'player_name', name); text(r, 'player_level', level); text(r, 'presence_txt', presence); tcolor(r, 'presence_txt', online ? 0x2f9e2f : 0xd23a2a); tint(r, 'status_dot', online ? STATUS.online : STATUS.offline); text(r, 'role_menu', role); if(!online) tint(r, 'invite_button', 0x9a9a9a); });
    text(t, 'pending_title', 'Invitations en attente (1)');
    add(find(t, 'pending_list'), 'vortex_group_pending_row_xml', (p) => { text(p, 'player_name', 'LunaStar'); text(p, 'player_level', 'Niv. 28'); text(p, 'pending_time', 'Il y a 1 min'); });
});
place(at('menu'), 'vortex_ui_menu_xml', 0, 0, (m) => {
    const rows = [['Envoyer un message', I.chat, 0x2a8fd6], ['Inviter dans le groupe', I.group, 0x2a8fd6], ['Voir le profil', I.profile, 0x6a6a72], ['Ajouter une note', I.note, 0xd8a060], ['Retirer des amis', I.more, 0xd23a2a], ['Bloquer ce joueur', I.ban, 0xd23a2a]];
    const h = rows.length * 25 + 12; m.height = h; find(m, 'menu_frame').height = h; find(m, 'menu_list').height = h - 12;
    for(const [l, uri, c] of rows) add(find(m, 'menu_list'), 'vortex_ui_menu_row_xml', (r) => { text(r, 'row_label', l); icon(r, 'row_icon', uri); tint(r, 'row_icon', c); });
});
place(at('filter'), 'vortex_ui_menu_xml', 0, 0, (m) => {
    const rows = [['Tous', I.group, 0x2a8fd6, true], ['En ligne', null, 0], ['Hors ligne', null, 0], ['Même guilde', I.crown, 0xffd040], ['Même groupe', I.group, 0x2a8fd6]];
    const h = rows.length * 25 + 12; m.height = h; find(m, 'menu_frame').height = h; find(m, 'menu_list').height = h - 12;
    for(const [l, uri, c, sel] of rows) add(find(m, 'menu_list'), 'vortex_ui_menu_row_xml', (r) => { text(r, 'row_label', l); if(uri) { icon(r, 'row_icon', uri); tint(r, 'row_icon', c); } else show(r, 'row_icon', false); if(sel) { tint(r, null, 0xffd890); show(r, 'row_check', true); } });
});
place(at('confirm'), 'vortex_ui_confirm_xml', 0, 0, (c) => { c.caption = 'Retirer un ami'; text(c, 'message', 'Êtes-vous sûr de vouloir retirer Sofia de votre liste d’amis ?'); });
place(at('badge_button'), 'vortex_hud_action_bar_xml', 0, 0, (b) => { b.visible = false; });
place(at('badge_button'), 'vortex_ui_menu_row_xml', 0, 0, (r) => { r.width = 36; r.height = 36; find(r, 'row_label').visible = false; icon(r, 'row_icon', I.group); tint(r, 'row_icon', 0x2a8fd6); const i = find(r, 'row_icon'); i.x = 10; i.y = 10; });
place(at('badge'), 'vortex_ui_badge_xml', 0, 0, (b) => text(b, 'badge_txt', '3'));
place(at('tip'), 'vortex_hud_tip_xml', 0, 0, (t) => { text(t, 'tip_title', 'Dans un groupe'); text(t, 'tip_txt', 'Ce joueur est actuellement dans un groupe avec d’autres joueurs.'); icon(t, 'tip_icon', I.group); tint(t, 'tip_icon', 0x8ac8ff); });
