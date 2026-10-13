// @include fill_common.js
// The guild window on the tab named by TAB.
tab(root, TAB);
const t = place(find(root, 'tab_content'), `vortex_guild_${TAB}_xml`, 0, 0);
guildHeader(find(t, 'guild_header_slot'));
const MEMBERS = [['Clayton', 'chef', '32', 'online', 'Maintenant', '3 420'], ['Sofia', 'officier', '28', 'online', 'Maintenant', '2 980', true], ['Marek', 'officier', '30', 'online', 'Il y a 5 min', '2 410'], ['Léa', 'membre', '26', 'online', 'Il y a 12 min', '1 850'], ['Kuro', 'membre', '24', 'online', 'Il y a 30 min', '1 640'], ['Nina', 'membre', '27', 'online', 'Il y a 2 h', '1 520'], ['Aiko', 'membre', '25', 'online', 'Il y a 3 h', '1 380'], ['Tomy', 'membre', '23', 'offline', 'Il y a 1 jour', '1 240'], ['Zed', 'membre', '29', 'offline', 'Il y a 2 jours', '980'], ['Soren', 'membre', '21', 'offline', 'Il y a 3 jours', '760'], ['Lina', 'membre', '20', 'offline', 'Il y a 4 jours', '680'], ['Yuki', 'recrue', '18', 'offline', 'Il y a 5 jours', '450']];
if(TAB === 'tab_overview')
{
    text(t, 'motd_txt', 'Prochaine expédition samedi 20h ! On compte sur vous !'); text(t, 'online_title', 'Membres en ligne (6)');
    const list = find(t, 'member_lines');
    for(const [name, role, presence, status] of [['Clayton', 'chef', 'Ville d’Ambre', 'room'], ['Sofia', 'officier', 'En ligne', 'online'], ['Marek', 'officier', 'Dans un groupe', 'group'], ['Léa', 'membre', 'Club NX', 'room'], ['Kuro', 'membre', 'En ligne', 'online'], ['Nina', 'membre', 'Coffee House', 'room']])
        add(list, 'vortex_social_member_line_xml', (l) => { text(l, 'member_name', name); text(l, 'member_role', GUILD_ROLE[role][0]); text(l, 'presence_txt', presence); tint(l, 'status_dot', STATUS[status]); icon(l, 'role_icon', GUILD_ROLE[role][1]); tint(l, 'role_icon', GUILD_ROLE[role][2]); });
}
else if(TAB === 'tab_members')
{
    text(t, 'members_title', 'Membres'); text(t, 'role_filter', 'Rôle (tous)');
    const list = find(t, 'member_list');
    for(const [name, role, level, status, last, contribution, selected] of MEMBERS) add(list, 'vortex_social_member_row_xml', (r) => { text(r, 'member_name', name); text(r, 'member_role', GUILD_ROLE[role][0]); text(r, 'member_level', level); tint(r, 'status_dot', STATUS[status]); text(r, 'member_status', status === 'online' ? 'En ligne' : 'Hors ligne'); tcolor(r, 'member_status', STATUS[status]); text(r, 'member_last', last); text(r, 'member_contribution_txt', contribution); show(r, 'selected', !!selected); icon(r, 'role_icon', GUILD_ROLE[role][1]); tint(r, 'role_icon', GUILD_ROLE[role][2]); });
    place(find(t, 'pager_slot'), 'vortex_market_pager_xml', 0, 0, (p) => { text(p, 'page_txt', '1 / 3'); });
}
else if(TAB === 'tab_chat')
{
    text(t, 'pinned_title', 'Message épinglé par Clayton'); text(t, 'pinned_date', '10/04/2024 18:22'); text(t, 'pinned_txt', 'Prochaine expédition samedi 20h ! On compte sur vous !');
    tint(t, 'channel_0', 0x6a4c9c);
    const list = find(t, 'message_list');
    for(const [author, time, msg, event] of [['Marek', '14:28', 'Qui est dispo pour faire le donjon ce soir ?'], ['Sofia', '14:29', 'Je suis partante ! On fait ça à 20h ?'], ['Kuro', '14:30', 'Ça marche pour moi'], ['Léa', '14:31', 'Je peux heal comme d’habitude !'], ['Tomy a rejoint la guilde.', '14:32', '', true], ['Nina', '14:33', 'Bienvenue Tomy !'], ['Tomy', '14:33', 'Merci ! Content d’être parmi vous'], ['Clayton', '14:35', 'Parfait, on se retrouve au point de ralliement à 19h50.']])
        if(event) add(list, 'vortex_social_chat_event_xml', (e) => { text(e, 'event_txt', author); text(e, 'event_time', time); });
        else add(list, 'vortex_social_chat_message_xml', (m) => { text(m, 'author_name', author); text(m, 'message_time', time); text(m, 'message_txt', msg); });
}
else
{
    text(t, 'setting_0', 'Publique'); text(t, 'setting_1', 'Ouvert'); text(t, 'setting_2', '10');
    for(const [i, name, desc] of [[0, 'Chef', 'Tous les droits'], [1, 'Officier', 'Gestion des membres'], [2, 'Membre', 'Participation']]) { const r = find(t, `role_${i}`); if(r) { text(r, 'role_name', name); text(r, 'role_desc', desc); } }
    for(const n of ['perm_0_0', 'perm_0_1', 'perm_1_0', 'perm_1_1', 'perm_2_0', 'perm_2_1', 'perm_3_0', 'perm_4_0', 'perm_4_1', 'perm_5_0', 'opt_0', 'opt_1', 'opt_2', 'opt_3']) { const c = find(t, n); if(c && 'isSelected' in c) c.isSelected = true; }
    for(const [i, l] of [[0, 'Notifications de guilde'], [1, 'Notifications de candidatures'], [2, 'Afficher la guilde dans l’annuaire'], [3, 'Autoriser les candidatures']]) text(t, `opt_${i}_label`, l);
}
