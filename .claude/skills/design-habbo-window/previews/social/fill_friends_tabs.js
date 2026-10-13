// @include fill_common.js
// The friends window on the tab named by TAB (defined by the one-line fill that includes this file).
tab(root, TAB);
const t = place(find(root, 'tab_content'), `vortex_friends_${TAB}_xml`, 0, 0);
if(TAB === 'tab_friends')
{
    const list = find(t, 'friend_list');
    sectionHeader(list, 'En ligne (8)', 'online');
    for(const f of FRIENDS) friendRow(list, f);
    sectionHeader(list, 'Hors ligne (12)', 'offline');
}
else if(TAB === 'tab_requests')
{
    const list = find(t, 'request_list');
    sectionHeader(list, 'Demandes reçues (4)', 'group');
    for(const r of [['Lucas', 'Niv. 28', 'Dans un groupe commun'], ['Emy', 'Niv. 35', 'Ville d’Ambre - Place Centrale'], ['Rayan', 'Niv. 19', 'Même guilde : Les Aventuriers', true], ['Chloé', 'Niv. 24', 'Dans un groupe commun']]) requestRow(list, r);
    sectionHeader(list, 'Demandes envoyées (2)', 'room');
    for(const s of [['Tomy', 'Niv. 26'], ['Sofia', 'Niv. 31']]) sentRow(list, s);
}
else
{
    const list = find(t, 'blocked_list');
    text(t, 'blocked_count', '6 joueurs bloqués');
    for(const b of [['Ragnar', 'Comportement toxique', 'Bloqué le 15/04/2024'], ['LunaStar', 'Spam en chat', 'Bloqué le 02/04/2024', true], ['Drako', 'Harcèlement', 'Bloqué le 28/03/2024'], ['ShadowZ', 'Publicité non autorisée', 'Bloqué le 21/03/2024'], ['Mystica', 'Langage inapproprié', 'Bloqué le 14/03/2024'], ['NeoX', 'Tentative d’arnaque', 'Bloqué le 01/03/2024']]) blockedRow(list, b);
}
