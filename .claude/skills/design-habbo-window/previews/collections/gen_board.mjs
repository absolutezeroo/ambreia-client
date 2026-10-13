// Generates the "États – Succès, bestiaire, montures, compagnons" board: labelled slots the fill script populates.
import fs from 'node:fs';

const W = 1270, H = 1218;
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
const button = (x, y, w, caption, color) => parts.push(`\n        <button x="${x}" y="${y}" width="${w}" height="28" params="131089" style="301" color="${color}" caption="${caption}" width_min="${w}" width_max="${w}" height_min="28" height_max="28"/>`);

heading(4, '1. Succès : lignes, badges, objets de collection, titres');
label(10, 28, 'Ligne de succès : normal / survol / sélectionnée / terminée'); ['a_normal', 'a_hover', 'a_selected', 'a_done'].forEach((n, i) => slot(n, 10, 42 + i * 58, 494, 54));
label(514, 28, 'Badges : normal, survol, sélectionné, nouveau, verrouillé'); ['b_normal', 'b_hover', 'b_selected', 'b_new', 'b_locked'].forEach((n, i) => slot(n, 514 + (i % 3) * 100, 42 + Math.floor(i / 3) * 100, 94, 94));
label(820, 28, 'Objets : découvert, survol, sélectionné, manquant, verrouillé, rare'); ['c_found', 'c_hover', 'c_selected', 'c_missing', 'c_locked', 'c_rare'].forEach((n, i) => slot(n, 820 + (i % 3) * 64, 42 + Math.floor(i / 3) * 56, 58, 52));
label(820, 160, 'Indicateurs : 0 %, 30 %, 75 %, 100 %'); ['p_0', 'p_30', 'p_75', 'p_100'].forEach((n, i) => slot(n, 820 + i * 64, 174, 58, 34));
label(10, 290, 'Titre : normal / actif / verrouillé'); ['t_normal', 't_active', 't_locked'].forEach((n, i) => slot(n, 10 + i * 370, 304, 360, 60));
heading(380, '2. Bestiaire, montures, compagnons : lignes et cartes');
label(10, 404, 'Créature : découverte / survol / sélectionnée / inconnue'); ['k_known', 'k_hover', 'k_selected', 'k_unknown'].forEach((n, i) => slot(n, 10, 418 + i * 50, 272, 46));
label(292, 404, 'Monture / compagnon : normal, survol, sélectionné, verrouillé'); ['m_normal', 'm_hover', 'm_selected', 'm_locked'].forEach((n, i) => slot(n, 292, 418 + i * 60, 284, 56));
label(586, 404, 'Cartes : actif, repos, libre, verrouillé, survol'); ['card_active', 'card_rest', 'card_free', 'card_locked', 'card_hover'].forEach((n, i) => slot(n, 586 + i * 134, 418, 128, 128));
label(586, 556, 'Butins : commun, peu commun, rare, épique, inconnu'); ['l_common', 'l_uncommon', 'l_rare', 'l_epic', 'l_unknown'].forEach((n, i) => slot(n, 586 + i * 90, 570, 84, 84));
label(1050, 556, 'Faiblesse : simple / survol'); slot('aff_normal', 1050, 570, 120, 22); slot('aff_hover', 1050, 598, 120, 22);
heading(664, '3. Boutons, jauge, raretés');
label(10, 688, 'Activer / Monter / Invoquer / Nourrir / Retirer (normal, survol, pressé, désactivé)');
button(10, 704, 110, 'Activer', '0x2f9e2f'); button(126, 704, 110, 'Activer', '0x3fbe3f'); button(242, 704, 110, 'Activer', '0x1f7e1f'); button(358, 704, 110, 'Activer', '0x9a9a9a');
button(10, 738, 110, 'Monter', '0x2f9e2f'); button(126, 738, 110, 'Invoquer', '0x2a6aa0'); button(242, 738, 110, 'Nourrir', '0xd89a20'); button(358, 738, 110, 'Retirer le titre', '0xd23a2a');
label(480, 688, 'Jauge d’affection et paliers'); slot('affection', 480, 704, 300, 120);
label(790, 688, 'Icônes de rareté'); slot('rarities', 790, 704, 220, 130);
label(1020, 688, 'Raccourci d’invocation'); slot('shortcut', 1020, 704, 240, 56);
heading(844, '4. Menus, infobulles, popups, notifications');
label(10, 868, 'Menu contextuel : succès / badge / monture'); slot('menu_ach', 10, 882, 200, 110); slot('menu_badge', 220, 882, 200, 110); slot('menu_mount', 430, 882, 200, 135);
label(640, 868, 'Infobulles : récompense, badge, butin, nourriture, titre verrouillé'); slot('tip_reward', 640, 882, 240, 86); slot('tip_badge', 890, 882, 300, 124); slot('tip_loot', 640, 978, 240, 86); slot('tip_food', 890, 1016, 300, 124); slot('tip_locked', 640, 1074, 240, 86);
label(10, 1028, 'Confirmation, activation, suppression'); slot('confirm', 10, 1042, 320, 140); slot('activate', 340, 1042, 290, 150);
label(10, 1192, 'Notifications : titre activé, condition non remplie, collection complétée'); slot('toast_ok', 10, 1206, 320, 46); slot('toast_err', 340, 1206, 320, 46); slot('toast_coll', 670, 1206, 320, 46);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<layout name="states_collections" width="${W + 6}" height="${H + 80}" version="0.1">
  <window>
    <frame x="0" y="0" width="${W + 6}" height="${H + 80}" params="32769" style="103" name="states_collections" caption="États – Succès, bestiaire, montures, compagnons">
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
fs.writeFileSync(new URL('./states_collections.xml', import.meta.url), xml);
console.log('board written');
