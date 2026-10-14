// Interactions (sheet c4bf16f6) in the rail's existing « PNJ » entry: the
// owner's NPC list on the left, the selected NPC's interaction graph in the view with the node palette,
// the node's form, and test / run log / in-game dialogue below.
const RAIL = 'npcs';
// @include fill_common.js
const left = place(at('left_slot'), P + 'left_npcs_xml', 0, 0);
text(left, 'npc_panel_title', 'PNJ (12)');
for(const [n, sub, sel] of [['Intendant', 'ID 1 · Hôtel'], ['Marchand', 'ID 2 · Neutre'], ['Forgeron', 'ID 3 · Neutre'], ['Garde', 'ID 4 · Garde', true], ['Banquier', 'ID 5 · Hôtel'], ['Maître des quêtes', 'ID 6 · Neutre'], ['Aubergiste', 'ID 7 · Neutre'], ['Vendeur de potions', 'ID 8 · Neutre']])
    add(find(left, 'entity_list'), P + 'entity_row_xml', (r) => { text(r, 'entity_title', n); text(r, 'entity_sub', sub); if(sel) tint(r, '', 0xff9cc9f5); });
const g = viewport('graph', {tools: true});
const links = find(g, 'link_layer'), nodes = find(g, 'node_layer');
const C = {green: [0x5cb050, 0xeefbe8], blue: [0x4a90d8, 0xe8f2fc], orange: [0xe8a838, 0xfdf3dc], purple: [0xa070d8, 0xf4eafc], red: [0xe05858, 0xfde8e8], grey: [0x6a7a8a, 0xeef1f4], violet: [0xc060b0, 0xfbeaf8]};
const N = (x, y, w, h, c, uri, title, id, t, o) => node(nodes, [x, y, w, h, C[c][0], C[c][1], uri, title, id, t, o]);
const TALK = U + 'software_speech_bubble_foreign_language_translation_localization_icon';
N(8, 76, 146, 86, 'green', U + 'emoji_hand_pointer_cursor_link_index_finger_icon', 'Début', 'Joueur interagit', 'avec le PNJ Garde (ID 4)', {inPort: false});
N(166, 76, 146, 86, 'blue', U + 'travel_person_player_character_single_icon', 'Distance', 'Distance ≤ 2 cases', 'Acteur ↔ PNJ', {no: true});
N(324, 76, 146, 86, 'purple', U + 'map_markers_doorway_enterance_exit_locked_icon', 'Vérifier objet', 'Possède :', 'Clé du donjon (ID 25)', {no: true});
const ch = N(482, 76, 144, 124, 'orange', TALK, 'Choix multiple', '"Que souhaitez-vous', 'faire ?"', {yesY: 112});
show(ch, 'choice_list'); find(ch, 'choice_list').y = 58; find(ch, 'choice_list').height = 62; find(ch, 'choice_list').width = 132; text(ch, 'node_txt', ''); text(ch, 'node_id', '"Que souhaitez-vous faire ?"');
for(const [i, t] of [[1, 'Ouvrir la porte'], [2, 'En savoir plus'], [3, 'Partir']]) add(find(ch, 'choice_list'), P + 'graph_choice_row_xml', (r) => { r.width = 132; find(r, 'choice_box').width = 132; text(r, 'choice_index', String(i)); text(r, 'choice_txt', t); tint(r, 'choice_box', 0xffffff); });
N(166, 196, 146, 60, 'grey', TALK, 'Message', 'Vous êtes trop loin.', '', {yesY: 30});
N(324, 196, 146, 86, 'blue', TALK, 'Dialogue', 'Garde', '"Vous n’avez pas la clé nécessaire."');
N(346, 300, 134, 76, 'orange', U + 'map_markers_doorway_enterance_exit_open_icon', 'Ouvrir porte', 'Porte_Donjon', 'Animation : oui');
N(490, 300, 136, 86, 'blue', TALK, 'Dialogue', 'Garde', '"Ce donjon est dangereux."');
N(346, 400, 134, 76, 'green', U + 'arrows_roundabout_rotation_circle_reload_refresh_loop_icon', 'Téléporter', 'Destination :', 'Salle_Donjon (12, 8)');
N(490, 400, 136, 76, 'violet', U + 'tools_crafting_writing_parchment_scroll_document_icon', 'Lancer quête', 'Donjon_Oublié', 'Étape 1');
N(420, 500, 136, 60, 'red', U + 'sports_racing_start_flag_icon', 'Fin', 'Terminer', '', {yesY: 30});
const G_ = 0xff2a9a50, R_ = 0xffd03030, B_ = 0xff3a7ad8, V_ = 0xffc060b0;
link(links, [[154, 116], [166, 116]], G_); link(links, [[312, 116], [324, 116]], G_); link(links, [[470, 116], [482, 116]], G_);
link(links, [[312, 142], [318, 142], [318, 180], [239, 180], [239, 196]], R_);
link(links, [[470, 142], [476, 142], [476, 184], [397, 184], [397, 196]], R_);
link(links, [[626, 132], [630, 132], [630, 290], [413, 290], [413, 300]], B_);
link(links, [[600, 200], [600, 214], [558, 214], [558, 300]], B_);
link(links, [[413, 376], [413, 400]], G_);
link(links, [[558, 386], [558, 400]], V_);
link(links, [[413, 476], [413, 530], [420, 530]], G_);
link(links, [[558, 476], [558, 488], [488, 488], [488, 500]], V_);
linkLabel(links, 316, 150, 'Non', 0xd03030); linkLabel(links, 474, 150, 'Non', 0xd03030);
// the node palette over the graph
place(g, P + 'graph_palette_xml', 8, 326, (p) => {
    [['Interaction', U + 'emoji_hand_pointer_cursor_link_index_finger_icon', 0x2f9e2f], ['Dialogue', TALK, 0x2a6ad0], ['Choix', TALK, 0xe0a020], ['Condition', U + 'software_clipbaord_list_file_copy_paste_icon', 0x9a4ad0], ['Inventaire', U + 'rpg_loot_bag_money_coins_purse_icon', 0x9a4ad0], ['Actions', U + 'software_power_electricity_battery_thunder_lightning_bolt_zap_icon', 0xe07020], ['Téléportation', U + 'arrows_roundabout_rotation_circle_reload_refresh_loop_icon', 0x2a9a8a], ['Quêtes', U + 'tools_crafting_writing_parchment_scroll_document_icon', 0xc060b0], ['Audio / vidéo', IC.sound, 0x6a6a7a]]
        .forEach(([t, uri, c], i) => add(find(p, 'kind_list'), P + 'graph_kind_row_xml', (r) => { text(r, 'kind_txt', t); icon(r, 'kind_icon', uri); tint(r, 'kind_icon', c); show(r, 'selected', i === 0); }));
    [['Début d’interaction', 'Quand le joueur interagit', A('materials', 29)], ['Clic sur mobilier', 'Interaction avec un mobi', A('materials', 16)], ['Zone d’entrée', 'Quand un joueur entre', A('materials', 40)], ['Déclencheur manuel', 'Via levier / plaque', A('materials', 8)], ['Événement global', 'Déclenché par un script', A('materials', 33)]]
        .forEach(([t, s2, uri]) => add(find(p, 'template_list'), P + 'graph_template_row_xml', (r) => { text(r, 'template_title', t); text(r, 'template_sub', s2); icon(r, 'template_icon', uri); }));
});
inspector('Nœud 7 - Choix multiple', [
    F.node('Choix multiple', 'Présente plusieurs choix au joueur.', A('materials', 29), 0xfff1c8),
    F.text('Identifiant', 'node_7'), F.text('Titre', 'Choix multiple'), F.area('Texte', 'Que souhaitez-vous faire ?'),
    F.section('Choix'), F.choice(1, 'Ouvrir la porte'), F.choice(2, 'En savoir plus'), F.choice(3, 'Partir'), F.add('Ajouter un choix'),
    F.section('Options'), F.select('Mode d’affichage', 'Menu vertical'), F.check('Afficher les numéros'), F.check('Fermer après le choix'), F.check('Répétable', false), F.check('Une seule fois', false),
    F.num('Cooldown (s)', '0'), F.select('Si quête active', 'Aucune'), F.select('Faction', 'Aucune'), F.num('Niveau requis', '0'), F.num('Réputation min.', '0'),
]);
const b = bottom('bottom_interaction');
for(const [t, time] of [['Interaction démarrée avec Garde (ID 4)', '14:23:01'], ['Condition de distance : OK (1 case)', '14:23:01'], ['Vérification objet : clé du donjon trouvée', '14:23:02'], ['Affichage du choix multiple (3 options)', '14:23:02'], ['Choix sélectionné : 1 (ouvrir la porte)', '14:23:05'], ['Porte du donjon : ouverture…', '14:23:05'], ['Téléportation vers Salle_Donjon (12, 8)', '14:23:06'], ['Interaction terminée', '14:23:06']])
    add(find(b, 'log_list'), P + 'log_row_xml', (r) => { text(r, 'log_txt', t); text(r, 'log_time', time); });
text(b, 'npc_name', 'Garde'); text(b, 'npc_prompt', 'Que souhaitez-vous faire ?');
[['Ouvrir la porte.', true], ['En savoir plus.'], ['Partir.']].forEach(([t, sel], i) => add(find(b, 'answer_list'), P + 'answer_row_xml', (r) => { text(r, 'answer_index', String(i + 1)); text(r, 'answer_txt', t); show(r, 'selected', !!sel); }));
