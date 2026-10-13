// Generates the "États – Profil et interactions" board: labelled slots fill_board.js populates.
import fs from 'node:fs';
import {btn, bmp, I} from '../../tools/ui_helpers.mjs';

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

heading(4, '1. Fiche profil, inspection, carte sociale');
label(10, 28, 'Fiche profil joueur (onglet Général)'); slot('profile', 10, 42, 380, 500);
label(400, 28, 'Inspection d’équipement, objet survolé'); slot('inspect', 400, 42, 540, 480);
label(948, 28, 'Carte sociale compacte'); slot('card', 948, 42, 320, 472);
label(948, 524, 'Actions verrouillées / indisponibles'); slot('locked_1', 948, 538, 270, 30); slot('locked_2', 948, 574, 270, 30);
label(948, 614, 'Confirmation d’action'); slot('confirm', 948, 628, 320, 140);
label(10, 552, 'Menu contextuel, survol'); slot('menu', 10, 566, 200, 212);
label(220, 552, 'États de bouton');
[['0x2a6aa0', 'Bouton par défaut'], ['0x3a8ad0', 'Survol (Hover)'], ['0x1a4a80', 'Appuyé (Pressed)'], ['0x9a9a9a', 'Désactivé'], ['0x8a2a2a', 'Verrouillé']].forEach(([c, t], i) => raw(btn(220, 566 + i * 34, 170, '', t, {style: 301, color: c})));
raw(bmp(228, 708, 16, 16, I.lock, {color: '0xffffff'}));
heading(792, '2. Recherche, messages privés, infobulle');
label(10, 816, 'Recherche / ajout d’ami / signalement'); slot('search', 10, 830, 560, 360);
label(580, 816, 'Messages privés (chuchoter)'); slot('whisper', 580, 830, 300, 250);
label(890, 816, 'Infobulle d’objet'); slot('tip', 890, 830, 300, 124);
const H = 1232;
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<layout name="states_profile" width="${W + 6}" height="${H}" version="0.1">
  <window>
    <frame x="0" y="0" width="${W + 6}" height="${H}" params="32769" style="103" name="states_profile" caption="États – Profil et interactions">
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
fs.writeFileSync(new URL('./states_profile.xml', import.meta.url), xml);
console.log('board written states_profile');
