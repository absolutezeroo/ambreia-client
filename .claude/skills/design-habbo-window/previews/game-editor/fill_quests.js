// Quêtes (sheet 538898c0) in the rail's « Quêtes » entry: quest library, the quest's flow
// as a node graph in the view (the view tools stay: select, move, copy…), the node's form, and the
// console, rewards and flow map below.
const RAIL = 'quests';
// @include fill_common.js
const Q = U + 'software_speech_bubble_exclaimation_mark_quest_new_icon';
library('Quêtes', [
    ['Toutes (12)', U + 'software_file_folder_directory_explorer_icon', 0xe0a020], ['Principales (3)', U + 'hats_crown_king_monarch_ruler_emperor_icon', 0xe0a020],
    ['Secondaires (6)', Q, 0x4a90e0], ['Événements (2)', U + 'software_calendar_dates_organizer_month_1_icon', 0xd03030], ['Tutoriels (1)', U + 'tools_crafting_books_manual_codex_instructions_tutorial_documentation_icon', 0x40a040], ['Brouillons (2)', U + 'tools_crafting_graphic_design_paintbrush_icon', 0x8a8a94],
], [
    ['02 - Le Secret des Salles', 'Principale · 11 nœuds', 'Niv. 3', 0x4cc040, A('materials', 29)], ['01 - Bienvenue à l’Hôtel', 'Principale · 6 nœuds', 'Niv. 1', 0x4cc040, A('materials', 29)],
    ['03 - La Tour Oubliée', 'Principale · brouillon', 'Niv. 5', 0x9a9a9a, A('materials', 41)], ['Les bois en danger', 'Secondaire · 8 nœuds', 'Niv. 10', 0x4cc040, A('materials', 16)],
    ['Le marchand perdu', 'Secondaire · 5 nœuds', 'Niv. 4', 0x4cc040, A('materials', 29)], ['Fête des lanternes', 'Événement · 7 nœuds', 'Niv. 1', 0xe0a020, A('materials', 47)],
]);
const g = viewport('graph', {tools: true});
const links = find(g, 'link_layer'), nodes = find(g, 'node_layer');
const C = {green: [0x5cb050, 0xeefbe8], blue: [0x4a90d8, 0xe8f2fc], orange: [0xe8a838, 0xfdf3dc], yellow: [0xe8b830, 0xfff6d4], purple: [0xa070d8, 0xf4eafc], red: [0xe05858, 0xfde8e8], grey: [0x8a96a6, 0xf0f2f5]};
const N = (x, y, h, c, uri, title, id, t, o) => node(nodes, [x, y, 170, h, C[c][0], C[c][1], uri, title, id, t, o]);
N(12, 80, 86, 'green', U + 'map_markers_flagpole_icon', 'Début de quête', '01. Début', 'Joueur parle au PNJ · ID 1001', {inPort: false});
N(232, 80, 86, 'blue', U + 'software_clipbaord_list_file_copy_paste_icon', 'Conditions', '02. Conditions', 'Niveau ≥ 5 · Avoir terminé 01', {no: true});
N(452, 80, 86, 'orange', U + 'software_speech_bubble_foreign_language_translation_localization_icon', 'Dialogue PNJ', '03. Dialogue', 'Maître des clés · 3 lignes');
const sel = N(12, 196, 86, 'yellow', U + 'tools_crafting_chest_locked_loot_icon', 'Objectif : collecte', '06. Collecter objets', 'Cristal bleu · 3 / 3');
tint(sel, 'node_body', 0xfff0b0);
N(232, 196, 86, 'purple', U + 'rpg_loot_bag_money_coins_purse_icon', 'Vérification inv.', '04. Vérifier objet', 'Clé antique · quantité 1', {no: true});
N(452, 196, 86, 'red', U + 'rpg_skull_death_dead_small_icon', 'Objectif : tuer', '05. Éliminer monstres', 'Chauves-souris · 6 / 6');
const choice = N(12, 312, 112, 'blue', U + 'software_speech_bubble_question_mark_quest_return_finished_icon', 'Choix du joueur', '07. Choix', '"Que faites-vous ?"', {no: true, yesY: 70});
show(choice, 'choice_list'); find(choice, 'choice_list').y = 64; find(choice, 'choice_list').height = 42; find(choice, 'port_no').y = 92;
for(const [i, t, c, bg] of [[1, 'Remettre la clé', 0x2f9e2f, 0xe4f6e0], [2, 'La garder', 0xd23a2a, 0xfbe4e4]]) add(find(choice, 'choice_list'), P + 'graph_choice_row_xml', (r) => { text(r, 'choice_index', String(i)); text(r, 'choice_txt', t); tint(r, 'index_box', c); tint(r, 'choice_box', bg); });
N(232, 312, 86, 'orange', U + 'tools_crafting_chest_locked_loot_icon', 'Récompense', '08. Récompenses', 'XP 500 · Or 250 · Coffre rare');
N(452, 312, 86, 'purple', U + 'sports_racing_start_flag_icon', 'Fin de quête', '09. Fin (succès)', 'Débloque : quête suivante');
N(232, 452, 86, 'red', IC.x, 'Échec de quête', '10. Échec', 'Message : "Vous gardez la clé"', {inPort: true});
N(452, 452, 86, 'grey', U + 'arrows_pointer_right_east_icon', 'Quête suivante', '11. Quête suivante', 'Débloque : 03 - La Tour Oubliée');
const G_ = 0xff2a9a50, R_ = 0xffd03030, B_ = 0xff3a7ad8;
link(links, [[182, 120], [232, 120]], G_); link(links, [[402, 120], [452, 120]], G_);
link(links, [[402, 146], [420, 146], [420, 184], [330, 184], [330, 196]], R_);
link(links, [[537, 166], [537, 176], [97, 176], [97, 196]], B_);
link(links, [[402, 236], [452, 236]], G_);
link(links, [[402, 262], [426, 262], [426, 300], [590, 300], [590, 312]], R_);
link(links, [[537, 282], [537, 312]], B_);
link(links, [[97, 282], [97, 312]], G_);
link(links, [[182, 382], [232, 382]], G_); link(links, [[402, 352], [452, 352]], G_);
link(links, [[182, 404], [200, 404], [200, 492], [232, 492]], R_);
link(links, [[402, 492], [452, 492]], 0xff6a7480, {dashed: true});
linkLabel(links, 404, 102, 'Oui', 0x2a9a50); linkLabel(links, 404, 148, 'Non', 0xd03030);
inspector('Nœud 06 - Objectif : collecte', [
    F.node('Objectif : collecte', 'Demande au joueur de collecter des objets.', A('materials', 41), 0xfff1c8),
    F.section('Général'), F.text('Identifiant', 'node_06'), F.text('Nom', 'Objectif : collecte'), F.area('Description', 'Le joueur doit ramasser des cristaux bleus dispersés dans la zone.'), F.range('Position X / Y', '-280', '-40', '/'),
    F.section('Paramètres de collecte'), F.pick('Objet', 'Cristal bleu'), F.num('Quantité requise', '3'), F.check('Suivi automatique'), F.check('Afficher dans le journal de quête'), F.check('Indicateur sur la mini-carte'),
    F.section('Texte d’objectif'), F.area('Texte au joueur', 'Ramassez 3 cristaux bleus dans les cavernes de l’hôtel.'),
    F.section('Avancé'), F.select('Visible si', 'Toujours'), F.select('Réinitialiser à', 'Jamais'), F.select('Échec si', 'Aucune'),
]);
const b = bottom('bottom_quest');
text(b, 'all_txt', 'Tous (4)'); text(b, 'errors_txt', 'Erreurs (0)'); text(b, 'warnings_txt', 'Avertissements (1)'); text(b, 'infos_txt', 'Informations (3)');
const cl = find(b, 'console_list');
consoleRow(cl, 'console_row', 'info', '[INFO] Quête chargée : 02 - Le Secret des Salles', '14:23:01');
consoleRow(cl, 'console_row', 'info', '[INFO] 11 nœuds dans cette quête', '14:23:01');
consoleRow(cl, 'console_row', 'warn', '[AVERT.] Le nœud "Échec de quête" n’a pas de condition de sortie', '14:23:02');
consoleRow(cl, 'console_row', 'ok', '[INFO] Quête valide : 0 erreur, 1 avertissement', '14:23:02');
for(const [uri, c, t] of [[IC.star, 0xe0a020, 'XP 500'], [IC.coin, 0xe0a020, '250'], [U + 'tools_crafting_chest_locked_loot_icon', 0xc06030, 'Coffre ×1'], [null], [null], [null]])
    add(find(b, 'reward_grid'), P + 'reward_tile_xml', (r) => { if(uri) { icon(r, 'reward_icon', uri); tint(r, 'reward_icon', c); text(r, 'reward_txt', t); } else { show(r, 'reward_icon', false); show(r, 'reward_add'); } });
for(const [x, y, c] of [[12, 80, 'green'], [232, 80, 'blue'], [452, 80, 'orange'], [12, 196, 'yellow'], [232, 196, 'purple'], [452, 196, 'red'], [12, 312, 'blue'], [232, 312, 'orange'], [452, 312, 'purple'], [232, 452, 'red'], [452, 452, 'grey']])
    place(find(b, 'flow_layer'), P + 'key_xml', 6 + Math.round(x * 0.19), 10 + Math.round((y - 60) * 0.33), (k) => { const s = find(k, 'key_shape'); k.width = s.width = 30; k.height = s.height = 16; s.color = 0xff000000 | C[c][0]; });
