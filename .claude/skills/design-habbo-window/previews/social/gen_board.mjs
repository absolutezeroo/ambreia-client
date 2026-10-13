// Generates the "États – Social" board: labelled slots the fill script populates.
import fs from 'node:fs';

const W = 1270, H = 760;
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

heading(4, '1. Lignes : ami, demande, bloqué, membre de groupe, membre de guilde (normal / survol / sélectionné)');
label(10, 28, 'Ami'); slot('friend_normal', 10, 42, 330, 46); slot('friend_hover', 10, 92, 330, 46); slot('friend_selected', 10, 142, 330, 46);
label(350, 28, 'Demande reçue / envoyée'); slot('request', 350, 42, 330, 50); slot('sent', 350, 96, 330, 44);
label(350, 148, 'Bloqué'); slot('blocked', 350, 162, 330, 52);
label(690, 28, 'Membre de groupe : prêt / en attente / sélectionné'); slot('member_ready', 690, 42, 330, 54); slot('member_wait', 690, 100, 330, 54); slot('member_selected', 690, 158, 330, 54);
label(10, 196, 'Membre de guilde : normal / sélectionné'); slot('gmember', 10, 210, 560, 32); slot('gmember_selected', 10, 246, 560, 32);
label(690, 220, 'Notification sociale (demande d’ami)'); slot('notification', 690, 234, 320, 50);
heading(292, '2. Panneaux et popups');
label(10, 316, 'Profil contextuel d’un ami'); slot('profile_card', 10, 330, 320, 420);
label(340, 316, 'Vérification de préparation'); slot('ready', 340, 330, 350, 330);
label(700, 316, 'Invitation / recrutement (onglet)'); slot('invite', 700, 330, 374, 420);
heading(814, '3. Menus, confirmation, badge, infobulle');
label(10, 838, 'Menu contextuel (3 points)'); slot('menu', 10, 852, 200, 160);
label(220, 838, 'Filtre (ouvert)'); slot('filter', 220, 852, 200, 180);
label(430, 838, 'Confirmation'); slot('confirm', 430, 852, 320, 140);
label(760, 838, 'Badge'); slot('badge_button', 760, 852, 36, 36); slot('badge', 788, 846, 18, 18);
label(820, 838, 'Infobulle'); slot('tip', 820, 852, 240, 86);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<layout name="states_social" width="${W + 6}" height="${H + 302}" version="0.1">
  <window>
    <frame x="0" y="0" width="${W + 6}" height="${H + 302}" params="32769" style="103" name="states_social" caption="États – Social">
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
fs.writeFileSync(new URL('./states_social.xml', import.meta.url), xml);
console.log('board written');
