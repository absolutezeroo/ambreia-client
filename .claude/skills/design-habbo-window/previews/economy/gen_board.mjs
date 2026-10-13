// Generates the "États – Économie" board: labelled slots the fill script populates.
import fs from 'node:fs';

const W = 1270, H = 900;
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

heading(4, '1. Lignes : boutique, hôtel des ventes, artisanat (normal / survol / sélectionné)');
label(10, 28, 'Article de boutique'); slot('shop_normal', 10, 42, 296, 40); slot('shop_hover', 10, 86, 296, 40); slot('shop_selected', 10, 130, 296, 40);
label(316, 28, 'Annonce (avec « votre offre »)'); slot('listing_normal', 316, 42, 470, 38); slot('listing_hover', 316, 84, 470, 38); slot('listing_own', 316, 126, 470, 38);
label(796, 28, 'Recette : normale, favorite, verrouillée'); slot('recipe_normal', 796, 42, 220, 46); slot('recipe_fav', 796, 92, 220, 46); slot('recipe_locked', 796, 142, 220, 46);
label(1026, 28, 'Commande : défaut, sélectionnée'); slot('order_normal', 1026, 42, 240, 62); slot('order_selected', 1026, 108, 240, 62);
heading(196, '2. Boutons, badges, étapes');
label(10, 220, 'Acheter : normal / survol / pressé / désactivé'); button(10, 236, 130, 'Acheter', '0x2f9e2f'); button(146, 236, 130, 'Acheter', '0x3fbe3f'); button(282, 236, 130, 'Acheter', '0x1f7e1f'); button(418, 236, 130, 'Acheter', '0x9a9a9a');
label(10, 272, 'Mettre en vente / Tout retirer / Tout vider / Fabriquer / Accélérer'); button(10, 288, 130, 'Mettre en vente', '0x2f9e2f'); button(146, 288, 130, 'Tout retirer', '0xd23a2a'); button(282, 288, 130, 'Tout vider', '0x8c8c86'); button(418, 288, 130, 'Fabriquer', '0x2a6aa0'); button(554, 288, 150, 'Accélérer (1 gemme)', '0xd89a20');
label(10, 324, 'Statuts du marché'); slot('status_list', 10, 338, 300, 150);
label(320, 324, 'Barres de progression : en cours, terminée, en pause, erreur'); slot('bars', 320, 338, 300, 110);
label(630, 324, 'Paliers : débloqué / verrouillé / survol'); slot('milestones', 630, 338, 390, 92);
label(630, 440, 'Pagination'); slot('pager', 630, 454, 300, 24);
label(1030, 220, 'Sélecteur de quantité'); slot('quantity', 1030, 236, 152, 26); slot('quantity_max', 1030, 268, 236, 26);
label(1030, 304, 'Cases de banque : vide, nouveau, pile, verrouillé'); slot('slot_empty', 1030, 318, 56, 56); slot('slot_new', 1090, 318, 56, 56); slot('slot_stack', 1150, 318, 56, 56); slot('slot_locked', 1210, 318, 56, 56);
label(1030, 384, 'Survol / sélection'); slot('slot_hover', 1030, 398, 56, 56); slot('slot_selected', 1090, 398, 56, 56);
heading(498, '3. Menus et fenêtres secondaires');
label(10, 522, 'Menu contextuel (annonce)'); slot('menu_listing', 10, 536, 200, 110);
label(10, 660, 'Menu de retrait (banque)'); slot('menu_bank', 10, 674, 200, 110);
label(340, 522, 'Modifier le prix'); slot('edit_price', 340, 536, 300, 176);
label(650, 522, 'Retirer une quantité'); slot('withdraw', 650, 536, 300, 176);
label(960, 522, 'Spécialisation / bonus'); slot('bonus', 960, 536, 300, 150);
label(220, 660, 'Retirer la vente ?'); slot('confirm_withdraw', 220, 674, 320, 140);
label(550, 722, 'Infobulles : commission, objet, temps restant'); slot('tip_commission', 550, 736, 240, 86); slot('tip_item', 800, 736, 300, 124); slot('tip_time', 550, 830, 240, 86);
label(10, 830, 'Bulle du marchand'); slot('merchant', 10, 844, 286, 44);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<layout name="states_economy" width="${W + 6}" height="${H + 160}" version="0.1">
  <window>
    <frame x="0" y="0" width="${W + 6}" height="${H + 160}" params="32769" style="103" name="states_economy" caption="États – Économie">
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
fs.writeFileSync(new URL('./states_economy.xml', import.meta.url), xml);
console.log('board written');
