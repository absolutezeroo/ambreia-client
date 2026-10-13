// Generates the "États – Inventaire" board: labelled slots the fill script populates.
import fs from 'node:fs';

const W = 1270, H = 680;
const parts = [];
const text = (x, y, w, caption, {size = 10, bold = false, color = '0x666666', align = 'left'} = {}) => parts.push(`
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
const label = (x, y, caption) => text(x, y, 300, caption, {size: 9, bold: true, color: '0xd8d0e8'});
const slot = (name, x, y, w, h) => parts.push(`\n        <container x="${x}" y="${y}" width="${w}" height="${h}" params="16" style="3" name="${name}"><children/></container>`);
const note = (x, y, w, caption) => text(x, y, w, caption, {size: 9, color: '0xd8d0e8'});

heading(4, '1. Cases d’objet');
[['Normal', 'slot_normal'], ['Survol (soulevée)', 'slot_hover'], ['Sélectionnée', 'slot_selected'], ['Objet rare (épique)', 'slot_rare'], ['Nouveau', 'slot_new'], ['Équipé', 'slot_equipped'], ['Objet de quête', 'slot_quest'], ['Verrouillé', 'slot_locked'], ['Vide', 'slot_empty'], ['Glisser-déposer', 'slot_drop']]
    .forEach(([l, n], i) => { label(10 + i * 124, 28, l); slot(n, 10 + i * 124, 42, 56, 56); });
note(10 + 7 * 124, 102, 120, 'Débloqué au niv. 10');
note(10 + 9 * 124, 102, 120, 'Zone de dépôt active');

heading(122, '2. Infobulles et menus');
label(10, 146, 'Info rapide au survol'); slot('tip_1', 10, 160, 300, 124); slot('tip_2', 320, 160, 300, 124);
label(630, 146, 'Menu contextuel'); slot('menu_context', 630, 160, 200, 170);
label(850, 146, 'Infobulle d’objet (panneau de détails)'); slot('detail', 850, 160, 280, 500);

heading(300, '3. Fenêtres secondaires');
label(10, 324, 'Séparation de pile'); slot('split', 10, 338, 300, 182);
label(320, 324, 'Comparaison d’équipement'); slot('compare', 320, 338, 412, 156);
label(320, 504, 'Assigner au raccourci'); slot('hotkey', 320, 518, 256, 140);
note(10, 530, 300, 'Survol : case soulevée d’un pixel (lifted_hover).');
note(10, 546, 300, 'Les menus Filtre et Tri viennent du skin (dropmenu).');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<layout name="states_inventory" width="${W + 6}" height="${H + 40}" version="0.1">
  <window>
    <frame x="0" y="0" width="${W + 6}" height="${H + 40}" params="32769" style="103" name="states_inventory" caption="États – Inventaire">
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
fs.writeFileSync(new URL('./states_inventory.xml', import.meta.url), xml);
console.log('board written');
