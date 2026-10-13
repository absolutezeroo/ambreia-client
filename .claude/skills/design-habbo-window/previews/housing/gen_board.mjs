// Generates the housing boards (`node gen_board.mjs housing|parts`): labelled slots fill_board.js populates.
import fs from 'node:fs';

const BOARD = process.argv[2] || 'housing';
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

let H, caption;
if(BOARD === 'housing')
{
    caption = 'États – Housing';
    heading(4, '1. Navigateur de logements, catalogue de mobilier');
    label(10, 28, 'Navigateur (Mes logements)'); slot('navigator', 10, 42, 560, 400);
    label(580, 28, 'Catalogue (Mobilier, premier objet sélectionné)'); slot('catalog', 580, 42, 560, 440);
    heading(494, '2. Gestion, aperçu, mode placement');
    label(10, 518, 'Gestion du logement'); slot('manage', 10, 532, 380, 520);
    label(400, 518, 'Aperçu et outil de décoration'); slot('preview', 400, 532, 400, 440);
    label(810, 518, 'Mode placement (Déplacer actif)'); slot('edit', 810, 532, 380, 360);
    H = 1100;
}
else
{
    caption = 'États – Housing, permissions et composants';
    heading(4, '1. Permissions, états, confirmations');
    label(10, 28, 'Permissions d’accès'); slot('permissions', 10, 42, 380, 360);
    label(400, 28, 'Onglets : normal, survol, sélectionné'); slot('tabs', 400, 42, 280, 70);
    label(400, 122, 'Emplacement d’objet : sélectionné, normal'); slot('slots', 400, 136, 140, 56);
    label(400, 202, 'Mobilier verrouillé'); slot('locked', 400, 216, 56, 56); text(464, 226, 200, 'Objet verrouillé', {bold: true}); text(464, 244, 200, 'Non modifiable', {color: '0xff8a7a'});
    label(700, 28, 'Infobulle'); slot('tip', 700, 42, 300, 124);
    label(700, 176, 'Confirmation de suppression'); slot('confirm_delete', 700, 190, 320, 140);
    label(400, 290, 'Confirmation de stockage'); slot('confirm_store', 400, 304, 320, 140);
    H = 500;
}
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
