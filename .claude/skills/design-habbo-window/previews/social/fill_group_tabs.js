// @include fill_common.js
// The group window on the tab named by TAB.
tab(root, TAB);
const t = place(find(root, 'tab_content'), `vortex_group_${TAB}_xml`, 0, 0);
text(t, 'group_name', 'Groupe d’aventure'); text(t, 'group_count', '4 / 4 joueurs');
if(TAB === 'tab_group')
{
    const list = find(t, 'member_list');
    for(const m of [['Clayton', 'dps', '1240 / 1240', 180, true, false], ['Marek', 'tank', '1650 / 1650', 180, false, true], ['Léa', 'heal', '980 / 980', 180, false, true, true], ['Aiko', 'dps', '1120 / 1120', 180, false, true]]) memberRow(list, m);
}
else
{
    const list = find(t, 'setting_list');
    for(const [label, value, hint] of [['Mode de butin', 'Butin libre', 'Tout le monde peut ramasser les objets.'], ['Sélection des rôles', 'Libre', 'Les joueurs peuvent choisir leur rôle.'], ['Invitations', 'Tous les membres', 'Tous les membres peuvent inviter des joueurs.'], ['Transfert de chef', 'Manuel uniquement', 'Le chef doit transférer le leadership manuellement.'], ['Expulsion de membre', 'Chef et officiers uniquement', 'Seul le chef et les officiers peuvent expulser.'], ['Vérification prêt', 'Activée', 'Tous les membres doivent se déclarer prêts.'], ['Difficulté / Matchmaking', 'Équilibré', 'Adapté au niveau moyen du groupe.']])
        add(list, 'vortex_social_setting_row_xml', (r) => { text(r, 'setting_label', label); text(r, 'setting_menu', value); text(r, 'setting_hint', hint); });
}
