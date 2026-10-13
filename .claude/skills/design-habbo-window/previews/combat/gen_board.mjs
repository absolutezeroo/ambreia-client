// Generates the "États – Combat tactique" and "États – Instances" boards (`node gen_board.mjs combat|instances`):
// labelled slots the shared fill script populates. Two boards: Glaze cannot shoot a frame taller than ~1500 px.
import fs from 'node:fs';

const BOARD = process.argv[2] || 'combat';
const W = 1270;
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

let H;
if(BOARD === 'combat')
{
    heading(4, '1. HUD joueur, cible, cible de la cible, barres d’incantation');
    label(10, 28, 'HUD joueur avec buffs'); slot('player', 10, 42, 330, 96); slot('buffs', 350, 42, 150, 34);
    label(10, 148, 'Cible et sa cible'); slot('target', 10, 162, 360, 214); slot('target_of_target', 380, 162, 104, 128);
    label(510, 28, 'Barres d’incantation : normale, canalisation, interrompue, hors de portée, pas de mana'); ['cast_normal', 'cast_channel', 'cast_interrupted', 'cast_range', 'cast_mana'].forEach((n, i) => slot(n, 510, 42 + i * 56, 400, 50));
    label(920, 28, 'Buffs / debuffs : normal, expiration, cumuls, contrôle'); slot('buff_row', 920, 42, 340, 34);
    label(920, 86, 'Infobulle de buff'); slot('tip_buff', 920, 100, 300, 130);
    label(920, 240, 'Bannières d’avertissement'); ['banner_mana', 'banner_range', 'banner_cd', 'banner_ok'].forEach((n, i) => slot(n, 920, 254 + i * 34, 340, 30));
    heading(392, '2. Journal de combat, textes flottants, boutons');
    label(10, 416, 'Journal de combat (filtres)'); slot('log', 10, 430, 560, 230);
    label(580, 416, 'Textes flottants : dégâts, critique, soin, bloqué, esquivé, résisté'); ['ft_dmg', 'ft_crit', 'ft_heal', 'ft_block', 'ft_dodge', 'ft_resist'].forEach((n, i) => slot(n, 580 + (i % 3) * 110, 430 + Math.floor(i / 3) * 40, 100, 30));
    label(580, 516, 'Infobulle de compétence (boule de feu)'); slot('tip_skill', 580, 530, 300, 130);
    label(900, 416, 'Cases d’action : normal, survol, pressé, sélectionné, désactivé'); ['s_normal', 's_hover', 's_pressed', 's_selected', 's_disabled'].forEach((n, i) => slot(n, 900 + i * 54, 430, 46, 62));
    label(900, 500, 'Filtres : tous, buffs, debuffs, contrôle'); slot('filters', 900, 514, 360, 24);
    H = 720;
}
else
{
    heading(4, '1. Entrée, groupe trouvé, verrou, infobulle, confirmation');
    label(10, 28, 'Entrée en donjon'); slot('entry', 10, 42, 460, 420);
    label(480, 28, 'Groupe trouvé'); slot('found', 480, 42, 480, 260);
    label(970, 28, 'Verrou hebdomadaire'); slot('weekly', 970, 42, 300, 160);
    label(970, 212, 'Infobulle de capacité de boss'); slot('tip_boss', 970, 226, 300, 120);
    label(480, 312, 'Confirmation'); slot('confirm', 480, 326, 320, 140);
    label(840, 380, 'Onglets de difficulté : défaut, survol, sélectionné'); slot('diff_tabs', 840, 394, 330, 50);
    heading(474, '2. Journal de boss, résultats, vérification de préparation');
    label(10, 498, 'Journal de boss'); slot('journal', 10, 512, 540, 400);
    label(560, 498, 'Résultats du donjon'); slot('results', 560, 512, 440, 404);
    label(10, 926, 'Vérification de préparation (groupe)'); slot('ready', 10, 940, 350, 330);
    H = 1316;
}
const name = BOARD === 'combat' ? 'states_combat2' : 'states_instances';
const caption = BOARD === 'combat' ? 'États – Combat tactique' : 'États – Instances';
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<layout name="${name}" width="${W + 6}" height="${H}" version="0.1">
  <window>
    <frame x="0" y="0" width="${W + 6}" height="${H}" params="32769" style="103" name="${name}" caption="${caption}">
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
console.log('board written', name);
