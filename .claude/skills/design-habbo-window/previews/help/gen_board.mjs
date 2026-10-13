// Generates the "États – Outils joueur, aide et sécurité" board: labelled slots fill_board.js populates.
import fs from 'node:fs';
import {btn} from '../../tools/ui_helpers.mjs';

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

heading(4, '1. Tutoriel et codex');
label(10, 28, 'Guide d’Ambreia (étape 1, bulles d’aide)'); slot('guide', 10, 42, 620, 400);
label(640, 28, 'Codex d’Ambreia (Statistiques)'); slot('codex', 640, 42, 620, 400);
heading(452, '2. Signalement, connexion, inactivité, notifications');
label(10, 476, 'Signaler un joueur'); slot('report', 10, 490, 320, 440);
label(340, 476, 'Connexion perdue'); slot('reconnect', 340, 490, 460, 250);
label(810, 476, 'Inactivité (AFK)'); slot('afk', 810, 490, 360, 250);
label(340, 750, 'Centre de notifications'); slot('notifications', 340, 764, 540, 330);
label(10, 940, 'Fenêtre de confirmation'); slot('confirm', 10, 954, 320, 140);
label(890, 750, 'Infobulle'); slot('tip', 890, 764, 300, 124);
label(890, 898, 'Ligne de liste'); slot('list_row', 890, 912, 370, 40);
label(890, 962, 'États désactivé (avec indice) et survolé'); raw(btn(890, 976, 180, '', 'Bouton désactivé', {style: 301, color: '0x9a9a9a'})); slot('hint', 890, 1008, 180, 24); raw(btn(1080, 976, 180, '', 'Bouton survolé', {style: 301, color: '0x3a8ad0'}));
heading(1104, '3. Bannière et toasts');
label(10, 1128, 'Bannière d’avertissement'); slot('banner', 10, 1142, 460, 40);
label(480, 1128, 'Toast de succès'); slot('toast_ok', 480, 1142, 320, 46);
label(810, 1128, 'Toast d’erreur'); slot('toast_err', 810, 1142, 320, 46);
const H = 1236;
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<layout name="states_help" width="${W + 6}" height="${H}" version="0.1">
  <window>
    <frame x="0" y="0" width="${W + 6}" height="${H}" params="32769" style="103" name="states_help" caption="États – Outils joueur, aide et sécurité">
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
fs.writeFileSync(new URL('./states_help.xml', import.meta.url), xml);
console.log('board written states_help');
