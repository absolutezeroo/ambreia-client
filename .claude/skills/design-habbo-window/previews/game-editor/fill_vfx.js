// VFX (sheet 8b965af7) in the rail's « VFX » entry: effect library, the effect played on the zone,
// its form, and its keyframed layers in the bottom timeline.
const RAIL = 'vfx';
// @include fill_common.js
const S = (n) => `rpg/skills/${n}`;
library('Effets visuels', [
    ['Impacts (24)', U + 'rpg_skill_strike_attack_sword_slash_cleave_icon', 0xe0a020], ['Sorts (28)', U + 'rpg_spell_magic_circle_ritual_pentagram_icon', 0x4a90e0], ['Ambiance (31)', U + 'weather_cloudy_overcast_icon', 0x8a94a0],
    ['Eau (18)', U + 'weather_water_droplet_liquid_rain_element_big_icon', 0x3a90d0], ['Feu (22)', U + 'weather_wildfire_flame_element_hot_burn_icon', 0xe05020], ['Nature (19)', U + 'weather_nature_leaf_autumn_fall_element_icon', 0x40a040],
    ['Donjons (16)', U + 'rpg_skull_death_dead_small_icon', 0x8a8a94], ['Interface (14)', IC.star, 0x4a90e0],
], [
    ['Étincelles d’épée', 'Impact', '1.20 s', 0x4cc040, S('warrior_skill_icon_1')], ['Aura de soin', 'Sort', '2.00 s', 0x4cc040, S('rogue_skill_icon_5')], ['Explosion runique', 'Impact', '0.80 s', 0x4cc040, S('warrior_skill_icon_4')],
    ['Chute de feuilles', 'Ambiance', 'boucle', 0x4cc040, S('rogue_skill_icon_9')], ['Portail magique', 'Sort', 'boucle', 0x4cc040, S('psionicist_skill_icon_7')], ['Flamme de torche', 'Feu', 'boucle', 0x4cc040, S('warrior_skill_icon_2')],
    ['Éclaboussures', 'Eau', '0.60 s', 0xe0a020, S('psionicist_skill_icon_3')], ['Lumières féeriques', 'Ambiance', 'boucle', 0x4cc040, S('psionicist_skill_icon_6')], ['Météore', 'Sort', '1.60 s', 0xe03030, S('warrior_skill_icon_3')],
]);
// the effect played where it is attached (the iso view draws the sheet; its label marks the spot)
const layer = isoView();
place(layer, P + 'map_label_xml', 300, 300, (m) => { text(m, 'label_name', 'Étincelles d’épée'); text(m, 'label_level', 'Arme du joueur · 0.60 s'); tint(m, 'label_box', 0x4a2a70); });
inspector('Étincelles d’épée', [
    F.section('Propriétés du VFX'),
    F.text('Identifiant', 'vfx_001'), F.text('Nom', 'Étincelles d’épée'), F.select('Type', 'Impact'), F.num('Durée (s)', '1.20'), F.check('Boucle', false), F.select('Calque', 'Effets (au-dessus)'),
    F.color('Couleur principale', 0xffd24a), F.color('Couleur secondaire', 0xff8a00), F.slider('Intensité', '80 %', 0.8), F.slider('Émission', '120 %', 0.6),
    F.range('Taille', '0.4', '1.6'), F.vec3('Décalage X/Y/Z', '0.0', '0.0', '0.2'), F.select('Attaché à', 'Arme du joueur'), F.select('Déclencheur', 'Attaque (touché)'),
    F.section('Émission de particules'),
    F.select('Type', 'Rafale'), F.num('Quantité', '35'), F.num('Fréquence (/s)', '0.00'), F.num('Angle (°)', '120'), F.num('Vélocité', '2.5'), F.slider('Aléatoire', '40 %', 0.4),
    F.section('Couleur et interpolation'),
    F.gradient([0xfff4b0, 0xffe070, 0xffd24a, 0xffc030, 0xffa818, 0xff9008, 0xff8000, 0xf07000]), F.select('Interpolation', 'Ease out'),
]);
const b = bottom('bottom_vfx');
const X = (t) => 210 + Math.round(t * 388);
const tracks = [
    ['Particules', IC.sparkle, 0x4a90e0, 0xdce8f6, 0x8ab8e8, [0, 1.6], [['Émission', [0, 0.2, 0.45, 1.0]], ['Taille', [0.4, 1.6], true], ['Couleur', [0, 0.2, 0.45]], ['Rotation', [0, 0.4, 0.6, 0.8, 1.6]]]],
    ['Lumière', U + 'software_lighting_bulb_idea_brainstorming_electricity_lit_on_icon', 0xe0a020, 0xfbf0d0, 0xf0d070, [0.2, 1.6], [['Intensité', [0.2, 0.6, 1.2]], ['Couleur', [0.4, 1.0]], ['Rayon', [0, 0.6]]]],
    ['Distorsion', U + 'weather_water_sea_ocean_waves_wavy_icon', 0x9050e0, 0xece0f8, 0xc0a0e8, [0, 1.6], [['Chaleur', [0.6, 1.6]], ['Flou', [0.6, 1.1]], ['Onde', [0, 0.6, 1.0]]]],
];
const tl = find(b, 'track_list');
for(const [name, uri, c, bg, barC, [t0, t1], props] of tracks)
{
    add(tl, P + 'vfx_track_row_xml', (r) => {
        text(r, 'track_name', name); icon(r, 'track_icon', uri); tint(r, 'track_icon', c); tint(r, 'bg', bg); find(r, 'check' === '' ? '' : 'track_check')?.select?.();
        const bar = find(r, 'bar'); bar.x = X(t0); bar.width = X(t1) - X(t0); bar.color = 0xff000000 | barC;
    });
    for(const [p, keys, span] of props)
        add(tl, P + 'vfx_prop_row_xml', (r) => {
            text(r, 'prop_name', p); tint(r, 'bg', 0xfafcfe);
            const bar = find(r, 'bar'); bar.x = X(keys[0]); bar.width = X(keys[keys.length - 1]) - X(keys[0]); bar.color = 0xff000000 | (span ? barC : c); bar.height = span ? 8 : 2; bar.y = span ? 3 : 6;
            for(const t of keys) place(find(r, 'lane'), P + 'key_xml', X(t) - 4, 3, (k) => tint(k, 'key_shape', 0xff000000 | c));
        });
}
place(find(b, 'playhead_layer'), P + 'playhead_xml', 8 + X(0.6) - 22, 0, (h) => text(h, 'playhead_txt', '0.60'));
