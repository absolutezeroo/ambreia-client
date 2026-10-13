// @include fill_common.js
// The dungeon window on the tab named by TAB.
tab(root, TAB);
const t = place(find(root, 'tab_content'), `vortex_dungeon_${TAB}_xml`, 0, 0);
const DESC = 'Une ancienne forêt aujourd’hui corrompue par une magie inconnue. Explorez ses ruines et découvrez la source du trouble.';
if(TAB === 'tab_list')
{
    text(t, 'level_filter', 'Tous les niveaux');
    const list = find(t, 'dungeon_list');
    DUNGEONS.forEach(([name, levels, key, thumb, players], i) => add(list, 'vortex_dungeon_row_xml', (r) => { text(r, 'dungeon_name', name); text(r, 'dungeon_levels', levels); difficulty(r, 'difficulty', key); icon(r, 'thumb', thumb); text(r, 'player_count', String(players)); show(r, 'selected', i === 0); }));
    header(find(t, 'detail_header'), 'Forêt d’Ambre', 'Niv. 15 - 25', 'normal', DESC);
    info(find(t, 'info_list'), [['Niveau', '15 - 25', I.level, 0x6a6a72], ['Durée', '20 - 30 min', I.clock, 0x6a6a72], ['Groupe', '3 - 5', I.group, 0x6a6a72]]);
    info(find(t, 'role_list'), [['Tank  0/1', '', I.tank, 0x4090e0], ['Soigneur  0/1', '', I.heal, 0x40b030], ['DPS  0/3', '', I.dps, 0xd04a3a]]);
    rewards(find(t, 'reward_list'));
    tint(t, 'difficulty_0', 0x2f9e2f); tint(t, 'difficulty_1', 0x9a9a9a); tint(t, 'difficulty_2', 0x9a9a9a);
}
else if(TAB === 'tab_finder')
{
    text(t, 'level_min', '1'); text(t, 'level_max', '60'); text(t, 'dungeon_filter', 'Tous les donjons');
    for(const n of ['role_0', 'role_1', 'role_2', 'difficulty_0', 'difficulty_1', 'difficulty_2', 'only_open']) { const c = find(t, n); if(c && 'isSelected' in c) c.isSelected = true; }
    text(t, 'listing_title', 'Annonces de groupes (12)'); text(t, 'sort_menu', 'Plus récents');
    const list = find(t, 'listing_list');
    for(const [name, levels, key, thumb, leader, players, roles, note, i] of [['Forêt d’Ambre', 'Niv. 15 - 25', 'normal', 'arena_12_preview', 'Léo', '3/5', ['1/1', '0/1', '1/3'], 'Première fois, ambiance chill !'], ['Catacombes Oubliées', 'Niv. 20 - 30', 'hard', 'arena_10_preview', 'Aiko', '4/5', ['1/1', '1/1', '2/3'], 'XP rapide, knows meca svp.'], ['Mines de Fer Noir', 'Niv. 28 - 40', 'normal', 'arena_11_preview', 'Marek', '2/5', ['0/1', '1/1', '1/3'], 'Farm minerais + boss.'], ['Temple des Lacs', 'Niv. 35 - 50', 'hard', 'arena_12_preview', 'Naya', '1/5', ['0/1', '0/1', '1/3'], 'Recherche joueurs sérieux.'], ['Forteresse d’Ambre', 'Niv. 45 - 60', 'heroic', 'arena_10_preview', 'Darko', '4/5', ['1/1', '1/1', '2/3'], 'Dernier boss uniquement.'], ['Repaire du Kraken', 'Niv. 50 - 60', 'heroic', 'arena_11_preview', 'Sylia', '3/5', ['1/1', '0/1', '2/3'], 'Run clean, stuff prio main.']].map((l, i) => [...l, i]))
        add(list, 'vortex_dungeon_listing_row_xml', (r) => { text(r, 'dungeon_name', name); text(r, 'dungeon_levels', levels); difficulty(r, 'difficulty', key); icon(r, 'thumb', thumb); text(r, 'leader_name', leader); text(r, 'player_count', players); roles.forEach((c, k) => { text(r, `role_count_${k}`, c); tcolor(r, `role_count_${k}`, c.startsWith('0/') ? 0xc30000 : 0x2b9a00); }); text(r, 'note', note); show(r, 'selected', i === 0); });
    header(find(t, 'detail_header'), 'Forêt d’Ambre', 'Groupe de Léo', 'normal', 'Première fois sur ce donjon, ambiance chill et détente ! Tous niveaux bienvenus.');
    info(find(t, 'info_list'), [['Niveau recommandé', '15 - 25', I.level, 0x6a6a72], ['Durée estimée', '20 - 30 min', I.clock, 0x6a6a72], ['Taille du groupe', '5 joueurs', I.group, 0x6a6a72], ['Niveau d’objet moyen', '~ 90', I.ilvl, 0xf0c030]]);
    const roles = find(t, 'role_list'); for(const k of ['tank', 'heal', 'dps']) roleTag(roles, k, {add: true});
    text(t, 'composition_title', 'Composition actuelle (3/5)');
    const members = find(t, 'member_list');
    for(const [name, key, free] of [['Léo (Niv. 32)', 'dps'], ['Mina (Niv. 28)', 'tank'], ['Riven (Niv. 26)', 'dps'], ['Emplacement libre', 'heal', true], ['Emplacement libre', 'dps', true]]) add(members, 'vortex_dungeon_member_row_xml', (r) => { text(r, 'member_txt', name); if(free) { tcolor(r, 'member_txt', 0x888888); find(r, 'head_image').visible = false; } const [label, uri, c] = ROLE[key]; icon(r, 'role_icon', uri); tint(r, 'role_icon', c); text(r, 'role_txt', label); });
}
else
{
    text(t, 'active_title', 'Mes inscriptions actives (4/5)');
    const list = find(t, 'active_list');
    for(const [name, levels, key, thumb, role, status, sc, si, players, wait, est, i] of [['Forêt d’Ambre', 'Niv. 15 - 25', 'normal', 'arena_12_preview', 'heal', 'En attente...', 0xb07a10, I.wait, '1/3', '2 min', '≈ 3 - 6 min'], ['Mines de Fer Noir', 'Niv. 28 - 40', 'normal', 'arena_11_preview', 'dps', 'Groupe trouvé', 0x2b9a00, I.found, '3/5', '5 min', '≈ 1 - 3 min'], ['Temple des Lacs', 'Niv. 35 - 50', 'hard', 'arena_12_preview', 'tank', 'Invitation reçue', 0x1077ac, I.invite, '2/5', '1 min', '≈ 1 - 2 min'], ['Forteresse d’Ambre', 'Niv. 45 - 60', 'heroic', 'arena_10_preview', 'dps', 'En attente...', 0xb07a10, I.wait, '1/5', '12 min', '≈ 8 - 15 min']].map((l, i) => [...l, i]))
        add(list, 'vortex_dungeon_registration_row_xml', (r) => { text(r, 'dungeon_name', name); text(r, 'dungeon_levels', levels); difficulty(r, 'difficulty', key); icon(r, 'thumb', thumb); roleTag(find(r, 'role_slot'), role); text(r, 'status_txt', status); tcolor(r, 'status_txt', sc); icon(r, 'status_icon', si); tint(r, 'status_icon', sc); text(r, 'player_count', players); text(r, 'wait_txt', wait); text(r, 'estimate_txt', est); show(r, 'selected', i === 0); if(status === 'Invitation reçue') { show(r, 'accept_button', true); show(r, 'decline_button', true); show(r, 'wait_box', false); } if(status === 'Groupe trouvé') { show(r, 'enter_button', true); show(r, 'wait_box', false); } });
    text(t, 'history_title', 'Inscriptions terminées (3)');
    const hist = find(t, 'history_list');
    for(const [name, levels, key, thumb, role, status, sc, date] of [['Catacombes Oubliées', 'Niv. 20 - 30', 'hard', 'arena_10_preview', 'tank', 'Expirée', 0xc30000, 'Aujourd’hui 13:24'], ['Repaire du Kraken', 'Niv. 50 - 60', 'heroic', 'arena_11_preview', 'dps', 'Terminé', 0x666666, 'Hier 21:17'], ['Mines de Fer Noir', 'Niv. 28 - 40', 'normal', 'arena_11_preview', 'heal', 'Annulée', 0x666666, 'Hier 18:03']])
        add(hist, 'vortex_dungeon_history_row_xml', (r) => { text(r, 'dungeon_name', name); text(r, 'dungeon_levels', levels); difficulty(r, 'difficulty', key); icon(r, 'thumb', thumb); roleTag(find(r, 'role_slot'), role); text(r, 'status_txt', status); tcolor(r, 'status_txt', sc); text(r, 'date_txt', date); });
    const d = find(t, 'detail');
    header(find(d, 'detail_header'), 'Forêt d’Ambre', 'Niv. 15 - 25', 'normal', DESC);
    roleTag(find(d, 'role_slot'), 'heal'); difficulty(d, 'my_difficulty', 'normal');
    info(find(d, 'group_info_list'), [['Taille du groupe', '1 / 3 joueurs', I.group, 0x6a6a72], ['Rôles requis', '1 Tank · 1 Soigneur · 1 DPS', I.group, 0x6a6a72]]);
    text(d, 'queue_status_txt', 'En attente de joueurs...'); tcolor(d, 'queue_status_txt', 0xb07a10); text(d, 'queue_hint_txt', 'Recherche de joueurs à votre niveau...'); text(d, 'wait_txt', '2 min'); text(d, 'estimate_txt', 'Estimé : 3 - 6 min');
    rewards(find(d, 'reward_list'));
}
