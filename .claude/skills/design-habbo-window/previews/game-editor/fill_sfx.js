// SFX (sheet 048ddb61) in the rail's « SFX » entry: sound library, the zone's emitters, the sound's form
// with the global mixer, and the multitrack timeline below.
const RAIL = 'sfx';
// @include fill_common.js
const SND = U + 'media_audio_sound_volume_3_icon';
library('Sons', [
    ['Toutes (142)', SND, 0x2a8fd6], ['Interface (18)', U + 'boardgames_tetris_piece_tetromino_cube_icon', 0xe0a020], ['Ambiance (36)', U + 'weather_cloudy_overcast_icon', 0x3a90d0], ['Combat (24)', U + 'rpg_crossed_swords_duel_pvp_combat_battle_war_icon', 0xd03030],
    ['Créatures (20)', U + 'rpg_stat_pet_paw_animal_handling_tame_beast_mastery_icon', 0x40a040], ['Villes (28)', U + 'map_markers_buildings_houses_homes_village_town_icon', 0xc08040], ['Donjons (16)', U + 'rpg_skull_death_dead_small_icon', 0x8a8a94], ['Voix (14)', IC.voice, 0x4a90e0],
], [
    ['Pas pierre', '0:00 / 0:02', 'UI', 0x4cc040, SND, 0x2a8fd6], ['Marchand bonjour', '0:00 / 0:03', 'Voix', 0x4cc040, SND, 0x9a5ad0], ['Épée impact', '0:00 / 0:01', 'Combat', 0x4cc040, SND, 0xd03030],
    ['Pluie légère', '0:00 / 0:28', 'Ambiance', 0x4cc040, SND, 0x3a90d0], ['Cascade loin', '0:00 / 0:45', 'Ambiance', 0x4cc040, SND, 0x3a90d0], ['Slime attaque', '0:00 / 0:02', 'Créatures', 0x4cc040, SND, 0x40a040],
    ['Coffre ouvert', '0:00 / 0:02', 'UI', 0x4cc040, SND, 0x2a8fd6], ['Victoire quête', '0:00 / 0:04', 'Voix', 0xe0a020, SND, 0x9a5ad0],
]);
const layer = isoView();
for(const [n, k, x, y, c] of [['1. Fontaine', 'Ambiance', 250, 300, 0x2a6ad0], ['2. Marché', 'Ambiance', 70, 470, 0x2a6ad0], ['3. Oiseaux', 'Ambiance', 330, 110, 0x2a6ad0], ['4. Torche', 'Ambiance', 470, 250, 0xd07020], ['5. Cascade', 'Ambiance', 460, 120, 0x2a6ad0], ['6. PNJ', 'Voix', 420, 420, 0x8a4ad0]])
    place(layer, P + 'sfx_emitter_xml', x, y, (e) => { text(e, 'emitter_name', n); text(e, 'emitter_kind', k); tint(e, 'emitter_dot', 0xff000000 | c); if(n.startsWith('5')) tint(e, 'emitter_box', 0x1a4a8a); });
inspector('Cascade loin', [
    F.section('Propriétés du SFX'),
    F.text('Identifiant', 'sfx_0235'), F.text('Nom', 'Cascade loin'), F.select('Catégorie', 'Ambiance'), F.pick('Fichier', 'ambiance_cascade_loin.ogg', IC.folder),
    F.slider('Volume', '0.80', 0.8), F.slider('Pitch', '1.00', 0.5), F.slider('Variation', '0.20', 0.2), F.range('Portée (m)', '2', '25'), F.select('Atténuation', 'Linéaire'),
    F.check('Boucle'), F.check('Jouer en 3D'), F.check('Suivre l’objet', false), F.check('Actif'), F.select('Groupe audio', 'Ambiance'), F.select('Déclencheur', 'Zone / proximité'),
    F.section('Mixeur global'),
    F.slider('Musique', '0.70', 0.7, IC.music, 0x2a6ad0), F.slider('Effets', '0.90', 0.9, SND, 0xe0902a), F.slider('Ambiance', '0.80', 0.8, U + 'weather_nature_leaf_autumn_fall_element_icon', 0x40a040), F.slider('Voix', '0.85', 0.85, IC.voice, 0x4a90e0),
    F.section('Test et validation'),
    F.info('État', 'SFX valide', 0x4cc040), F.info('Durée', '00:45'), F.info('Taille', '1,2 Mo'),
]);
const b = bottom('bottom_sfx');
let tx = 0;
for(const [cap, uri, c] of [['Écouter', IC.play, 0x2f9e2f], ['Arrêter', IC.stop, 0x3a3a3a], ['Ajouter une piste', IC.plus, 0x2f9e2f], ['Supprimer', IC.x, 0xd23a2a], ['Couper', IC.cut, 0x3a4a5a], ['Copier', IC.copy, 0x3a4a5a], ['Coller', IC.copy, 0xa0a0a0], ['Zoom -', IC.zoomOut, 0x3a4a5a], ['Zoom +', IC.zoomIn, 0x3a4a5a], ['Magnétisme', IC.check, 0x2a6ad0]])
{
    const w = 32 + cap.length * 6;
    place(find(b, 'tool_row'), P + 'tool_button_xml', tx, 0, (t) => { t.width = w; find(t, 'tool_box').width = w; find(t, 'tool_txt').width = w - 26; text(t, 'tool_txt', cap); icon(t, 'tool_icon', uri); tint(t, 'tool_icon', c); if(cap === 'Coller') tcolor(t, 'tool_txt', 0xa0a0a0); });
    tx += w + 4;
}
const X = (s) => Math.round(s * 25.5);
let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
for(const [name, head, clipC, waveC, clips] of [
    ['Ambiance', 0x4a90d9, 0x9cc4f0, 0x2a5a9a, [['Cascade loin.ogg', 1.5, 30]]],
    ['Effets', 0xe0902a, 0xf6cc90, 0x8a5010, [['Torche feu.ogg', 3, 11.5]]],
    ['Voix', 0x9a5ad0, 0xd8bcf0, 0x5a2a8a, [['Marchand bonjour.ogg', 10, 15.5]]],
    ['UI', 0x4aa84a, 0xb8e4b0, 0x2a6a2a, [['Coffre ouvert.ogg', 15, 19]]],
])
    add(find(b, 'track_list'), P + 'sfx_track_row_xml', (r) => {
        text(r, 'track_name', name); tint(r, 'track_head', head);
        for(const [file, s0, s1] of clips)
            place(find(r, 'lane'), P + 'sfx_clip_xml', X(s0), 1, (c) => {
                const w = X(s1) - X(s0); c.width = w; find(c, 'wave').width = w - 4; text(c, 'clip_name', file); tint(c, 'sfx_clip', clipC);
                for(let x = 0; x < w - 6; x += 3) { const h = 4 + Math.round(rnd() * 12); place(find(c, 'wave'), P + 'wave_bar_xml', x, 13 - Math.round(h / 2) + 3, (bar) => { bar.height = h; const s = find(bar, 'bar_shape'); s.height = h; s.color = 0xff000000 | waveC; }); }
            });
    });
text(b, 'time_txt', '00:12.3 / 00:30.0');
place(find(b, 'playhead_layer'), P + 'playhead_xml', 8 + 150 + X(12.3) - 22, 0, (h) => { text(h, 'playhead_txt', '12.3'); h.height = 136; find(h, 'playhead_line').height = 120; });
