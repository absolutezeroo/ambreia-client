// Generates the "États – Quêtes" board: labelled slots the fill script populates.
import fs from 'node:fs';

const W = 1270, H = 760;
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
const heading = (y, caption) => { text(10, y, 900, caption, {size: 12, bold: true, color: '0x24607f'}); parts.push(`\n        <container x="10" y="${y + 18}" width="${W - 20}" height="1" params="16" style="8" color="0xffd0d0c8" background="true"/>`); };
const label = (x, y, caption) => text(x, y, 300, caption, {size: 9, bold: true, color: '0xd8d0e8'});
const slot = (name, x, y, w, h) => parts.push(`\n        <container x="${x}" y="${y}" width="${w}" height="${h}" params="16" style="3" name="${name}"><children/></container>`);
const note = (x, y, w, caption) => text(x, y, w, caption, {size: 9, color: '0xd8d0e8'});

heading(4, '1. Lignes de quête');
[['Normal', 'row_normal'], ['Survol (soulevée)', 'row_hover'], ['Sélectionnée (contour)', 'row_selected'], ['Verrouillée (niveau requis)', 'row_locked'], ['À rendre', 'row_ready']].forEach(([l, n], i) => { label(10 + i * 252, 28, l); slot(n, 10 + i * 252, 42, 272, 44); });
label(10, 96, 'Quotidienne – en cours / terminée'); slot('daily_progress', 10, 110, 272, 56); slot('daily_done', 296, 110, 272, 56);
label(582, 96, 'Terminée – normal / sélectionnée'); slot('done_normal', 582, 110, 272, 38); slot('done_selected', 868, 110, 272, 38);
label(10, 176, 'En-tête de région (compteur, repli)'); slot('region', 10, 190, 272, 24);
label(296, 176, 'Objectifs : non commencé, terminé, survol'); slot('obj_todo', 296, 190, 394, 22); slot('obj_done', 296, 216, 394, 22);
label(700, 176, 'Minuteur de réinitialisation (normal, sous 6 h)'); text(700, 192, 300, 'Réinitialisation dans : 18h 23min', {size: 11, color: '0xe8e0f0'}); text(700, 210, 300, 'Réinitialisation dans : 2h 05min', {size: 11, bold: true, color: '0xfac200'});
label(1000, 176, 'Bannière avec badge répétable'); slot('repeatable', 1000, 190, 270, 56);

heading(250, '2. Boutons, menus et infobulles');
label(10, 274, 'Suivre / Abandonner / Rendre'); parts.push(`
        <button_thick x="10" y="290" width="160" height="28" params="131089" style="300" caption="\${vortex.quest.track}" width_min="160" width_max="160"/>
        <button_thick x="178" y="290" width="124" height="28" params="131089" style="301" color="0xd23a2a" caption="\${vortex.quest.abandon}" width_min="124" width_max="124"/>
        <button_thick x="310" y="290" width="160" height="28" params="131089" style="301" color="0x2f9e2f" caption="\${vortex.quest.turn_in}" width_min="160" width_max="160"/>`);
label(490, 274, 'Filtre des régions (ouvert)'); slot('menu_regions', 490, 290, 200, 180);
label(700, 274, 'Tri (ouvert)'); slot('menu_sort', 700, 290, 200, 160);
label(910, 274, 'Menu contextuel d’une quête'); slot('menu_context', 910, 290, 200, 110);
label(10, 330, 'Infobulle de récompense'); slot('tip_reward', 10, 346, 240, 86);
label(260, 330, 'Infobulle d’objectif'); slot('tip_objective', 260, 346, 240, 86);
label(10, 440, 'Épingle : voir sur la carte'); slot('tip_pin', 10, 456, 240, 86);
label(260, 440, 'Quête répétable'); slot('tip_repeatable', 260, 456, 240, 86);

heading(556, '3. Notifications et suivi HUD');
label(10, 580, 'Nouvelle quête'); slot('toast_new', 10, 596, 320, 46);
label(340, 580, 'Progression'); slot('toast_progress', 340, 596, 320, 46);
label(670, 580, 'Ligne du suivi HUD : normale / sélectionnée'); slot('hud_row', 670, 596, 330, 44); slot('hud_row_selected', 670, 646, 330, 44);
note(10, 660, 640, 'Survol : ligne soulevée d’un pixel (lifted_hover). Onglets, barres de défilement et case à cocher désactivée viennent du skin.');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<layout name="states_quests" width="${W + 6}" height="${H + 40}" version="0.1">
  <window>
    <frame x="0" y="0" width="${W + 6}" height="${H + 40}" params="32769" style="103" name="states_quests" caption="États – Quêtes">
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
fs.writeFileSync(new URL('./states_quests.xml', import.meta.url), xml);
console.log('board written');
