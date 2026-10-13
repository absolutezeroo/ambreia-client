// Writes the PvP / arena layouts (sheet "PvP / Arène") and their texts.
import {bmp, txt, btn, iconBtn, sep, box, cont, list, shape, bar, portrait, selectedOverlay, frame, layout, write, locales, I, C} from '../../tools/ui_helpers.mjs';
const A = {
    rank: 'rpg/ui-icons/warfare_medal_award_achievement_rank_icon', swords: 'rpg/ui-icons/rpg_crossed_swords_duel_pvp_combat_battle_war_icon', gift: 'rpg/ui-icons/rpg_gift_present_icon', hourglass: 'rpg/ui-icons/software_hourglass_sand_time_wait_icon',
    trophy: 'rpg/ui-icons/sports_winner_award_cup_achievement_trophy_icon', medal: 'rpg/ui-icons/sports_winner_award_medal_icon', dps: 'rpg/ui-icons/rpg_item_weapon_sword_attack_melee_slashing_damage_icon', tank: 'rpg/ui-icons/rpg_difficulty_3_medium_buckler_targe_shield_icon',
    heal: 'rpg/ui-icons/software_signs_maths_plus_addition_bonus_add_new_icon', control: 'rpg/ui-icons/rpg_spell_magic_circle_ritual_pentagram_icon', help: I.help, info: I.info,
};
// rank card (shared by the tabs): emblem, rank name + help, points, bar, season box with reward button
const rankCard = () => box(0, 0, 440, 110, [
    box(8, 8, 94, 94, [bmp(31, 31, 32, 32, A.rank, {name: 'rank_icon', color: '0xf0c030', zoom: 2})], {name: 'rank_box'}),
    txt(112, 10, 100, 18, {name: 'rank_name', size: 13, bold: true, color: C.amber}),
    iconBtn(196, 8, 'rank_help', A.help, {w: 22, h: 22}),
    txt(112, 32, 152, 18, {name: 'rank_points', size: 14, bold: true}),
    bar(112, 56, 152, 'rank_bar', 150, '0xf0c030', {text: false, stroke: '0xffa07010'}),
    txt(112, 74, 152, 14, {name: 'rank_progress', size: 10, color: C.sub, align: 'center'}),
    box(272, 8, 160, 94, [
        txt(8, 6, 144, 16, {name: 'season_title', size: 11, bold: true}),
        bmp(8, 26, 16, 16, A.hourglass, {color: '0xd8a030'}), txt(28, 24, 124, 28, {name: 'season_ends', size: 9, color: C.sub, multi: true}),
        btn(8, 60, 144, 'season_rewards_button', '${vortex.arena.season_rewards}', {style: 301, color: '0x2a6aa0', h: 26}),
    ], {style: 102, name: 'season_box'}),
], {style: 103, name: 'rank_card'});
// role card 48x48 + label
const roleCard = (x, key, uri, c) => cont(x, 0, 56, 68, [
    box(2, 0, 52, 52, [selectedOverlay(52, 52), bmp(18, 18, 16, 16, uri, {name: 'role_icon', color: c})], {name: 'role_box', params: 17, dyn: 'button'}),
    txt(0, 54, 56, 14, {name: 'role_label', caption: `\${vortex.ui.role.${key}}`, size: 9, color: C.sub, align: 'center'}),
], {name: `role_${key}`});
const matchRow = layout('vortex_arena_match_row_xml', 420, 26, cont(0, 0, 420, 26, [
    box(0, 3, 70, 20, [txt(0, 2, 70, 16, {name: 'result_txt', size: 9, bold: true, color: C.title, align: 'center'})], {name: 'result_box', style: 6, color: '0x2f7a2f'}),
    portrait(78, 1, 24, 'head_image'),
    txt(108, 5, 80, 16, {name: 'player_name', size: 10, bold: true}),
    txt(190, 5, 60, 16, {name: 'points_txt', size: 10, bold: true, color: C.green}),
    txt(258, 5, 70, 16, {name: 'mode_txt', size: 10, color: C.sub}),
    txt(330, 5, 90, 16, {name: 'time_txt', size: 10, color: C.sub, align: 'right'}),
], {name: 'match_row', params: 144}));
write('vortex_arena_match_row_xml', matchRow);
write('vortex_arena_rank_row_xml', layout('vortex_arena_rank_row_xml', 300, 28, box(0, 0, 300, 28, [
    selectedOverlay(300, 28),
    txt(6, 6, 24, 16, {name: 'position_txt', size: 11, bold: true, color: C.amber}),
    portrait(34, 2, 24, 'head_image'),
    txt(64, 6, 120, 16, {name: 'player_name', size: 10, bold: true}),
    bmp(192, 6, 16, 16, A.medal, {name: 'rank_icon', color: '0xf0c030'}),
    txt(220, 6, 74, 16, {name: 'points_txt', size: 10, bold: true, align: 'right'}),
], {name: 'rank_row', params: 17, dyn: 'lifted_hover'})));
const tabDuel = (name) => layout(`vortex_arena_tab_${name}_xml`, 754, 440, cont(0, 0, 754, 440, [
    rankCard(),
    box(0, 118, 440, 110, [
        txt(8, 6, 150, 16, {caption: '${vortex.arena.composition}', size: 11, bold: true, color: C.panelTitle}),
        iconBtn(160, 3, 'composition_help', A.info, {w: 22, h: 22}),
        cont(8, 28, 240, 68, [roleCard(0, 'dps', A.dps, '0xd04a3a'), roleCard(60, 'tank', A.tank, '0x4090e0'), roleCard(120, 'healer', A.heal, '0x40b030'), roleCard(180, 'control', A.control, '0x8a3ad0')], {name: 'roles'}),
        btn(256, 30, 176, 'search_button', '${vortex.arena.search}', {style: 301, color: '0x2f9e2f', h: 34}),
        txt(256, 70, 176, 14, {name: 'search_hint', size: 9, color: C.sub, align: 'center'}),
    ], {style: 103, name: 'composition_box'}),
    box(0, 236, 440, 204, [
        txt(8, 6, 200, 16, {caption: '${vortex.arena.recent}', size: 11, bold: true, color: C.panelTitle}),
        list(8, 26, 424, 170, 'match_list', 2),
    ], {style: 103, name: 'matches_box'}),
    box(448, 0, 306, 440, [
        bmp(8, 8, 16, 16, I.crown, {color: '0xf0c030'}), txt(30, 8, 150, 16, {name: 'ranking_title', size: 11, bold: true, color: C.panelTitle}),
        `<dropmenu x="226" y="4" width="72" height="24" params="17" style="3" name="mode_menu" caption="1v1"/>`,
        cont(8, 34, 290, 16, [txt(6, 0, 24, 14, {caption: '#', size: 9, bold: true, color: C.sub}), txt(64, 0, 100, 14, {caption: '${vortex.arena.player}', size: 9, bold: true, color: C.sub}), txt(184, 0, 40, 14, {caption: '${vortex.arena.rank}', size: 9, bold: true, color: C.sub}), txt(220, 0, 74, 14, {caption: '${vortex.arena.points}', size: 9, bold: true, color: C.sub, align: 'right'})], {name: 'ranking_header'}),
        list(4, 54, 298, 380, 'ranking_list', 2, {scroll: true}),
    ], {style: 103, name: 'ranking_box'}),
], {name: 'tab_root'}));
write('vortex_arena_tab_duel_xml', tabDuel('duel'));
write('vortex_arena_tab_2v2_xml', tabDuel('2v2'));
write('vortex_arena_tab_4v4_xml', tabDuel('4v4'));
write('vortex_arena_tab_ranking_xml', layout('vortex_arena_tab_ranking_xml', 754, 440, cont(0, 0, 754, 440, [
    rankCard(),
    box(0, 118, 754, 322, [
        bmp(8, 8, 16, 16, I.crown, {color: '0xf0c030'}), txt(30, 8, 200, 16, {name: 'ranking_title', size: 11, bold: true, color: C.panelTitle}),
        `<dropmenu x="660" y="4" width="86" height="24" params="17" style="3" name="mode_menu" caption="1v1"/>`,
        list(4, 36, 746, 280, 'ranking_list', 2, {scroll: true}),
    ], {style: 103, name: 'ranking_box'}),
], {name: 'tab_root'})));
write('vortex_arena_xml', frame('vortex_arena_xml', 760, 520, '${vortex.arena.title}', [
    `<tab_context x="6" y="2" width="740" height="32" params="17" style="3" name="tab_context">
  <children>
    <tab_button x="0" y="0" width="130" height="32" params="17" style="3" name="tab_duel" caption="\${vortex.arena.tab.duel}" id="1"/>
    <tab_button x="130" y="0" width="130" height="32" params="17" style="3" name="tab_2v2" caption="\${vortex.arena.tab.2v2}" id="2"/>
    <tab_button x="260" y="0" width="130" height="32" params="17" style="3" name="tab_4v4" caption="\${vortex.arena.tab.4v4}" id="3"/>
    <tab_button x="390" y="0" width="130" height="32" params="17" style="3" name="tab_ranking" caption="\${vortex.arena.tab.ranking}" id="4"/>
  </children>
</tab_context>`,
    cont(0, 40, 754, 440, [], {name: 'tab_content'}),
]));
// matchmaking: searching / found / entering (HUD panels)
const hudBox = (name, w, h, children) => layout(name, w, h, cont(0, 0, w, h, [box(0, 0, w, h, children, {name: `${name.replace(/_xml$/, '')}_frame`, style: 9, color: '0x4a4068'})], {name: name.replace(/_xml$/, ''), params: 1073741840}));
write('vortex_arena_searching_xml', hudBox('vortex_arena_searching_xml', 240, 120, [
    shape(104, 10, 32, 32, '0x2a2438', {name: 'spinner', radius: 16, stroke: '0xff2a8fd6'}),
    txt(8, 48, 224, 16, {name: 'searching_title', caption: '${vortex.arena.searching}', size: 11, bold: true, color: C.title, align: 'center'}),
    txt(8, 64, 224, 14, {name: 'searching_eta', size: 10, color: C.light, align: 'center'}),
    btn(60, 84, 120, 'cancel_button', '${vortex.ui.cancel}', {style: 301, color: '0xd23a2a', h: 26}),
]));
write('vortex_arena_found_xml', hudBox('vortex_arena_found_xml', 260, 130, [
    bmp(122, 8, 16, 16, A.swords, {color: '0xf0c030'}),
    txt(8, 28, 244, 16, {name: 'found_title', caption: '${vortex.arena.found}', size: 11, bold: true, color: '0xffd040', align: 'center'}),
    txt(8, 44, 244, 14, {name: 'opponent_txt', size: 10, color: C.light, align: 'center'}),
    btn(14, 64, 110, 'accept_button', '${vortex.ui.accept}', {style: 301, color: '0x2a6aa0', h: 26}),
    btn(136, 64, 110, 'refuse_button', '${vortex.ui.refuse}', {style: 301, color: '0xd23a2a', h: 26}),
    txt(8, 100, 244, 14, {name: 'expire_txt', size: 9, color: C.light, align: 'center'}),
]));
write('vortex_arena_entering_xml', hudBox('vortex_arena_entering_xml', 460, 48, [
    bmp(10, 16, 16, 16, A.hourglass, {color: '0xffd040'}),
    txt(34, 8, 200, 16, {name: 'entering_title', caption: '${vortex.arena.entering}', size: 11, bold: true, color: C.title}),
    txt(34, 26, 200, 14, {name: 'entering_sub', caption: '${vortex.arena.preparing}', size: 9, color: C.light}),
    bar(250, 18, 196, 'entering_bar', 120, '0x2a8fd6', {text: false, stroke: '0xff1a5a90', bg: '0x2a2438', bgStroke: '0xff6a6080'}),
]));
// season rewards tooltip
write('vortex_arena_rewards_tip_xml', layout('vortex_arena_rewards_tip_xml', 320, 120, cont(0, 0, 320, 120, [box(0, 0, 320, 120, [
    box(8, 8, 40, 40, [bmp(4, 4, 32, 32, I.chest, {color: '0xd8a060', zoom: 2})], {name: 'tip_icon_box'}),
    txt(56, 8, 256, 16, {name: 'tip_title', caption: '${vortex.arena.season_rewards}', size: 11, bold: true}),
    txt(56, 26, 256, 30, {name: 'tip_desc', size: 9, color: C.sub, multi: true}),
    txt(8, 60, 304, 14, {name: 'tip_preview', size: 9, bold: true, color: C.panelTitle}),
    list(8, 78, 304, 34, 'reward_list', 10, {horizontal: true}),
], {style: 103, name: 'tip_frame'})], {name: 'arena_rewards_tip', params: 1073741840})));
// player tooltip (from the ranking)
write('vortex_arena_player_tip_xml', layout('vortex_arena_player_tip_xml', 300, 96, cont(0, 0, 300, 96, [box(0, 0, 300, 96, [
    portrait(8, 8, 48, 'head_image'),
    txt(64, 8, 160, 16, {name: 'player_name', size: 12, bold: true}), txt(230, 10, 62, 14, {name: 'player_level', size: 10, color: C.sub, align: 'right'}),
    bmp(64, 28, 16, 16, A.medal, {color: '0xf0c030'}), txt(84, 28, 208, 14, {name: 'rank_txt', size: 10, bold: true, color: C.amber}),
    txt(64, 46, 110, 14, {name: 'wins_txt', size: 10, color: C.green}), txt(174, 46, 118, 14, {name: 'losses_txt', size: 10, color: C.red}),
    txt(8, 72, 284, 14, {name: 'tip_hint', caption: '${vortex.arena.player_tip_hint}', size: 9, color: C.sub, align: 'center'}),
], {style: 103, name: 'tip_frame'})], {name: 'arena_player_tip', params: 1073741840})));
locales('arena', {
    'vortex.arena.title': 'PvP / Arène', 'vortex.arena.tab.duel': 'Duel 1v1', 'vortex.arena.tab.2v2': 'Arène 2v2', 'vortex.arena.tab.4v4': 'Arène 4v4', 'vortex.arena.tab.ranking': 'Classement',
    'vortex.arena.season': 'Saison %number%', 'vortex.arena.season_ends': 'Se termine dans %time%', 'vortex.arena.season_rewards': 'Récompenses de saison', 'vortex.arena.points': 'Points', 'vortex.arena.player': 'Joueur', 'vortex.arena.rank': 'Rang',
    'vortex.arena.composition': 'Composition', 'vortex.arena.search': 'Rechercher un adversaire', 'vortex.arena.search_hint': 'Duel 1v1 · Toutes les classes', 'vortex.arena.recent': 'Derniers matchs', 'vortex.arena.ranking': 'Classement saison %number%',
    'vortex.arena.victory': 'VICTOIRE', 'vortex.arena.defeat': 'DÉFAITE', 'vortex.arena.searching': 'Recherche d’adversaire...', 'vortex.arena.searching_eta': 'Temps estimé : ~ %time%', 'vortex.arena.found': 'Adversaire trouvé !', 'vortex.arena.found_expires': 'Cette invitation expire dans %time%',
    'vortex.arena.entering': 'Entrée en arène...', 'vortex.arena.preparing': 'Préparation du combat', 'vortex.arena.player_tip_hint': 'Infobulle joueur (depuis le classement)', 'vortex.arena.rank_help': 'Votre rang dépend de vos points de saison. Les récompenses sont attribuées selon votre rang le plus élevé.',
    'vortex.arena.rewards_desc': 'À la fin de la saison, vous recevrez des récompenses selon votre rang le plus élevé atteint.', 'vortex.arena.rewards_preview': 'Aperçu des récompenses (%rank%) :', 'vortex.arena.wins': 'Victoires : %count%', 'vortex.arena.losses': 'Défaites : %count%',
    'vortex.arena.role.control': 'Contrôle', 'vortex.arena.role.healer_desc': 'Rôle spécialisé dans le soin des alliés et le soutien. Très recherché en arène.', 'vortex.arena.role.control_desc': 'Rôle spécialisé dans les contrôles de foule (étourdissements, ralentissements...) pour prendre l’avantage en arène.',
}, {
    'vortex.arena.title': 'PvP / Arena', 'vortex.arena.tab.duel': 'Duel 1v1', 'vortex.arena.tab.2v2': 'Arena 2v2', 'vortex.arena.tab.4v4': 'Arena 4v4', 'vortex.arena.tab.ranking': 'Ranking',
    'vortex.arena.season': 'Season %number%', 'vortex.arena.season_ends': 'Ends in %time%', 'vortex.arena.season_rewards': 'Season rewards', 'vortex.arena.points': 'Points', 'vortex.arena.player': 'Player', 'vortex.arena.rank': 'Rank',
    'vortex.arena.composition': 'Composition', 'vortex.arena.search': 'Find an opponent', 'vortex.arena.search_hint': 'Duel 1v1 · All classes', 'vortex.arena.recent': 'Recent matches', 'vortex.arena.ranking': 'Season %number% ranking',
    'vortex.arena.victory': 'VICTORY', 'vortex.arena.defeat': 'DEFEAT', 'vortex.arena.searching': 'Searching for an opponent...', 'vortex.arena.searching_eta': 'Estimated time: ~ %time%', 'vortex.arena.found': 'Opponent found!', 'vortex.arena.found_expires': 'This invitation expires in %time%',
    'vortex.arena.entering': 'Entering the arena...', 'vortex.arena.preparing': 'Preparing the fight', 'vortex.arena.player_tip_hint': 'Player tooltip (from the ranking)', 'vortex.arena.rank_help': 'Your rank depends on your season points. Rewards follow your highest rank.',
    'vortex.arena.rewards_desc': 'At the end of the season you receive rewards according to your highest rank.', 'vortex.arena.rewards_preview': 'Rewards preview (%rank%):', 'vortex.arena.wins': 'Wins: %count%', 'vortex.arena.losses': 'Losses: %count%',
    'vortex.arena.role.control': 'Control', 'vortex.arena.role.healer_desc': 'Role specialised in healing allies and support. Sought after in the arena.', 'vortex.arena.role.control_desc': 'Role specialised in crowd control (stuns, slows...) to take the upper hand in the arena.',
});
locales('rpg-common', {'vortex.ui.role.control': 'Contrôle'}, {'vortex.ui.role.control': 'Control'});
console.log('arena layouts written');
