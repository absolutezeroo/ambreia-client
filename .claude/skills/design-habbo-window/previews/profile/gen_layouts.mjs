// Writes the layouts of the "Profil joueur, inspection & menu contextuel" sheet: player profile, equipment
// inspection (around the character sheet paperdoll), player search, whisper window, locked action row.
// The context menu, the compact social card, the tooltip and the confirmation reuse existing layouts.
import {bmp, txt, btn, iconBtn, sep, box, cont, list, shape, input, portrait, selectedOverlay, frame, layout, write, locales, I, C} from '../../tools/ui_helpers.mjs';
const S = {
    class: 'rpg/ui-icons/rpg_difficulty_3_medium_buckler_targe_shield_icon', guild: 'rpg/ui-icons/map_markers_banner_heraldry_icon', addFriend: 'rpg/ui-icons/travel_person_people_two_icon',
    smile: 'rpg/ui-icons/emoji_face_happy_icon', trophy: 'rpg/ui-icons/sports_winner_award_cup_achievement_trophy_icon',
};
const TABS = (names, w) => `<tab_context x="8" y="0" width="${names.length * w}" height="32" params="17" style="3" name="tab_context">
  <children>
${names.map((n, i) => `    <tab_button x="${i * w}" y="0" width="${w}" height="32" params="17" style="3" name="tab_${n}" caption="\${vortex.profile.tab.${n}}" id="${i + 1}"/>`).join('\n')}
  </children>
</tab_context>`;
// the identity header shared by the profile and the inspection: portrait, name + presence, level and class, guild, title
const header = (w) => [
    portrait(8, 4, 84, 'head_image'),
    shape(102, 9, 10, 10, '0x40c040', {name: 'status_dot', radius: 5}),
    txt(118, 4, w - 156, 20, {name: 'player_name', size: 14, bold: true, color: C.title}),
    txt(102, 28, 90, 16, {name: 'level_txt', size: 11, color: C.light}),
    bmp(196, 28, 16, 16, S.class, {name: 'class_icon', color: '0xd8a030'}), txt(216, 28, w - 224, 16, {name: 'class_txt', size: 11, color: C.light}),
    bmp(102, 50, 16, 16, S.guild, {name: 'guild_icon', color: '0x8ab8ff'}), txt(122, 50, w - 130, 16, {name: 'guild_txt', size: 11, color: C.link}),
    txt(102, 72, 50, 16, {caption: '${vortex.profile.title_label}', size: 11, color: C.light}), txt(146, 72, w - 154, 16, {name: 'title_txt', size: 11, bold: true, color: C.link}),
];

// ---------- profile sheet
write('vortex_profile_tab_general_xml', layout('vortex_profile_tab_general_xml', 364, 200, box(0, 0, 364, 200, [
    list(8, 8, 168, 184, 'left_list', 8), shape(182, 8, 1, 184, '0xd0d0c8', {radius: 0}), list(190, 8, 166, 184, 'right_list', 8),
], {style: 103, name: 'tab_root'})));
write('vortex_profile_xml', frame('vortex_profile_xml', 380, 500, '${vortex.profile.title}', [
    ...header(380),
    box(8, 98, 84, 92, [txt(0, 6, 84, 14, {caption: '${vortex.profile.mount}', size: 10, bold: true, color: C.panelTitle, align: 'center'}), box(14, 26, 56, 56, [bmp(12, 12, 32, 32, '', {name: 'mount_icon', tags: false, zoom: 2})], {name: 'mount_box'})], {style: 103, name: 'mount_panel'}),
    box(98, 98, 84, 92, [txt(0, 6, 84, 14, {caption: '${vortex.profile.pet}', size: 10, bold: true, color: C.panelTitle, align: 'center'}), box(14, 26, 56, 56, [bmp(12, 12, 32, 32, '', {name: 'pet_icon', tags: false, zoom: 2})], {name: 'pet_box'})], {style: 103, name: 'pet_panel'}),
    box(188, 98, 184, 92, [txt(8, 6, 168, 14, {caption: '${vortex.profile.recent}', size: 10, bold: true, color: C.panelTitle}), list(8, 26, 168, 56, 'achievement_list', 6, {horizontal: true})], {style: 103, name: 'recent_panel'}),
    cont(0, 198, 380, 32, [TABS(['general', 'pvp', 'jobs', 'reputation'], 90)]),
    cont(8, 236, 364, 200, [], {name: 'tab_content'}),
]));
write('vortex_profile_badge_xml', layout('vortex_profile_badge_xml', 52, 52, box(0, 0, 52, 52, [bmp(10, 10, 32, 32, '', {name: 'badge_icon', tags: false, zoom: 2})], {name: 'badge_box', params: 17, dyn: 'lifted_hover'})));

// ---------- equipment inspection: the character sheet paperdoll beside the title box
write('vortex_profile_inspect_xml', frame('vortex_profile_inspect_xml', 540, 480, '${vortex.profile.inspect}', [
    ...header(540),
    cont(8, 98, 280, 210, [], {name: 'character_sheet_slot'}),
    box(8, 316, 280, 112, [
        txt(8, 6, 264, 14, {caption: '${vortex.profile.titles_title}', size: 10, bold: true, color: C.panelTitle}),
        bmp(8, 30, 16, 16, I.star, {color: '0x8a3ad0'}), txt(30, 30, 198, 16, {name: 'active_title', size: 10, bold: true, color: C.purple}),
        bmp(8, 56, 16, 16, S.trophy, {color: '0xd8a030'}), txt(30, 56, 198, 16, {name: 'points_txt', size: 10}),
        bmp(8, 82, 16, 16, I.crown, {color: '0xd8a030'}), txt(30, 82, 198, 16, {name: 'rank_txt', size: 10}),
    ], {style: 103, name: 'titles_box'}),
    box(296, 98, 236, 330, [txt(8, 6, 220, 14, {caption: '${vortex.profile.item_detail}', size: 10, bold: true, color: C.panelTitle}), cont(8, 26, 220, 296, [], {name: 'tip_slot'})], {style: 103, name: 'detail_box'}),
]));

// ---------- player search / add friend / report
write('vortex_profile_result_row_xml', layout('vortex_profile_result_row_xml', 544, 54, box(0, 0, 544, 54, [
    selectedOverlay(544, 54),
    portrait(5, 5, 44, 'head_image'),
    txt(58, 6, 200, 16, {name: 'player_name', bold: true}),
    txt(58, 28, 70, 16, {name: 'level_txt', size: 10, color: C.sub}),
    bmp(128, 28, 16, 16, S.class, {name: 'class_icon', color: '0xd8a030'}), txt(148, 28, 80, 16, {name: 'class_txt', size: 10}),
    txt(232, 28, 180, 16, {name: 'guild_txt', size: 10, color: C.sub}),
    btn(398, 13, 100, 'profile_button', '${vortex.profile.view}', {style: 301, color: '0x2a6aa0'}),
    iconBtn(506, 13, 'add_button', I.plus, {color: '0x2a6aa0', h: 28}),
], {name: 'result_row', params: 17, dyn: 'lifted_hover'})));
write('vortex_profile_search_xml', frame('vortex_profile_search_xml', 560, 360, '${vortex.profile.search_title}', [
    cont(0, 0, 560, 32, [TABS(['search', 'add', 'report'], 150)]),
    txt(8, 40, 300, 16, {caption: '${vortex.profile.player_name}', size: 11, bold: true, color: C.title}),
    box(8, 60, 420, 30, [bmp(8, 7, 16, 16, I.search, {color: '0x6a6a72'}), input(30, 7, 352, 'search_input', '${vortex.profile.search_hint}'), iconBtn(388, 3, 'clear_button', I.x, {color: '0x6a6a72', w: 26, h: 24, style: 3})], {style: 102, name: 'search_box'}),
    btn(436, 61, 116, 'search_button', '${vortex.profile.search}', {style: 301, color: '0x2a6aa0'}),
    txt(8, 100, 300, 16, {caption: '${vortex.profile.results}', size: 11, bold: true, color: C.title}),
    box(8, 120, 544, 192, [list(0, 4, 544, 184, 'result_list', 4)], {style: 102, name: 'results'}),
]));

// ---------- whisper window
write('vortex_profile_whisper_line_xml', layout('vortex_profile_whisper_line_xml', 262, 16, cont(0, 0, 262, 16, [
    txt(0, 0, 40, 16, {name: 'time_txt', size: 9, color: C.sub}),
    txt(40, 0, 38, 16, {name: 'author_txt', size: 10, bold: true, color: C.purple}),
    txt(78, 0, 184, 16, {name: 'message_txt', size: 10, multi: true}),
], {name: 'whisper_line'})));
write('vortex_profile_whisper_xml', frame('vortex_profile_whisper_xml', 300, 250, '${vortex.profile.whisper}', [
    shape(8, 4, 10, 10, '0x40c040', {name: 'status_dot', radius: 5}), txt(24, 0, 200, 18, {name: 'player_name', size: 12, bold: true, color: C.title}),
    box(8, 22, 284, 132, [list(6, 6, 266, 120, 'line_list', 3, {scroll: true})], {style: 102, name: 'lines'}),
    box(8, 162, 196, 28, [input(8, 6, 152, 'message_input', '${vortex.profile.write}'), bmp(172, 6, 16, 16, S.smile, {name: 'emoji_icon', color: '0xd8a030'})], {style: 102, name: 'input_box'}),
    btn(210, 162, 82, 'send_button', '${vortex.profile.send}', {style: 301, color: '0x2a6aa0'}),
]));

// ---------- an action the menu cannot run now: lock, label, reason, help
write('vortex_profile_locked_row_xml', layout('vortex_profile_locked_row_xml', 270, 30, box(0, 0, 270, 30, [
    bmp(8, 7, 16, 16, I.lock, {name: 'lock_icon', color: '0x8a94a0'}),
    txt(30, 7, 110, 16, {name: 'action_txt', size: 10, color: C.sub}),
    txt(140, 8, 100, 14, {name: 'reason_txt', size: 9, bold: true, color: C.red, align: 'right'}),
    bmp(246, 7, 16, 16, I.help, {name: 'help_icon', color: '0x8a94a0'}),
], {name: 'locked_row', color: '0xe0e0e0'})));

locales('profile', {
    'vortex.profile.title': 'Profil', 'vortex.profile.inspect': 'Inspection', 'vortex.profile.title_label': 'Titre :', 'vortex.profile.level': 'Niveau %level%',
    'vortex.profile.mount': 'Monture', 'vortex.profile.pet': 'Familier', 'vortex.profile.recent': 'Succès récents',
    'vortex.profile.tab.general': 'Général', 'vortex.profile.tab.pvp': 'JcJ', 'vortex.profile.tab.jobs': 'Métiers', 'vortex.profile.tab.reputation': 'Réputation',
    'vortex.profile.titles_title': 'Titre et succès', 'vortex.profile.points': '%n% points de succès', 'vortex.profile.item_detail': 'Objet survolé',
    'vortex.profile.search_title': 'Joueurs', 'vortex.profile.tab.search': 'Rechercher un joueur', 'vortex.profile.tab.add': 'Ajouter un ami', 'vortex.profile.tab.report': 'Signaler un joueur',
    'vortex.profile.player_name': 'Nom du joueur', 'vortex.profile.search_hint': 'Entrez un nom de joueur…', 'vortex.profile.search': 'Rechercher', 'vortex.profile.results': 'Résultats', 'vortex.profile.view': 'Voir profil',
    'vortex.profile.whisper': 'Message privé', 'vortex.profile.write': 'Écrire un message…', 'vortex.profile.send': 'Envoyer', 'vortex.profile.you': 'Vous',
    'vortex.profile.menu.whisper': 'Chuchoter', 'vortex.profile.menu.invite': 'Inviter au groupe', 'vortex.profile.menu.friend': 'Ajouter en ami', 'vortex.profile.menu.trade': 'Échanger', 'vortex.profile.menu.duel': 'Duel', 'vortex.profile.menu.inspect': 'Inspecter', 'vortex.profile.menu.report': 'Signaler', 'vortex.profile.menu.block': 'Bloquer',
    'vortex.profile.locked.offline': 'Joueur hors ligne', 'vortex.profile.locked.level': 'Niveau insuffisant', 'vortex.profile.block_confirm': 'Voulez-vous vraiment bloquer ce joueur ?',
}, {
    'vortex.profile.title': 'Profile', 'vortex.profile.inspect': 'Inspection', 'vortex.profile.title_label': 'Title:', 'vortex.profile.level': 'Level %level%',
    'vortex.profile.mount': 'Mount', 'vortex.profile.pet': 'Pet', 'vortex.profile.recent': 'Recent achievements',
    'vortex.profile.tab.general': 'General', 'vortex.profile.tab.pvp': 'PvP', 'vortex.profile.tab.jobs': 'Jobs', 'vortex.profile.tab.reputation': 'Reputation',
    'vortex.profile.titles_title': 'Title and achievements', 'vortex.profile.points': '%n% achievement points', 'vortex.profile.item_detail': 'Hovered item',
    'vortex.profile.search_title': 'Players', 'vortex.profile.tab.search': 'Search a player', 'vortex.profile.tab.add': 'Add a friend', 'vortex.profile.tab.report': 'Report a player',
    'vortex.profile.player_name': 'Player name', 'vortex.profile.search_hint': 'Enter a player name…', 'vortex.profile.search': 'Search', 'vortex.profile.results': 'Results', 'vortex.profile.view': 'View profile',
    'vortex.profile.whisper': 'Private message', 'vortex.profile.write': 'Write a message…', 'vortex.profile.send': 'Send', 'vortex.profile.you': 'You',
    'vortex.profile.menu.whisper': 'Whisper', 'vortex.profile.menu.invite': 'Invite to group', 'vortex.profile.menu.friend': 'Add as friend', 'vortex.profile.menu.trade': 'Trade', 'vortex.profile.menu.duel': 'Duel', 'vortex.profile.menu.inspect': 'Inspect', 'vortex.profile.menu.report': 'Report', 'vortex.profile.menu.block': 'Block',
    'vortex.profile.locked.offline': 'Player offline', 'vortex.profile.locked.level': 'Level too low', 'vortex.profile.block_confirm': 'Do you really want to block this player?',
});
console.log('profile layouts written');
