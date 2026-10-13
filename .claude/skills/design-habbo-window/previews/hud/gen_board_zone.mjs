// Generates the "États – Zones et butin" board: labelled slots the fill script populates.
import fs from 'node:fs';

const W = 1270, H = 824;
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

heading(4, '1. Popups d’entrée de zone');
label(10, 28, 'Zone sûre'); slot('zone_safe', 10, 42, 360, 120);
label(380, 28, 'Zone JcJ avec confirmation'); slot('zone_pvp', 380, 42, 360, 160);
label(750, 28, 'Entrée du donjon (détaillée)'); slot('zone_dungeon', 750, 42, 360, 230);
label(10, 172, 'Niveau conseillé supérieur (alerte)'); slot('zone_danger', 10, 186, 360, 230);
label(380, 212, 'Toasts compacts : normal, disparition (5 s), JcJ, donjon, danger'); slot('toast_safe', 380, 226, 320, 46); slot('toast_count', 380, 278, 320, 46); slot('toast_pvp', 380, 330, 320, 46); slot('toast_dungeon', 380, 382, 320, 46); slot('toast_danger', 750, 282, 320, 46);
label(750, 334, 'Infobulle d’explication (bouton ?)'); slot('tip_pvp', 750, 348, 240, 86);

heading(432, '2. Butin sur monstre');
label(10, 456, 'Fenêtre de butin'); slot('loot', 10, 470, 560, 420);
label(580, 456, 'Butin de groupe'); slot('loot_group', 580, 470, 420, 170);
label(580, 650, 'Notifications de butin obtenu'); slot('loot_toast_1', 580, 664, 320, 46); slot('loot_toast_2', 580, 716, 320, 46);
label(1010, 456, 'Infobulle rapide'); slot('loot_tip', 1010, 470, 250, 124);
label(580, 776, 'Ramassage automatique et règles de distribution'); slot('loot_settings', 580, 790, 580, 150);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<layout name="states_zone" width="${W + 6}" height="${H + 40 + 130}" version="0.1">
  <window>
    <frame x="0" y="0" width="${W + 6}" height="${H + 40 + 130}" params="32769" style="103" name="states_zone" caption="États – Zones et butin">
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
fs.writeFileSync(new URL('./states_zone.xml', import.meta.url), xml);
console.log('board written');
