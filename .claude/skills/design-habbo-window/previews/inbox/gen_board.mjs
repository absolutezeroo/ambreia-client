// Generates the "États – Courrier et échange" board: labelled slots the fill script populates.
import fs from 'node:fs';

const W = 1270;
const parts = [];
const text = (x, y, w, caption, {size = 10, bold = false, color = '0xd8d0e8', align = 'left'} = {}) => parts.push(`
        <text x="${x}" y="${y}" width="${w}" height="16" params="16" style="3" caption="${caption}">
          <variables>
            <var key="text_style" value="${bold ? 'u_bold' : 'u_regular'}" type="String"/>
            <var key="font_size" value="${size}" type="uint"/>
            <var key="text_color" value="${color}" type="hex"/>
            <var key="auto_size" value="${align}" type="String"/>
            <var key="mouse_wheel_enabled" value="false" type="Boolean"/>
          </variables>
        </text>`);
const heading = (y, caption) => { text(10, y, 900, caption, {size: 12, bold: true, color: '0xffd890'}); parts.push(`\n        <container x="10" y="${y + 18}" width="${W - 20}" height="1" params="16" style="8" color="0xff8a78a8" background="true"/>`); };
const label = (x, y, caption) => text(x, y, 300, caption, {size: 9, bold: true});
const button = (x, y, w, caption, color) => parts.push(`
        <button x="${x}" y="${y}" width="${w}" height="28" params="131089" style="301" color="${color}" caption="${caption}" width_min="${w}" width_max="${w}" height_min="28" height_max="28"/>`);
const slot = (name, x, y, w, h) => parts.push(`\n        <container x="${x}" y="${y}" width="${w}" height="${h}" params="16" style="3" name="${name}"><children/></container>`);

const BOARD = process.argv[2] || 'inbox';
if(BOARD === 'inbox')
{
    heading(4, '1. Courrier');
    label(10, 28, 'Fenêtre principale'); slot('inbox', 10, 42, 700, 520);
    label(720, 28, 'États de message (non lu, lu, survol, sélectionné, pièce jointe…)');
    ['unread', 'read', 'hover', 'selected', 'attach', 'system', 'pinned', 'expired'].forEach((n, i) => slot(`msg_${n}`, 720, 42 + i * 56, 300, 50));
    label(1030, 28, 'Toast d’envoi'); slot('toast_sent', 1030, 42, 236, 46);
    label(1030, 98, 'Infobulle de pièce jointe'); slot('tip_attach', 1030, 112, 236, 124);
    label(1030, 246, 'Boutons selon le contexte'); button(1030, 260, 236, 'Tout récupérer', '0x2f9e2f'); button(1030, 296, 236, 'Récupérer les pièces', '0x2a6aa0'); button(1030, 332, 236, 'Supprimer', '0x8c8c86'); button(1030, 368, 236, 'Tout supprimer', '0xd23a2a');
    heading(572, '2. Composition');
    label(10, 596, 'Nouveau message'); slot('compose', 10, 610, 440, 360);
}
else
{
    heading(4, '1. Échange : proposition, joueur prêt, verrouillé');
    label(10, 28, 'Proposition en cours'); slot('trade', 10, 42, 600, 408);
    label(650, 28, 'Joueur prêt'); slot('trade_ready', 650, 42, 600, 408);
    label(10, 460, 'Les deux confirmés, verrouillé'); slot('trade_locked', 10, 474, 600, 408);
    label(650, 460, 'Confirmation finale'); slot('trade_confirm', 650, 474, 340, 280);
    label(650, 768, 'Avertissement'); slot('warning', 650, 782, 460, 60);
    heading(892, '2. Séparation de pile, infobulle');
    label(10, 916, 'Séparation de pile'); slot('split', 10, 930, 300, 182);
    label(320, 916, 'Infobulle d’objet'); slot('tip_item', 320, 930, 300, 124);
}
const H = BOARD === 'inbox' ? 1010 : 1156;
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<layout name="states_inbox" width="${W + 6}" height="${H}" version="0.1">
  <window>
    <frame x="0" y="0" width="${W + 6}" height="${H}" params="32769" style="103" name="states_inbox" caption="États – Courrier et échange">
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
fs.writeFileSync(new URL(`./states_${BOARD}.xml`, import.meta.url), xml.replace(/states_inbox/g, `states_${BOARD}`).replace('États – Courrier et échange', BOARD === 'inbox' ? 'États – Courrier' : 'États – Échange'));
console.log('board written');
