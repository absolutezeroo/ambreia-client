// Writes the layouts of the "Outils joueur, aide & sécurité" sheet: tutorial guide, codex, player report,
// connection lost, AFK, notification centre (rewrites the old blue vortex_notifications_xml with the same names),
// short hint. Toasts, banners, tooltip and confirmation reuse existing layouts.
import {bmp, txt, btn, iconBtn, sep, box, cont, list, shape, bar, input, portrait, selectedOverlay, frame, layout, write, locales, I, C} from '../../tools/ui_helpers.mjs';
const S = {
    refresh: 'rpg/ui-icons/arrows_roundabout_rotation_circle_reload_refresh_loop_icon', left: I.left, right: I.right, flag: 'rpg/ui-icons/software_bookmark_flag_icon', sleep: 'rpg/ui-icons/rpg_debuff_zz_sleep_status_icon',
    play: 'rpg/ui-icons/arrows_media_controls_play_triangle_icon', bell: 'rpg/ui-icons/travel_bell_notification_ringing_icon',
};

// ---------- tutorial guide: numbered steps, an illustrated page with callouts, pager
write('vortex_help_step_row_xml', layout('vortex_help_step_row_xml', 150, 40, box(0, 0, 150, 40, [
    selectedOverlay(150, 40),
    shape(8, 8, 24, 24, '0xffffff', {name: 'step_ring', radius: 12, stroke: '0xff5a4a7a'}),
    txt(8, 12, 24, 16, {name: 'step_number', size: 10, bold: true, color: C.panelTitle, align: 'center'}),
    txt(40, 12, 106, 16, {name: 'step_label', size: 10, bold: true}),
], {name: 'step_row', params: 17, dyn: 'lifted_hover'})));
write('vortex_help_callout_xml', layout('vortex_help_callout_xml', 220, 44, box(0, 0, 220, 44, [
    bmp(6, 6, 16, 16, I.lamp, {name: 'callout_icon', color: '0xffd040'}),
    txt(28, 4, 186, 36, {name: 'callout_txt', size: 10, color: C.title, multi: true}),
], {name: 'callout', style: 9, color: '0x3a3254'})));
write('vortex_help_guide_xml', frame('vortex_help_guide_xml', 620, 400, '${vortex.help.guide}', [
    box(8, 4, 160, 302, [list(5, 5, 150, 292, 'step_list', 4)], {style: 102, name: 'steps'}),
    box(176, 4, 436, 302, [bmp(0, 0, 436, 302, 'arena_12_preview', {name: 'page_image', tags: false, stretch: true}), cont(0, 0, 436, 302, [], {name: 'callout_layer'})], {style: 102, name: 'page'}),
    list(330, 322, 130, 12, 'page_dots', 10, {horizontal: true}),
    btn(492, 314, 120, 'next_button', '${vortex.help.next}', {style: 301, color: '0x2a6aa0'}),
    btn(176, 314, 120, 'previous_button', '${vortex.help.previous}', {style: 301, color: '0x8c8c86'}),
]));
write('vortex_help_dot_xml', layout('vortex_help_dot_xml', 12, 12, cont(0, 0, 12, 12, [shape(0, 0, 12, 12, '0x8a84a0', {name: 'dot', radius: 6})], {name: 'page_dot'})));

// ---------- codex: categories, entries with icon and one-line description
write('vortex_codex_category_row_xml', layout('vortex_codex_category_row_xml', 150, 40, box(0, 0, 150, 40, [
    selectedOverlay(150, 40),
    bmp(10, 12, 16, 16, I.star, {name: 'category_icon', color: '0xd8a030'}),
    txt(36, 12, 110, 16, {name: 'category_name', size: 11, bold: true}),
], {name: 'category_row', params: 17, dyn: 'lifted_hover'})));
write('vortex_codex_entry_row_xml', layout('vortex_codex_entry_row_xml', 420, 40, cont(0, 0, 420, 40, [
    bmp(4, 10, 16, 16, I.star, {name: 'entry_icon', color: '0xd04040'}),
    txt(28, 3, 380, 16, {name: 'entry_name', size: 11, bold: true}),
    txt(28, 20, 380, 16, {name: 'entry_desc', size: 9, color: C.sub}),
], {name: 'entry_row'})));
write('vortex_codex_xml', frame('vortex_codex_xml', 620, 400, '${vortex.help.codex}', [
    box(8, 4, 160, 350, [list(5, 5, 150, 340, 'category_list', 4)], {style: 102, name: 'categories'}),
    box(176, 4, 436, 350, [
        txt(8, 6, 420, 18, {name: 'section_title', size: 13, bold: true, color: C.panelTitle}),
        txt(8, 26, 420, 30, {name: 'section_desc', size: 10, color: C.sub, multi: true}),
        sep(8, 60, 420),
        list(8, 66, 428, 278, 'entry_list', 4, {scroll: true}),
    ], {style: 103, name: 'section'}),
]));

// ---------- report a player
write('vortex_report_reason_row_xml', layout('vortex_report_reason_row_xml', 290, 22, cont(0, 0, 290, 22, [
    shape(2, 3, 16, 16, '0xffffff', {name: 'radio_ring', radius: 8, stroke: '0xff5a4a7a'}),
    shape(6, 7, 8, 8, '0x2a6aa0', {name: 'radio_dot', radius: 4, hidden: true}),
    txt(26, 3, 262, 16, {name: 'reason_txt', size: 10}),
], {name: 'reason_row', params: 17})));
write('vortex_report_xml', frame('vortex_report_xml', 320, 440, '${vortex.help.report}', [
    portrait(8, 4, 56, 'head_image'),
    txt(72, 6, 240, 16, {caption: '${vortex.help.report}', size: 12, bold: true, color: C.title}),
    txt(72, 24, 240, 32, {caption: '${vortex.help.report_desc}', size: 9, color: C.light, multi: true}),
    txt(8, 68, 300, 14, {caption: '${vortex.help.reported_player}', size: 10, bold: true, color: C.title}),
    box(8, 86, 272, 28, [input(8, 6, 256, 'player_input', '${vortex.help.player_hint}')], {style: 102, name: 'player_box'}),
    iconBtn(284, 87, 'search_button', I.search, {color: '0x2a6aa0', w: 28, h: 26}),
    txt(8, 122, 300, 14, {caption: '${vortex.help.category}', size: 10, bold: true, color: C.title}),
    box(8, 140, 304, 132, [list(6, 6, 292, 122, 'reason_list', 2)], {style: 103, name: 'reasons'}),
    txt(8, 280, 300, 14, {caption: '${vortex.help.description}', size: 10, bold: true, color: C.title}),
    box(8, 298, 304, 54, [input(8, 6, 288, 'description_input', '${vortex.help.description_hint}', {h: 30}), txt(200, 36, 96, 14, {name: 'counter_txt', caption: '0/500', size: 9, color: C.sub, align: 'right'})], {style: 102, name: 'description_box'}),
    btn(8, 360, 100, 'cancel_button', '${vortex.ui.cancel}', {style: 301, color: '0xd23a2a'}),
    btn(116, 360, 196, 'send_button', '${vortex.help.send_report}', {style: 301, color: '0x2f9e2f'}),
]));

// ---------- connection lost: retry countdown; AFK: idle timer
write('vortex_reconnect_xml', frame('vortex_reconnect_xml', 460, 250, '${vortex.help.connection}', [
    box(8, 4, 120, 196, [`<widget x="10" y="20" width="100" height="160" params="16" style="3" name="avatar_image"><variables><var key="widget_type" value="avatar_image" type="String"/></variables></widget>`, bmp(52, 6, 16, 16, I.warn, {color: '0xd23a2a'})], {style: 102, name: 'avatar_box'}),
    txt(140, 4, 312, 20, {caption: '${vortex.help.connection_lost}', size: 14, bold: true, color: C.title}),
    txt(140, 28, 312, 32, {caption: '${vortex.help.connection_desc}', size: 10, color: C.light, multi: true}),
    bmp(140, 70, 16, 16, S.refresh, {name: 'spinner_icon', color: '0x8ab8ff'}), txt(162, 70, 290, 16, {name: 'retry_txt', size: 11, color: C.title}),
    bar(140, 92, 312, 'retry_bar', 60, '0x2a8fd6', {text: false, h: 10, stroke: '0xff1a5a90'}),
    btn(140, 114, 312, 'retry_button', '${vortex.help.retry}', {style: 301, color: '0x2a6aa0', h: 34}),
    btn(140, 156, 312, 'back_button', '${vortex.help.back_to_select}', {style: 301, color: '0x3a3254', h: 34}),
]));
write('vortex_afk_xml', frame('vortex_afk_xml', 360, 250, '${vortex.help.afk}', [
    box(8, 4, 110, 196, [`<widget x="5" y="20" width="100" height="160" params="16" style="3" name="avatar_image"><variables><var key="widget_type" value="avatar_image" type="String"/></variables></widget>`, bmp(80, 8, 16, 16, S.sleep, {color: '0x8ab8ff'})], {style: 102, name: 'avatar_box'}),
    txt(128, 4, 224, 20, {caption: '${vortex.help.afk_title}', size: 14, bold: true, color: C.title}),
    txt(128, 26, 224, 16, {caption: '${vortex.help.afk_since}', size: 10, color: C.light}),
    txt(128, 44, 224, 26, {name: 'afk_timer', size: 20, bold: true, color: '0xffd040'}),
    txt(128, 74, 224, 44, {name: 'afk_desc', size: 10, color: C.light, multi: true}),
    btn(128, 122, 224, 'resume_button', '${vortex.help.resume}', {style: 301, color: '0x2f9e2f', h: 34}),
    btn(128, 164, 224, 'stay_button', '${vortex.help.stay_afk}', {style: 301, color: '0x3a3254', h: 34}),
]));

// ---------- notification centre (same names as the old window: notification_list, mark_read_button, clear_button)
write('vortex_notification_row_xml', layout('vortex_notification_row_xml', 500, 30, box(0, 0, 500, 30, [
    bmp(8, 7, 16, 16, I.gift, {name: 'notification_icon', color: '0xd8a030'}),
    txt(32, 7, 360, 16, {name: 'notification_txt', size: 10}),
    txt(396, 8, 80, 14, {name: 'notification_time', size: 9, color: C.sub, align: 'right'}),
    shape(484, 11, 8, 8, '0xd23a2a', {name: 'unread_dot', radius: 4}),
], {name: 'notification_row', params: 17, dyn: 'lifted_hover'})));
write('vortex_notifications_xml', frame('vortex_notifications_xml', 540, 330, '${vortex.notifications.title}', [
    cont(8, 4, 524, 24, [], {name: 'filter_bar'}),
    box(8, 34, 524, 214, [list(4, 4, 516, 206, 'notification_list', 3, {scroll: true})], {style: 102, name: 'notifications'}),
    btn(8, 256, 258, 'mark_read_button', '${vortex.notifications.mark_read}', {style: 301, color: '0x8c8c86'}),
    btn(274, 256, 258, 'clear_button', '${vortex.notifications.clear}', {style: 301, color: '0xd23a2a'}),
]));
// a short dark hint under a disabled control
write('vortex_ui_hint_xml', layout('vortex_ui_hint_xml', 180, 24, box(0, 0, 180, 24, [txt(8, 4, 164, 16, {name: 'hint_txt', size: 10, color: C.title})], {name: 'ui_hint', style: 9, color: '0x2a2438'})));

locales('help', {
    'vortex.help.title': 'Aide', 'vortex.help.guide': 'Guide d’Ambreia', 'vortex.help.next': 'Suivant', 'vortex.help.previous': 'Précédent',
    'vortex.help.step.welcome': 'Bienvenue !', 'vortex.help.step.move': 'Se déplacer', 'vortex.help.step.talk': 'Dialoguer', 'vortex.help.step.quests': 'Quêtes', 'vortex.help.step.inventory': 'Inventaire', 'vortex.help.step.services': 'Services de la ville',
    'vortex.help.codex': 'Codex d’Ambreia', 'vortex.help.codex.stats': 'Statistiques', 'vortex.help.codex.rarity': 'Raretés', 'vortex.help.codex.roles': 'Rôles', 'vortex.help.codex.status': 'Altérations', 'vortex.help.codex.jobs': 'Métiers', 'vortex.help.codex.currencies': 'Monnaies',
    'vortex.help.report': 'Signaler un joueur', 'vortex.help.report_desc': 'Votre signalement nous aide à garder Ambreia accueillant et respectueux.', 'vortex.help.reported_player': 'Joueur concerné', 'vortex.help.player_hint': 'Nom du joueur', 'vortex.help.category': 'Catégorie du signalement',
    'vortex.help.reason.spam': 'Spam ou publicité', 'vortex.help.reason.harassment': 'Harcèlement ou comportement toxique', 'vortex.help.reason.cheat': 'Triche ou comportement abusif', 'vortex.help.reason.name': 'Pseudo inapproprié', 'vortex.help.reason.other': 'Autre',
    'vortex.help.description': 'Description (optionnelle)', 'vortex.help.description_hint': 'Décrivez la situation… (max. 500 caractères)', 'vortex.help.send_report': 'Envoyer le signalement',
    'vortex.help.connection': 'Connexion', 'vortex.help.connection_lost': 'Connexion perdue', 'vortex.help.connection_desc': 'La connexion avec le serveur a été interrompue. Tentative de reconnexion en cours…', 'vortex.help.retry_in': 'Reconnexion dans %seconds% secondes…', 'vortex.help.retry': 'Réessayer maintenant', 'vortex.help.back_to_select': 'Retour à l’écran des personnages',
    'vortex.help.afk': 'Inactivité', 'vortex.help.afk_title': 'Mode inactif (AFK)', 'vortex.help.afk_since': 'Vous êtes inactif depuis :', 'vortex.help.afk_desc': 'Pour votre sécurité, vous serez déconnecté automatiquement dans %minutes% minutes.', 'vortex.help.resume': 'Reprendre le jeu', 'vortex.help.stay_afk': 'Rester en mode AFK',
    'vortex.help.unavailable': 'Indisponible pour le moment.',
}, {
    'vortex.help.title': 'Help', 'vortex.help.guide': 'Ambreia guide', 'vortex.help.next': 'Next', 'vortex.help.previous': 'Previous',
    'vortex.help.step.welcome': 'Welcome!', 'vortex.help.step.move': 'Moving', 'vortex.help.step.talk': 'Talking', 'vortex.help.step.quests': 'Quests', 'vortex.help.step.inventory': 'Inventory', 'vortex.help.step.services': 'Town services',
    'vortex.help.codex': 'Ambreia codex', 'vortex.help.codex.stats': 'Statistics', 'vortex.help.codex.rarity': 'Rarities', 'vortex.help.codex.roles': 'Roles', 'vortex.help.codex.status': 'Status effects', 'vortex.help.codex.jobs': 'Jobs', 'vortex.help.codex.currencies': 'Currencies',
    'vortex.help.report': 'Report a player', 'vortex.help.report_desc': 'Your report helps keep Ambreia welcoming and respectful.', 'vortex.help.reported_player': 'Reported player', 'vortex.help.player_hint': 'Player name', 'vortex.help.category': 'Report category',
    'vortex.help.reason.spam': 'Spam or advertising', 'vortex.help.reason.harassment': 'Harassment or toxic behaviour', 'vortex.help.reason.cheat': 'Cheating or abuse', 'vortex.help.reason.name': 'Inappropriate name', 'vortex.help.reason.other': 'Other',
    'vortex.help.description': 'Description (optional)', 'vortex.help.description_hint': 'Describe what happened… (max. 500 characters)', 'vortex.help.send_report': 'Send the report',
    'vortex.help.connection': 'Connection', 'vortex.help.connection_lost': 'Connection lost', 'vortex.help.connection_desc': 'The connection to the server was interrupted. Trying to reconnect…', 'vortex.help.retry_in': 'Reconnecting in %seconds% seconds…', 'vortex.help.retry': 'Retry now', 'vortex.help.back_to_select': 'Back to character select',
    'vortex.help.afk': 'Inactivity', 'vortex.help.afk_title': 'Away (AFK)', 'vortex.help.afk_since': 'You have been inactive for:', 'vortex.help.afk_desc': 'For your safety, you will be logged out automatically in %minutes% minutes.', 'vortex.help.resume': 'Resume playing', 'vortex.help.stay_afk': 'Stay AFK',
    'vortex.help.unavailable': 'Unavailable for now.',
});
locales('social', {
    'vortex.notifications.clear': 'Tout effacer', 'vortex.notifications.filter.all': 'Toutes (%n%)', 'vortex.notifications.filter.system': 'Système (%n%)', 'vortex.notifications.filter.quests': 'Quêtes (%n%)', 'vortex.notifications.filter.social': 'Social (%n%)', 'vortex.notifications.filter.rewards': 'Récompenses (%n%)',
}, {
    'vortex.notifications.clear': 'Clear all', 'vortex.notifications.filter.all': 'All (%n%)', 'vortex.notifications.filter.system': 'System (%n%)', 'vortex.notifications.filter.quests': 'Quests (%n%)', 'vortex.notifications.filter.social': 'Social (%n%)', 'vortex.notifications.filter.rewards': 'Rewards (%n%)',
});
console.log('help layouts written');
