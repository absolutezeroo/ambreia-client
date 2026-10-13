// Generates the "États – Personnage" board layout: labelled slots the fill script populates,
// plus the pure-layout elements (buttons, badges, indicators) written inline.
import fs from 'node:fs';

const W = 1240, H = 1150;
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
const heading = (y, caption) => { text(10, y, 600, caption, {size: 12, bold: true, color: '0xffd890'}); parts.push(`\n        <container x="10" y="${y + 18}" width="${W - 20}" height="1" params="16" style="8" color="0xff8a78a8" background="true"/>`); };
const label = (x, y, caption) => text(x, y, 250, caption, {size: 9, bold: true, color: '0xb8b0c8'});
const slot = (name, x, y, w, h) => parts.push(`\n        <container x="${x}" y="${y}" width="${w}" height="${h}" params="16" style="3" name="${name}"><children/></container>`);
const pill = (x, y, w, caption, bg, fg) => parts.push(`
        <border x="${x}" y="${y}" width="${w}" height="20" params="16" style="2" color="${bg}">
          <children>
            <text x="0" y="2" width="${w}" height="16" params="16" style="3" caption="${caption}">
              <variables>
                <var key="text_style" value="u_bold" type="String"/>
                <var key="font_size" value="11" type="uint"/>
                <var key="text_color" value="${fg}" type="hex"/>
                <var key="auto_size" value="center" type="String"/>
                <var key="mouse_wheel_enabled" value="false" type="Boolean"/>
              </variables>
            </text>
          </children>
        </border>`);
const iconButton = (x, y, uri, tint, {disabled = false} = {}) => parts.push(`
        <border x="${x}" y="${y}" width="20" height="20" params="17" style="2" dynamic_style="button" color="${disabled ? '0xc8c8c0' : '0xe4e4dc'}">
          <children>
            <static_bitmap x="2" y="2" width="16" height="16" params="16" style="3" tags="%23icon" color="${disabled ? '0xa0a098' : tint}">
              <variables>
                <var key="asset_uri" value="${uri}" type="String"/>
                <var key="stretched_x" value="false" type="Boolean"/>
                <var key="stretched_y" value="false" type="Boolean"/>
              </variables>
            </static_bitmap>
          </children>
        </border>`);
const helpButton = (x, y) => parts.push(`
        <border x="${x}" y="${y}" width="20" height="20" params="17" style="2" dynamic_style="button" color="0xe4e4dc">
          <children>
            <text x="0" y="2" width="20" height="16" params="16" style="3" tags="%23icon" caption="?">
              <variables>
                <var key="text_style" value="u_bold" type="String"/>
                <var key="font_size" value="11" type="uint"/>
                <var key="text_color" value="0x666666" type="hex"/>
                <var key="auto_size" value="center" type="String"/>
                <var key="mouse_wheel_enabled" value="false" type="Boolean"/>
              </variables>
            </text>
          </children>
        </border>`);

// A — title rows
heading(4, 'Ligne de titre');
const rowStates = [['Normal', 'row_normal'], ['Survol (soulevée de 1 px, lifted_hover)', 'row_hover'], ['Appui (assombrie, lifted_hover)', 'row_pressed'], ['Verrouillé', 'row_locked']];
rowStates.forEach(([l, n], i) => { label(10 + i * 262, 28, l); slot(n, 10 + i * 262, 42, 252, 48); });
[['Actif (badge)', 'row_active'], ['Sélectionné (contour, clavier ou clic)', 'row_selected'], ['Actif + sélectionné', 'row_active_selected']].forEach(([l, n], i) => { label(10 + i * 262, 98, l); slot(n, 10 + i * 262, 112, 252, 48); });

// B — buttons (layout only)
heading(176, 'Boutons d’action et boutons d’icône');
label(10, 200, 'Activer le titre'); parts.push(`\n        <button_thick x="10" y="214" width="180" height="28" params="131089" style="6" color="0x2f9e2f" caption="\${vortex.character.titles.equip}" width_min="180" width_max="180"/>`);
label(200, 200, 'Retirer le titre'); parts.push(`\n        <button_thick x="200" y="214" width="180" height="28" params="131089" style="6" color="0xd23a2a" caption="\${vortex.character.titles.remove}" width_min="180" width_max="180"/>`);
label(390, 200, 'Titre verrouillé (désactivé)'); parts.push(`\n        <button_thick x="390" y="214" width="180" height="28" params="131089" style="3" color="0xb8b8b0" caption="\${vortex.character.titles.locked}" width_min="180" width_max="180"/>`);
label(580, 200, 'Bouton principal'); parts.push(`\n        <button_thick x="580" y="214" width="180" height="28" params="131089" style="3" caption="\${vortex.character.titles.see_all}" width_min="180" width_max="180"/>`);
label(770, 200, 'Éditer'); iconButton(770, 218, 'rpg/ui-icons/tools_crafting_graphic_design_pencil_icon', '0xf0c040');
label(810, 200, 'Chercher'); iconButton(810, 218, 'rpg/ui-icons/software_magnifier_zoom_looking_magnifying_glass_icon', '0x2a8fd6');
label(860, 200, 'Aide'); helpButton(860, 218);
label(900, 200, 'Détail'); iconButton(900, 218, 'rpg/ui-icons/arrows_pointer_right_east_icon', '0x333333');
label(950, 200, 'Détail (désactivé)'); iconButton(950, 218, 'rpg/ui-icons/arrows_pointer_right_east_icon', '0x333333', {disabled: true});
text(770, 244, 460, 'Survol : icône éclaircie ; appui : icône assombrie et décalée de 1 px (style dynamique button).', {size: 9});

// C — menus
heading(268, 'Menus (filtre des catégories, choix du titre actif)');
label(10, 292, 'Filtre fermé'); slot('filter_closed', 10, 306, 280, 26);
label(10, 340, 'Filtre ouvert (coche sur la catégorie courante)'); slot('menu_categories', 10, 354, 200, 220);
label(320, 292, 'Choix du titre actif (depuis le crayon de l’aperçu)'); slot('menu_titles', 320, 306, 200, 160);
label(560, 292, 'Rareté : couleur du texte');
[['Commun', '0x777777'], ['Rare', '0x1077ac'], ['Épique', '0x8a2be2'], ['Légendaire', '0xd09000']].forEach(([c, col], i) => text(560 + i * 90, 308, 90, c, {size: 11, bold: true, color: col}));
label(560, 340, 'Indicateurs de relation (réputation)');
[['Amical', '0xb8e090', '0x2b7000', '\${vortex.reputation.standing.friendly.desc}'], ['Neutre', '0xe4e4dc', '0x444444', '\${vortex.reputation.standing.neutral.desc}'], ['Inconnu', '0xe4e4dc', '0x999999', '\${vortex.reputation.standing.unknown.desc}'], ['Hostile', '0xf0b8b0', '0xa01e10', '\${vortex.reputation.standing.hostile.desc}']].forEach(([c, bg, fg, d], i) => { pill(560, 356 + i * 26, 66, c, bg, fg); text(634, 358 + i * 26, 300, d, {size: 10, color: '0xffffff'}); });
label(960, 292, 'Indicateur de valeur');
text(960, 308, 60, '+4', {size: 11, bold: true, color: '0x2b9a00'}); text(1000, 308, 60, '-3', {size: 11, bold: true, color: '0xc30000'}); text(1040, 308, 60, '15%', {size: 11, bold: true, color: '0xffffff'});
text(960, 324, 280, 'bonus · malus · valeur neutre', {size: 9});
label(960, 340, 'Statut global'); slot('status_rows', 960, 356, 214, 80);
label(960, 440, 'Compteur'); text(960, 456, 120, '\${vortex.character.titles.owned}', {size: 12, bold: true, color: '0xffd890'}); text(1080, 456, 60, '6 / 12', {size: 12, bold: true, color: '0xffffff', align: 'right'});

// D — tooltips
heading(588, 'Infobulles (survol, 500 ms)');
[['Titre verrouillé', 'tip_locked'], ['Statistique', 'tip_stat'], ['Région / faction', 'tip_faction'], ['Crayon : Modifier le pseudonyme', 'tip_edit'], ['Loupe : Rechercher une guilde', 'tip_search']].forEach(([l, n], i) => { label(10 + i * 230, 612, l); slot(n, 10 + i * 230, 626, 220, 60); });
label(10, 700, 'Équipement (survol d’une case)'); slot('tip_equipment', 10, 714, 220, 130);
text(240, 714, 600, 'Chaque infobulle est un panneau sombre (border style 9) : titre blanc gras 11 px, corps 10 px. Celle de l’équipement ajoute l’emplacement, les bonus en vert et la rareté colorée.', {size: 10, color: '0xffffff'});

// E — reputation rows
heading(858, 'Lignes de réputation');
label(10, 882, 'Faction – normal'); slot('faction_normal', 10, 896, 548, 50);
label(570, 882, 'Faction – sélectionnée (contour)'); slot('faction_selected', 570, 896, 548, 50);
label(10, 952, 'Faction – hostile'); slot('faction_hostile', 10, 966, 548, 50);
label(570, 952, 'Compacte (aperçu) – avec aide'); slot('compact_normal', 570, 966, 274, 34);
label(856, 952, 'Compacte – niveau max'); slot('compact_max', 856, 966, 274, 34);

// F — stat rows
heading(1024, 'Lignes de statistique');
label(10, 1048, 'Attribut – normal'); slot('attr_normal', 10, 1062, 258, 30);
label(280, 1048, 'Attribut – sélectionné (clic → comparaison)'); slot('attr_selected', 280, 1062, 258, 30);
label(550, 1048, 'Statistique – bonus'); slot('stat_bonus', 550, 1062, 260, 20);
label(820, 1048, 'Statistique – malus'); slot('stat_malus', 820, 1062, 260, 20);
text(10, 1098, 1200, 'Survol : ligne soulevée de 1 px (lifted_hover). Les en-têtes de section portent le bouton ? qui ouvre la fenêtre d’aide.', {size: 9});

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<layout name="states_character" width="${W + 6}" height="${H + 40}" version="0.1">
  <window>
    <frame x="0" y="0" width="${W + 6}" height="${H + 40}" params="32769" style="3" name="states_character" caption="États – Personnage" color="0x418db0">
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
fs.writeFileSync(new URL('./states_character.xml', import.meta.url), xml);
console.log('board written');
