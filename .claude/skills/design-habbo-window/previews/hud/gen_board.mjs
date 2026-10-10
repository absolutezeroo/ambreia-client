// Generates the two HUD boards ("États – HUD", "États – Combat"): labelled slots one fill script
// populates. Two boards because Glaze's canvas does not fit a 1600 px frame.
import fs from 'node:fs';

const W = 1270;
const board = (name, caption, H, draw) =>
{
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
    const h = {
        heading: (y, caption) => { text(10, y, 900, caption, {size: 12, bold: true, color: '0x24607f'}); parts.push(`\n        <container x="10" y="${y + 18}" width="${W - 20}" height="1" params="16" style="8" color="0xffd0d0c8" background="true"/>`); },
        label: (x, y, caption) => text(x, y, 300, caption, {size: 9, bold: true, color: '0x888888'}),
        slot: (name, x, y, w, hh) => parts.push(`\n        <container x="${x}" y="${y}" width="${w}" height="${hh}" params="16" style="3" name="${name}"><children/></container>`),
        note: (x, y, w, caption) => text(x, y, w, caption, {size: 9, color: '0x666666'}),
    };
    draw(h);
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<layout name="${name}" width="${W + 6}" height="${H + 40}" version="0.1">
  <window>
    <frame x="0" y="0" width="${W + 6}" height="${H + 40}" params="32769" style="3" name="${name}" caption="${caption}" color="0x418db0">
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
    fs.writeFileSync(new URL(`./${name}.xml`, import.meta.url), xml);
};

board('states_hud', 'États – HUD', 850, ({heading, label, slot, note}) =>
{
    heading(4, '1. Info joueur');
    label(10, 28, 'Panneau du joueur (normal)'); slot('player', 10, 42, 330, 96);
    label(350, 28, 'Effets et bouton +'); slot('buffs', 350, 42, 68, 102);
    label(430, 28, 'Bouton + : normal / appui (survol = éclairci)'); slot('plus_normal', 430, 42, 30, 30); slot('plus_pressed', 470, 42, 30, 30);
    label(430, 80, 'Menu ouvert depuis le +'); slot('plus_menu', 430, 94, 180, 110);
    label(630, 28, 'Infobulles PV, Mana, XP, icône latérale'); slot('tip_hp', 630, 42, 240, 86); slot('tip_mana', 880, 42, 240, 86); slot('tip_xp', 630, 136, 240, 86); slot('tip_side', 880, 136, 240, 86);

    heading(236, '2. Barre de sorts / actions');
    label(10, 260, 'Barre complète : menu, 1–6 sorts, 7–9 consommables, Q E R raccourcis, utilitaires'); slot('action_bar', 10, 274, 1134, 78);
    [['Vide', 'slot_empty'], ['Normal', 'slot_normal'], ['Survol (soulevé)', 'slot_hover'], ['Appui (assombri)', 'slot_pressed'], ['Recharge', 'slot_cooldown'], ['Indisponible', 'slot_unavailable'], ['Proc actif', 'slot_proc'], ['Sélectionné', 'slot_selected'], ['Consommable', 'slot_count']]
        .forEach(([l, n], i) => { label(10 + i * 96, 362, l); slot(n, 10 + i * 96, 376, 46, 62); });
    label(10, 446, 'Infobulle d’un sort'); slot('tip_skill', 10, 460, 300, 130);
    label(330, 446, 'Infobulle d’un consommable'); slot('tip_item', 330, 460, 300, 130);
    label(650, 446, 'Glisser-déposer'); note(650, 462, 400, 'Un sort traîné suit le curseur à 60 % d’opacité ; la case visée prend le contour bleu de sélection. À brancher dans HudView.');

    heading(606, '3. Menu HUD');
    note(10, 630, 900, 'La barre du haut a disparu : le menu vit dans la barre du bas, l’or et les gemmes dans la fenêtre Sac.');
    label(10, 698, 'Menu principal ouvert'); slot('main_menu', 10, 712, 180, 136);
    label(210, 698, 'Menu « plus » ouvert'); slot('more_menu', 210, 712, 180, 110);
    note(410, 712, 600, 'Survol d’un bouton de la barre : éclairci et ombré (brightness_and_shadow_under) ; appui : assombri. L’onglet actif porte une barre bleue sous son libellé.');
});

board('states_combat', 'États – Combat', 780, ({heading, label, slot}) =>
{
    heading(4, '4. Portraits du groupe');
    [['Normal', 'party_normal'], ['Survol (soulevé)', 'party_hover'], ['Sélectionné', 'party_selected'], ['Vie faible', 'party_low'], ['KO / mort', 'party_dead']]
        .forEach(([l, n], i) => { label(10 + i * 224, 28, l); slot(n, 10 + i * 224, 42, 214, 70); });
    label(1130, 28, 'Cible compacte'); slot('target_compact', 1130, 42, 104, 128);
    label(10, 120, 'Avec rôle'); slot('party_role', 10, 134, 214, 70);
    label(234, 120, 'Menu contextuel (clic droit)'); slot('party_menu', 234, 134, 180, 136);
    label(430, 120, 'Survol d’un joueur (chat)'); slot('tip_player', 430, 134, 200, 60);
    label(650, 120, 'Textes flottants'); slot('floating', 650, 134, 460, 40);

    heading(282, '5. Barre du boss et panneau de cible');
    label(10, 306, 'Boss (normal)'); slot('boss_normal', 10, 320, 470, 104);
    label(490, 306, 'Boss – lancement de compétence'); slot('boss_cast', 490, 320, 470, 104);
    label(970, 306, 'Survol d’un debuff'); slot('tip_debuff', 970, 320, 240, 86);
    label(10, 434, 'Cible étendue (détails complets)'); slot('target', 10, 448, 360, 214);
    label(390, 434, 'Effets : normal, durée, cumulé, expiration, désactivé'); ['buff_a', 'buff_b', 'buff_c', 'buff_d', 'buff_e'].forEach((n, i) => slot(n, 390 + i * 36, 448, 28, 28));
    label(390, 484, 'Avertissement'); slot('alert', 390, 498, 460, 40);
    label(390, 548, 'Chat et menu des canaux'); slot('chat', 390, 562, 500, 150); slot('chat_menu', 900, 562, 180, 136);
    label(1000, 434, 'Cible compacte sélectionnée'); slot('target_compact_selected', 1000, 448, 104, 128);
});
console.log('boards written');
