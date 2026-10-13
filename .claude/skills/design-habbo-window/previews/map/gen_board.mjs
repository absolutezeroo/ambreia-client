// Generates the "États – Carte du monde et voyage" board: labelled slots fill_board.js populates.
import fs from 'node:fs';
import {btn} from '../../tools/ui_helpers.mjs';

const W = 1270;
const parts = [];
const text = (x, y, w, caption, {size = 10, bold = false, color = '0xd8d0e8', align = ''} = {}) => parts.push(`
        <text x="${x}" y="${y}" width="${w}" height="16" params="16" style="3" caption="${caption}">
          <variables>
            <var key="text_style" value="${bold ? 'u_bold' : 'u_regular'}" type="String"/>
            <var key="font_size" value="${size}" type="uint"/>
            <var key="text_color" value="${color}" type="hex"/>${align ? `\n            <var key="auto_size" value="${align}" type="String"/>` : ''}
            <var key="mouse_wheel_enabled" value="false" type="Boolean"/>
          </variables>
        </text>`);
const heading = (y, caption) => { text(10, y, 900, caption, {size: 12, bold: true, color: '0xffd890'}); parts.push(`\n        <container x="10" y="${y + 18}" width="${W - 20}" height="1" params="16" style="8" color="0xff8a78a8" background="true"/>`); };
const label = (x, y, caption) => text(x, y, 400, caption, {size: 9, bold: true});
const slot = (name, x, y, w, h) => parts.push(`\n        <container x="${x}" y="${y}" width="${w}" height="${h}" params="16" style="3" name="${name}"><children/></container>`);
const raw = (xml) => parts.push(`\n${xml}`);

heading(4, '1. Carte du monde et téléportation');
label(10, 28, 'Carte, onglet Région, survol de Forêt d’Ambre'); slot('map', 10, 42, 790, 440);
label(810, 28, 'Téléportation rapide (sélection, non découvert)'); slot('teleport', 810, 42, 420, 380);
heading(494, '2. Découverte de zone, itinéraire de quête');
label(10, 518, 'Découverte de zone'); slot('discovered', 10, 532, 600, 240);
label(620, 518, 'Quête suivie, itinéraire'); slot('route', 620, 532, 460, 300);
heading(846, '3. Confirmation, marqueurs, infobulles, composants');
label(10, 870, 'Confirmation de téléportation (en combat)'); slot('confirm', 10, 884, 320, 270);
label(340, 870, 'Marqueurs : classique, survol, sélectionné, désactivé'); slot('markers', 340, 884, 240, 44);
['Classique', 'Survol', 'Sélectionné', 'Désactivé'].forEach((t, i) => text(340 + i * 60, 930, 56, t, {size: 9, align: 'center'}));
label(340, 960, 'Icônes de carte'); slot('icons', 340, 974, 330, 70);
label(690, 870, 'Infobulle de lieu (survol)'); slot('place_tip', 690, 884, 230, 118);
label(930, 870, 'Infobulle (point de voyage)'); slot('tip', 930, 884, 300, 124);
label(690, 1016, 'Boutons'); [['0x2a6aa0', 'Bouton par défaut'], ['0x3a8ad0', 'Survol (Hover)'], ['0x1a4a80', 'Appuyé (Pressed)'], ['0x9a9a9a', 'Désactivé']].forEach(([c, t], i) => raw(btn(690, 1030 + i * 32, 180, '', t, {style: 301, color: c})));
label(880, 1016, 'Liste déroulante ouverte'); slot('dropdown', 880, 1030, 228, 150);
label(1118, 1016, 'Cases et choix');
[['chk_on', 'Option activée'], ['chk_off', 'Option désactivée']].forEach(([n, t], i) => { raw(`<checkbox x="1118" y="${1032 + i * 26}" width="18" height="18" params="17" style="3" name="${n}"/>`); text(1142, 1034 + i * 26, 124, t); });
[['radio_on', 'Sélectionné'], ['radio_off', 'Non sélectionné']].forEach(([n, t], i) => { raw(`<radiobutton x="1118" y="${1084 + i * 26}" width="18" height="18" params="17" style="3" name="${n}"/>`); text(1142, 1086 + i * 26, 124, t); });
const H = 1200;
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<layout name="states_map" width="${W + 6}" height="${H}" version="0.1">
  <window>
    <frame x="0" y="0" width="${W + 6}" height="${H}" params="32769" style="103" name="states_map" caption="États – Carte du monde et voyage">
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
fs.writeFileSync(new URL('./states_map.xml', import.meta.url), xml);
console.log('board written states_map');
