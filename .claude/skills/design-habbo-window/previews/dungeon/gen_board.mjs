// Generates the "États – Donjons et arène" board: labelled slots the fill script populates.
import fs from 'node:fs';

const W = 1270, H = 960;
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

heading(4, '1. Lignes de donjon, d’annonce et d’inscription (normal / survol / sélectionné)');
label(10, 28, 'Donjon'); slot('d_normal', 10, 42, 462, 62); slot('d_hover', 10, 108, 462, 62); slot('d_selected', 10, 174, 462, 62);
label(482, 28, 'Annonce de groupe'); slot('l_normal', 482, 42, 314, 74); slot('l_hover', 482, 120, 314, 74); slot('l_selected', 482, 198, 314, 74);
label(806, 28, 'Inscription : en attente / groupe trouvé / invitation reçue'); slot('r_wait', 806, 42, 462, 68); slot('r_found', 806, 114, 462, 68); slot('r_invite', 806, 186, 462, 68);
heading(282, '2. Rôles, difficultés, statuts, boutons');
label(10, 306, 'Rôles recherchés / manquants'); slot('roles', 10, 320, 340, 22); slot('roles_missing', 10, 348, 340, 22);
label(360, 306, 'Difficultés : normal / difficile / héroïque (sélection verte)'); button(360, 322, 104, 'Normal', '0x2f9e2f'); button(470, 322, 104, 'Difficile', '0x6a4c9c'); button(580, 322, 104, 'Héroïque', '0xd23a2a'); button(360, 356, 104, 'Normal', '0x9a9a9a'); button(470, 356, 104, 'Difficile', '0x9a9a9a'); button(580, 356, 104, 'Héroïque', '0x9a9a9a');
label(790, 306, 'Puces de statut d’inscription'); slot('status', 790, 320, 200, 170);
label(1000, 306, 'Rejoindre / Postuler / Créer / Quitter'); button(1000, 322, 260, 'Rejoindre la file d’attente', '0x2a6aa0'); button(1000, 356, 260, 'Postuler au groupe', '0x2a6aa0'); button(1000, 390, 260, 'Créer une annonce', '0x6a4c9c'); button(1000, 424, 260, 'Quitter la file', '0xd23a2a'); button(1000, 458, 260, 'Rejoindre la file d’attente', '0x9a9a9a');
label(10, 384, 'Composition : slots pleins / libres'); slot('composition', 10, 398, 324, 104);
label(360, 400, 'Menu de tri (ouvert)'); slot('menu_sort', 360, 414, 200, 140); label(570, 400, 'Modifier le rôle (ouvert)'); slot('menu_role', 570, 414, 200, 90);
heading(566, '3. Arène');
label(10, 590, 'Rang saisonnier'); slot('rank', 10, 604, 440, 110);
label(460, 590, 'Rôles : normal, sélectionné + infobulle'); slot('arena_roles', 460, 604, 250, 68); slot('tip_role', 720, 604, 260, 70);
label(990, 590, 'Lignes de classement : normale, survol, moi'); slot('rk_normal', 990, 604, 280, 28); slot('rk_hover', 990, 636, 280, 28); slot('rk_me', 990, 668, 280, 28);
label(10, 724, 'Matchmaking : recherche, adversaire trouvé, entrée en arène'); slot('searching', 10, 738, 240, 120); slot('found', 260, 738, 260, 130); slot('entering', 10, 868, 460, 48);
label(530, 724, 'Rechercher un adversaire : normal / survol / pressé'); button(530, 740, 200, 'Rechercher un adversaire', '0x2f9e2f'); button(740, 740, 200, 'Rechercher un adversaire', '0x3fbe3f'); button(950, 740, 200, 'Rechercher un adversaire', '0x1f7e1f');
label(530, 778, 'Infobulles : récompenses de saison, joueur'); slot('tip_rewards', 530, 792, 320, 120); slot('tip_player', 860, 792, 300, 96);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<layout name="states_dungeon" width="${W + 6}" height="${H + 60}" version="0.1">
  <window>
    <frame x="0" y="0" width="${W + 6}" height="${H + 60}" params="32769" style="103" name="states_dungeon" caption="États – Donjons et arène">
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
fs.writeFileSync(new URL('./states_dungeon.xml', import.meta.url), xml);
console.log('board written');
