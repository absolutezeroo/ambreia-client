// Generates the boards of the "Calendrier, événements & récompenses" and "Paramètres, raccourcis & accessibilité"
// sheets (`node gen_board.mjs calendar|missions|settings|access`): labelled slots fill_board.js populates.
import fs from 'node:fs';
import {btn, slider, txt, cont, C} from '../../tools/ui_helpers.mjs';

const BOARD = process.argv[2] || 'calendar';
const W = 1270;
const parts = [];
const text = (x, y, w, caption, {size = 10, bold = false, color = '0xd8d0e8'} = {}) => parts.push(`
        <text x="${x}" y="${y}" width="${w}" height="16" params="16" style="3" caption="${caption}">
          <variables>
            <var key="text_style" value="${bold ? 'u_bold' : 'u_regular'}" type="String"/>
            <var key="font_size" value="${size}" type="uint"/>
            <var key="text_color" value="${color}" type="hex"/>
            <var key="mouse_wheel_enabled" value="false" type="Boolean"/>
          </variables>
        </text>`);
const heading = (y, caption) => { text(10, y, 900, caption, {size: 12, bold: true, color: '0xffd890'}); parts.push(`\n        <container x="10" y="${y + 18}" width="${W - 20}" height="1" params="16" style="8" color="0xff8a78a8" background="true"/>`); };
const label = (x, y, caption) => text(x, y, 400, caption, {size: 9, bold: true});
const slot = (name, x, y, w, h) => parts.push(`\n        <container x="${x}" y="${y}" width="${w}" height="${h}" params="16" style="3" name="${name}"><children/></container>`);

const raw = (xml) => parts.push(`\n${xml}`);
const BOARDS = {
    calendar: ['États – Calendrier', () => {
        heading(4, '1. Calendrier de récompenses et world boss');
        label(10, 28, 'Fenêtre, onglet Récompenses (quotidiennes)'); slot('cal_rewards', 10, 42, 706, 500);
        label(726, 28, 'Popup de récompense'); slot('popup', 726, 42, 360, 300);
        label(726, 352, 'Jours : récupérée, aujourd’hui, verrouillée, survol'); slot('days', 726, 366, 540, 116);
        label(726, 492, 'Paliers : atteint, en cours, à venir'); slot('tiers', 726, 506, 420, 44);
        heading(556, '2. Calendrier des événements');
        label(10, 580, 'Onglet Événements (filtre Tous)'); slot('cal_events', 10, 594, 706, 500);
        return 1140;
    }],
    missions: ['États – Missions et portefeuille', () => {
        heading(4, '1. Missions et tâches, monnaies');
        label(10, 28, 'Onglet Missions (quotidiennes)'); slot('cal_missions', 10, 42, 706, 500);
        label(10, 552, 'Onglet Portefeuille'); slot('cal_wallet', 10, 566, 706, 500);
        label(726, 28, 'Barres de progression : standard, contribution, terminée'); ['Progression standard', 'Progression de contribution', 'Progression terminée'].forEach((l, i) => text(726, 48 + i * 30, 160, l)); slot('bars', 900, 42, 230, 90); ['65 %', '12 450 / 25 000', '100 %'].forEach((v, i) => text(1140, 48 + i * 30, 126, v, {bold: true}));
        label(726, 142, 'Boutons Récupérer : défaut, survol, désactivé'); [['0x2f9e2f', 'Récupérer (défaut)'], ['0x4cbc4c', 'Récupérer (survol)'], ['0x9a9a9a', 'Récupérer (désactivé)']].forEach(([c, t], i) => raw(btn(726, 156 + i * 36, 240, '', t, {style: 301, color: c})));
        label(1000, 142, 'Onglets / filtres : sélectionné, non sélectionné'); slot('chips', 1000, 156, 270, 60);
        label(726, 276, 'Infobulle d’objet'); slot('tip_item', 726, 290, 300, 124);
        return 1110;
    }],
    settings: ['États – Paramètres', () => {
        heading(4, '1. Menu principal et fenêtre de paramètres');
        label(10, 28, 'Menu principal (Échap)'); slot('menu', 10, 42, 284, 400);
        label(304, 28, 'Paramètres, panneau Audio'); slot('settings', 304, 42, 680, 500);
        label(994, 28, 'Sortie audio, liste ouverte'); slot('dd_audio', 994, 42, 228, 120);
        label(994, 172, 'Cases : activée, désactivée, verrouillée'); [['chk_on', 'Activée (par défaut)'], ['chk_off', 'Désactivée'], ['chk_locked', 'Désactivée (verrouillée)']].forEach(([n, t], i) => { raw(`<checkbox x="994" y="${188 + i * 26}" width="18" height="18" params="17" style="3" name="${n}"/>`); text(1020, 190 + i * 26, 240, t, {color: i === 2 ? '0x9a94a8' : '0xd8d0e8'}); });
        label(994, 276, 'Curseurs : normal, survol'); raw(slider(994, 292, 200, 'slider_normal', 150, {value: '75 %'}).replace('0x1f2a33', '0xffffff')); raw(slider(994, 320, 200, 'slider_hover', 120, {value: '60 %'}).replace('0x1f2a33', '0xffffff'));
        label(994, 360, 'Boutons : normal, survol, pressé, désactivé'); [['0x2a6aa0', 'Bouton normal'], ['0x3a8ad0', 'Bouton survolé'], ['0x1a4a80', 'Bouton appuyé'], ['0x9a9a9a', 'Bouton désactivé']].forEach(([c, t], i) => raw(btn(994, 374 + i * 34, 260, '', t, {style: 301, color: c})));
        heading(552, '2. Interface et graphismes');
        label(10, 576, 'Réglages de l’interface'); slot('p_interface', 10, 590, 500, 400);
        label(520, 576, 'Réglages graphiques'); slot('p_graphics', 520, 590, 500, 400);
        label(1030, 576, 'Qualité globale, liste ouverte'); slot('dd_quality', 1030, 590, 228, 120);
        return 1030;
    }],
    access: ['États – Accessibilité et raccourcis', () => {
        heading(4, '1. Accessibilité, raccourcis, confirmation');
        label(10, 28, 'Accessibilité'); slot('p_access', 10, 42, 500, 400);
        label(520, 28, 'Raccourcis (keybinds)'); slot('p_keys', 520, 42, 500, 400);
        label(1030, 28, 'Mode daltonien, liste ouverte'); slot('dd_color', 1030, 42, 228, 120);
        label(10, 452, 'Confirmation'); slot('confirm', 10, 466, 320, 140);
        return 640;
    }],
};
const [caption, body] = BOARDS[BOARD];
const H = body();
const name = `states_${BOARD}`;
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<layout name="${name}" width="${W + 6}" height="${H}" version="0.1">
  <window>
    <frame x="0" y="0" width="${W + 6}" height="${H}" params="32769" style="103" name="${name}" caption="${caption}">
      <filters>
        <DropShadowFilter distance="4" alpha="0.349" blurX="4" blurY="4"/>
      </filters>
      <children>${parts.join('')}
      </children>
      <variables>
        <var key="margin_left" value="3" type="int"/>
        <var key="margin_top" value="36" type="int"/>
        <var key="margin_right" value="3" type="int"/>
        <var key="margin_bottom" value="3" type="int"/>
      </variables>
    </frame>
  </window>
</layout>
`;
fs.writeFileSync(new URL(`./${name}.xml`, import.meta.url), xml);
console.log('board written', name);
