// Generates the "États – Compétences" board: labelled slots the fill script populates.
import fs from 'node:fs';

const W = 1270, H = 660;
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
const button = (x, y, w, caption, {style = 300, color = ''} = {}) => parts.push(`
        <button x="${x}" y="${y}" width="${w}" height="28" params="131089" style="${style}"${color ? ` color="${color}"` : ''} caption="${caption}" width_min="${w}" width_max="${w}" height_min="28" height_max="28"/>`);
const row = (x0, y, items, w, h, step) => items.forEach(([l, n], i) => { label(x0 + i * step, y, l); slot(n, x0 + i * step, y + 14, w, h); });

heading(4, '1. Cases de compétence active (grille), cartes passives');
row(10, 28, [['Normal', 'tile_normal'], ['Survol', 'tile_hover'], ['Sélectionnée', 'tile_selected'], ['Améliorable', 'tile_upgradable'], ['Verrouillée', 'tile_locked'], ['Indisponible', 'tile_unavailable']], 76, 76, 92);
row(570, 28, [['Carte normale', 'card_normal'], ['Survol', 'card_hover'], ['Sélectionnée', 'card_selected']], 200, 60, 206);
row(570, 100, [['Niveau max', 'card_max'], ['Verrouillée', 'card_locked']], 200, 60, 206);
heading(176, '2. Nœuds de spécialisation, cases de la barre d’action');
row(10, 200, [['Normal', 'node_normal'], ['Survol', 'node_hover'], ['Sélectionné', 'node_selected'], ['Débloqué', 'node_unlocked'], ['Disponible', 'node_available'], ['Verrouillé', 'node_locked'], ['Indisponible', 'node_unavailable'], ['Complété', 'node_complete']], 50, 68, 70);
row(600, 200, [['Vide', 'slot_empty'], ['Normal', 'slot_normal'], ['Survol', 'slot_hover'], ['Sélectionnée', 'slot_selected'], ['Recharge', 'slot_cooldown'], ['Désactivée', 'slot_locked'], ['Objet', 'slot_item']], 52, 68, 90);
heading(296, '3. Boutons, menu de catégories, infobulles');
label(10, 320, 'Améliorer : normal / désactivé'); button(10, 336, 250, 'Améliorer (2 000)'); button(10, 370, 250, 'Améliorer (2 000)', {style: 301, color: '0x9a9a9a'});
label(10, 406, 'Ajouter 1 point : disponible / points insuffisants / prérequis'); button(10, 422, 250, 'Ajouter 1 point (1)'); button(10, 456, 250, 'Ajouter 1 point (1)', {style: 301, color: '0xd23a2a'}); button(10, 490, 250, 'Ajouter 1 point (1)', {style: 301, color: '0x9a9a9a'});
label(10, 526, 'Réinitialiser / Retirer l’assignation / Tout effacer'); button(10, 542, 170, 'Réinitialiser les raccourcis', {style: 301, color: '0x8c8c86'}); button(190, 542, 160, 'Retirer l’assignation', {style: 301, color: '0xd23a2a'}); button(360, 542, 120, 'Tout effacer', {style: 301, color: '0xd23a2a'});
label(290, 320, 'Menu de catégories (ouvert)'); slot('menu_types', 290, 336, 200, 180);
label(510, 320, 'Infobulle de compétence'); slot('tip_skill', 510, 336, 300, 200);
label(830, 320, 'Infobulle niveau suivant / objet'); slot('tip_next', 830, 336, 300, 86); slot('tip_item', 830, 430, 300, 86);
label(400, 580, 'Bandeau d’information'); slot('banner', 400, 596, 848, 58);
note(10, 584, 380, 'Survol : case soulevée d’un pixel (lifted_hover).');
note(10, 600, 380, 'Onglets, recherche, cases à cocher et barres de');
note(10, 614, 380, 'défilement viennent du skin.');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<layout name="states_skills" width="${W + 6}" height="${H + 40}" version="0.1">
  <window>
    <frame x="0" y="0" width="${W + 6}" height="${H + 40}" params="32769" style="103" name="states_skills" caption="États – Compétences">
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
fs.writeFileSync(new URL('./states_skills.xml', import.meta.url), xml);
console.log('board written');
