// The arena window on the tab named by TAB.
tab(root, TAB);
const t = place(find(root, 'tab_content'), `vortex_arena_${TAB}_xml`, 0, 0);
const RANKING = [['1', 'Kuro', '2050'], ['2', 'Aiko', '1970'], ['3', 'Zed', '1890'], ['4', 'Léa', '1840'], ['5', 'Clayton', '1450', true], ['6', 'Marek', '1420'], ['7', 'Nina', '1395'], ['8', 'Tomy', '1380'], ['9', 'Sofia', '1320'], ['10', 'Rayn', '1280']];
text(t, 'rank_name', 'Or III'); text(t, 'rank_points', '1 450 points'); bar(t, 'rank_bar', 138); text(t, 'rank_progress', '1450 / 1600'); text(t, 'season_title', 'Saison 5'); text(t, 'season_ends', 'Se termine dans 24 j 12 h');
text(t, 'ranking_title', 'Classement saison 5'); text(t, 'mode_menu', TAB === 'tab_ranking' ? '1v1' : TAB.replace('tab_', '').replace('duel', '1v1'));
const rl = find(t, 'ranking_list');
RANKING.forEach(([pos, name, pts, me]) => add(rl, 'vortex_arena_rank_row_xml', (r) => { text(r, 'position_txt', pos); text(r, 'player_name', name); text(r, 'points_txt', pts); show(r, 'selected', !!me); if(Number(pos) > 3) tint(r, 'rank_icon', 0x8a94a0); if(TAB === 'tab_ranking') { r.width = 746; find(r, 'selected').width = 746; find(r, 'points_txt').x = 666; find(r, 'rank_icon').x = 600; find(r, 'player_name').width = 400; } }));
if(TAB !== 'tab_ranking')
{
    show(find(find(t, 'role_dps'), 'role_box'), 'selected', true); text(t, 'search_hint', TAB === 'tab_duel' ? 'Duel 1v1 · Toutes les classes' : TAB === 'tab_2v2' ? 'Arène 2v2 · Avec un allié' : 'Arène 4v4 · Groupe de 4');
    const ml = find(t, 'match_list');
    for(const [win, name, pts, mode, time] of [[true, 'Zed', '+18 pts', 'Duel 1v1', 'Il y a 5 min'], [false, 'Aiko', '-12 pts', 'Duel 1v1', 'Il y a 22 min'], [true, 'Kuro', '+20 pts', 'Duel 1v1', 'Il y a 1 h'], [true, 'Nina', '+16 pts', 'Duel 1v1', 'Il y a 2 h'], [false, 'Tomy', '-14 pts', 'Duel 1v1', 'Il y a 3 h']])
        add(ml, 'vortex_arena_match_row_xml', (m) => { text(m, 'result_txt', win ? 'VICTOIRE' : 'DÉFAITE'); tint(m, 'result_box', win ? 0x2f7a2f : 0xb02818); text(m, 'player_name', name); text(m, 'points_txt', pts); tcolor(m, 'points_txt', win ? 0x2b9a00 : 0xc30000); text(m, 'mode_txt', mode); text(m, 'time_txt', time); });
}
