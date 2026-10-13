// Generates the "États – Mort et progression" board: labelled slots the fill script populates.
import fs from 'node:fs';

const W = 1270, H = 1250;
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
const slot = (name, x, y, w, h) => parts.push(`\n        <container x="${x}" y="${y}" width="${w}" height="${h}" params="16" style="3" name="${name}"><children/></container>`);

heading(4, '1. Mort, résurrection, wipe');
label(10, 28, 'Écran de mort (K.O.)'); slot('death', 10, 42, 380, 330);
label(400, 28, 'Proposition de résurrection'); slot('resurrect', 400, 42, 320, 236);
label(730, 28, 'Échec / wipe de donjon'); slot('wipe', 730, 42, 380, 290);
heading(386, '2. Réapparition et progression');
label(10, 410, 'Montée de niveau'); slot('levelup', 10, 424, 420, 360);
label(440, 410, 'Récapitulatif de récompenses'); slot('summary', 440, 424, 420, 340);
label(870, 410, 'Choix du point de réapparition'); slot('respawn', 870, 424, 330, 400);
heading(836, '3. Récompense de quête et confirmation');
label(10, 860, 'Choix de récompense de quête'); slot('reward_choice', 10, 874, 580, 300);
label(600, 860, 'Fenêtre de confirmation générique'); slot('confirm', 600, 874, 320, 140);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<layout name="states_death" width="${W + 6}" height="${H}" version="0.1">
  <window>
    <frame x="0" y="0" width="${W + 6}" height="${H}" params="32769" style="103" name="states_death" caption="États – Mort et progression">
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
fs.writeFileSync(new URL('./states_death.xml', import.meta.url), xml);
console.log('board written');
