// Generates the "États – Dialogues PNJ" board: labelled slots the fill script populates.
import fs from 'node:fs';

const W = 1270, H = 1300;
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

heading(4, '1. Dialogue principal et états de quête');
label(10, 28, 'Dialogue PNJ principal (choix, un verrouillé)'); slot('dialog_main', 10, 42, 440, 420);
label(460, 28, 'Quête disponible'); slot('dialog_available', 460, 42, 440, 260);
label(460, 312, 'Quête en cours'); slot('dialog_progress', 460, 326, 440, 250);
label(10, 472, 'Quête terminée'); slot('dialog_done', 10, 486, 440, 250);
label(460, 586, 'Remise de récompense'); slot('dialog_reward', 460, 600, 440, 300);
label(910, 28, 'Menu d’interaction PNJ'); slot('npc_menu', 910, 42, 230, 250);
label(910, 302, 'Indicateurs en jeu'); slot('marker_quest', 910, 316, 24, 24); slot('marker_talk', 950, 316, 24, 24); slot('prompt', 990, 316, 120, 28);
label(910, 356, 'Choix : normal, survol, sélectionné, verrouillé'); slot('choice_normal', 910, 370, 350, 40); slot('choice_hover', 910, 416, 350, 40); slot('choice_selected', 910, 462, 350, 40); slot('choice_locked', 910, 508, 350, 40);
label(910, 560, 'Infobulle d’objet'); slot('tip', 910, 574, 300, 124);
heading(912, '2. Messages');
label(10, 936, 'Message d’avertissement'); slot('warning', 10, 950, 520, 40);
label(540, 936, 'Confirmation'); slot('confirm', 540, 950, 320, 140);
label(10, 1000, 'Toasts de succès et d’erreur'); slot('toast_ok', 10, 1014, 320, 46); slot('toast_err', 10, 1066, 320, 46);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<layout name="states_npc" width="${W + 6}" height="${H - 140}" version="0.1">
  <window>
    <frame x="0" y="0" width="${W + 6}" height="${H - 140}" params="32769" style="103" name="states_npc" caption="États – Dialogues PNJ">
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
fs.writeFileSync(new URL('./states_npc.xml', import.meta.url), xml);
console.log('board written');
