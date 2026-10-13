// Writes the layouts of the "États de combat & HUD tactique" and "Donjons avancés & flux d'instance" sheets
// that the HUD does not have yet: cast bar states, buff tooltip, combat log, instance entry, group found,
// dungeon results, boss journal, weekly lock. The HUD panels keep the dark tinted style 9.
import {bmp, txt, btn, iconBtn, sep, box, cont, list, shape, bar, input, portrait, selectedOverlay, frame, layout, hud, write, locales, I, C} from '../../tools/ui_helpers.mjs';
const K = {
    fire: 'rpg/ui-icons/weather_wildfire_flame_element_hot_burn_icon', ice: 'rpg/ui-icons/rpg_spell_skill_magic_fireball_flame_bolt_icon', heal: 'rpg/ui-icons/software_signs_maths_plus_addition_bonus_add_new_icon', skull: 'rpg/ui-icons/rpg_skull_death_dead_small_icon',
    mana: 'rpg/ui-icons/rpg_gem_jewelcrafting_diamond_points_currency_icon', forbid: 'rpg/ui-icons/software_sign_crossout_cancel_forbidden_illegal_1_icon', x: I.x, check: I.check, hourglass: I.hourglass, swords: 'rpg/ui-icons/rpg_crossed_swords_duel_pvp_combat_battle_war_icon',
    trophy: 'rpg/ui-icons/sports_winner_award_cup_achievement_trophy_icon', chest: I.chest, star: I.star, coin: I.coin, clock: 'rpg/ui-icons/software_clock_time_wait_1_icon', boss: 'rpg/ui-icons/rpg_difficulty_5_brutal_monster_demon_boss_skull_shield_icon',
    shield: I.shield, group: I.group, lamp: I.lamp, banner: 'rpg/ui-icons/map_markers_banner_heraldry_icon', refresh: 'rpg/ui-icons/arrows_roundabout_rotation_circle_reload_refresh_loop_icon', gift: 'rpg/ui-icons/rpg_gift_present_icon',
};
const HUD = '0x4a4068';
const darkBar = (x, y, w, name, fillW, color, stroke, h = 14) => bar(x, y, w, name, fillW, color, {text: true, stroke, bg: '0x2a2438', bgStroke: '0xff6a6080', textColor: C.title, h});

// ---- cast bar: icon, kind label, skill name, bar + time; state icon on the right (check / forbid / x), hidden
write('vortex_hud_cast_xml', hud('vortex_hud_cast_xml', 400, 50, [
    box(6, 6, 38, 38, [bmp(11, 11, 16, 16, K.fire, {name: 'cast_icon', color: '0xe06020'})], {name: 'cast_icon_box', style: 3, color: '0x201e19', blend: '0.8'}),
    txt(52, 6, 220, 14, {name: 'cast_kind', caption: '${vortex.combat.cast.normal}', size: 10, bold: true, color: C.title}),
    txt(52, 22, 100, 14, {name: 'cast_name', size: 10, color: C.light}),
    darkBar(156, 24, 180, 'cast_bar', 110, '0x2a8fd6', '0xff1a5a90'),
    txt(340, 24, 54, 14, {name: 'cast_time', size: 10, bold: true, color: C.title, align: 'right'}),
    box(342, 8, 50, 14, [txt(0, 1, 50, 12, {name: 'cast_state_txt', size: 8, bold: true, color: C.title, align: 'center'})], {name: 'cast_state', style: 6, color: '0xb02818', hidden: true}),
]));
// buff tooltip: icon, name, kind, stacks, description, remaining, source
write('vortex_hud_buff_tip_xml', layout('vortex_hud_buff_tip_xml', 300, 130, cont(0, 0, 300, 130, [box(0, 0, 300, 130, [
    box(6, 6, 36, 36, [bmp(10, 10, 16, 16, K.skull, {name: 'tip_icon', color: '0x4cc040'})], {name: 'tip_icon_box', style: 3, color: '0x201e19', blend: '0.8'}),
    txt(50, 7, 170, 16, {name: 'tip_title', size: 11, bold: true, color: C.title}),
    txt(50, 24, 120, 14, {name: 'tip_kind', size: 9, color: '0xff8a6a'}),
    txt(200, 24, 94, 14, {name: 'tip_stacks', size: 9, color: C.light, align: 'right'}),
    txt(6, 48, 288, 30, {name: 'tip_txt', size: 10, color: C.light, multi: true}),
    txt(6, 84, 288, 14, {name: 'tip_remaining', size: 10, bold: true, color: C.title}),
    txt(6, 102, 288, 14, {name: 'tip_source', size: 9, color: C.light}),
], {name: 'tip_frame', style: 9, color: '0x686661'})], {name: 'hud_buff_tip', params: 1073741840})));
// combat log: filter tabs + lines
write('vortex_hud_combat_log_xml', hud('vortex_hud_combat_log_xml', 560, 230, [
    cont(8, 6, 544, 24, [], {name: 'filter_bar'}),
    box(8, 36, 544, 186, [list(6, 6, 532, 174, 'log_list', 2, {scroll: true})], {name: 'log_well', style: 3, color: '0x201e19', blend: '0.8'}),
]));
write('vortex_hud_combat_log_line_xml', layout('vortex_hud_combat_log_line_xml', 532, 16, cont(0, 0, 532, 16, [
    txt(0, 0, 58, 16, {name: 'time_txt', size: 9, color: '0xa8a2b8'}),
    bmp(60, 0, 16, 16, K.fire, {name: 'line_icon', color: '0xe06020'}),
    txt(80, 0, 452, 16, {name: 'line_txt', size: 10, color: C.light}),
], {name: 'log_line', params: 144})));
// the filter chip of the log / the difficulty tab of the instance popup
write('vortex_hud_chip_xml', layout('vortex_hud_chip_xml', 90, 24, box(0, 0, 90, 24, [txt(0, 4, 90, 16, {name: 'chip_txt', size: 10, bold: true, color: C.title, align: 'center'})], {name: 'chip', style: 6, color: '0x3a3254', params: 17, dyn: 'button'})));

// ---- instance entry popup (frame): illustration, name, desc, info rows, difficulty cards, rewards, Enter / Cancel
const diffCard = (y, name, w = 120, h = 50) => box(0, y, w, h, [
    selectedOverlay(w, h),
    bmp(8, h < 50 ? 9 : 8, 16, 16, K.skull, {name: 'diff_icon', color: '0x6a6a72'}),
    txt(30, h < 50 ? 9 : 6, w - 34, 16, {name: 'diff_name', size: 10, bold: true}),
    h < 50 ? txt(w - 112, 10, 80, 14, {name: 'diff_level', size: 9, color: C.sub, align: 'right'}) : txt(30, 24, w - 34, 14, {name: 'diff_level', size: 9, color: C.sub}),
    bmp(w - 22, (h - 16) >> 1, 16, 16, I.lock, {name: 'diff_lock', color: '0x8a94a0', hidden: true}),
], {name, params: 17, dyn: 'button'});
write('vortex_instance_entry_xml', frame('vortex_instance_entry_xml', 460, 420, '${vortex.instance.entry}', [
    box(8, 4, 160, 110, [bmp(0, 0, 160, 110, 'arena_12_preview', {name: 'thumb', tags: false, stretch: true})], {name: 'thumb_box', style: 102}),
    bmp(176, 6, 16, 16, K.swords, {color: '0xffd890'}), txt(198, 4, 254, 18, {name: 'dungeon_name', size: 13, bold: true, color: C.title}),
    txt(176, 26, 276, 44, {name: 'dungeon_desc', size: 10, color: C.light, multi: true}),
    box(8, 122, 160, 92, [
        box(6, 6, 22, 18, [txt(0, 2, 22, 14, {name: 'level_badge_txt', size: 9, bold: true, color: C.title, align: 'center'})], {name: 'level_badge', style: 6, color: '0x2a6aa0'}), txt(34, 8, 120, 14, {caption: '${vortex.instance.required_level}', size: 9, color: C.sub}),
        bmp(8, 34, 16, 16, K.group, {color: '0x6a6a72'}), txt(34, 30, 120, 24, {name: 'group_size', size: 9, color: C.sub, multi: true}),
        bmp(8, 62, 16, 16, K.boss, {color: '0x6a6a72'}), txt(34, 58, 120, 24, {name: 'kind_txt', size: 9, color: C.sub, multi: true}),
    ], {style: 103, name: 'info_box'}),
    txt(176, 78, 276, 14, {caption: '${vortex.ui.difficulty}', size: 10, bold: true, color: C.title}),
    cont(176, 96, 276, 110, [0, 1, 2].map((i) => diffCard(i * 38, `difficulty_${i}`, 276, 34)), {name: 'difficulties'}),
    txt(8, 224, 440, 14, {caption: '${vortex.ui.rewards.possible}', size: 10, bold: true, color: C.title}),
    list(8, 242, 444, 70, 'reward_list', 10, {horizontal: true}),
    btn(8, 326, 216, 'enter_button', '${vortex.instance.enter}', {style: 301, color: '0x2f9e2f', h: 34}),
    btn(232, 326, 220, 'cancel_button', '${vortex.ui.cancel}', {style: 301, color: '0xd23a2a', h: 34}),
]));
write('vortex_instance_reward_tile_xml', layout('vortex_instance_reward_tile_xml', 80, 70, cont(0, 0, 80, 70, [
    box(16, 0, 48, 48, [bmp(8, 8, 32, 32, '', {name: 'reward_icon', tags: false}), txt(0, 32, 44, 14, {name: 'reward_count', size: 9, bold: true, color: C.title, align: 'right', hidden: true})], {name: 'reward_box'}),
    txt(0, 52, 80, 14, {name: 'reward_label', size: 9, color: C.light, align: 'center'}),
], {name: 'reward_tile'})));
// group found (matchmaking): countdown ring, member portraits with role, accept / refuse
write('vortex_instance_found_member_xml', layout('vortex_instance_found_member_xml', 84, 110, cont(0, 0, 84, 110, [
    portrait(10, 0, 64, 'head_image'),
    bmp(34, 66, 16, 16, K.shield, {name: 'role_icon', color: '0x4090e0'}),
    txt(0, 84, 84, 12, {name: 'role_txt', size: 9, bold: true, align: 'center'}),
    txt(0, 97, 84, 12, {name: 'level_txt', size: 9, color: C.sub, align: 'center'}),
], {name: 'found_member'})));
write('vortex_instance_found_xml', frame('vortex_instance_found_xml', 480, 260, '${vortex.instance.found_title}', [
    bmp(12, 8, 32, 32, K.lamp, {color: '0xffd040', zoom: 2}),
    txt(52, 4, 320, 18, {name: 'found_title', caption: '${vortex.instance.found}', size: 13, bold: true, color: '0xffd040'}),
    txt(52, 24, 320, 30, {name: 'found_desc', size: 10, color: C.light, multi: true}),
    shape(412, 4, 50, 50, '0x2a2438', {name: 'countdown_ring', radius: 25, stroke: '0xffffd040'}),
    txt(412, 16, 50, 28, {name: 'countdown_txt', size: 20, bold: true, color: '0xffd040', align: 'center'}),
    box(8, 62, 464, 126, [list(8, 8, 448, 110, 'member_list', 6, {horizontal: true})], {style: 103, name: 'members_box'}),
    btn(8, 196, 226, 'accept_button', '${vortex.ui.accept}', {style: 301, color: '0x2f9e2f', h: 34}),
    btn(246, 196, 226, 'refuse_button', '${vortex.ui.refuse}', {style: 301, color: '0xd23a2a', h: 34}),
]));
// dungeon results: title, thumb, stat rows, rewards, reputation
write('vortex_instance_results_xml', frame('vortex_instance_results_xml', 440, 404, '${vortex.instance.results}', [
    bmp(10, 6, 32, 32, K.trophy, {color: '0xffd040', zoom: 2}),
    txt(50, 4, 380, 20, {name: 'results_title', caption: '${vortex.instance.completed}', size: 15, bold: true, color: '0xffd040'}),
    txt(50, 26, 380, 14, {name: 'results_sub', size: 10, color: C.light}),
    box(8, 48, 160, 110, [bmp(0, 0, 160, 110, 'arena_10_preview', {name: 'thumb', tags: false, stretch: true})], {name: 'thumb_box', style: 102}),
    box(176, 48, 256, 134, [list(6, 6, 244, 122, 'stat_list', 2)], {style: 103, name: 'stats_box'}),
    box(8, 190, 270, 94, [txt(8, 6, 254, 14, {caption: '${vortex.ui.rewards}', size: 10, bold: true, color: C.panelTitle}), list(8, 26, 254, 60, 'reward_list', 4, {horizontal: true})], {style: 103, name: 'rewards_box'}),
    box(286, 190, 146, 94, [txt(8, 6, 130, 14, {caption: '${vortex.reward.reputation_title}', size: 10, bold: true, color: C.panelTitle}), list(8, 26, 130, 60, 'reputation_list', 4)], {style: 103, name: 'reputation_box'}),
    btn(8, 294, 424, 'continue_button', '${vortex.ui.continue}', {style: 301, color: '0x2f9e2f', h: 34}),
]));
// boss journal: tabs (chips), boss list, boss detail (portrait, name, title, lore, mechanics, loot), instance info
write('vortex_instance_journal_boss_row_xml', layout('vortex_instance_journal_boss_row_xml', 110, 96, box(0, 0, 110, 96, [
    selectedOverlay(110, 96),
    portrait(23, 6, 64, 'head_image'),
    txt(4, 74, 102, 20, {name: 'boss_name', size: 9, bold: true, align: 'center', multi: true}),
], {name: 'boss_row', params: 17, dyn: 'lifted_hover'})));
write('vortex_instance_mechanic_row_xml', layout('vortex_instance_mechanic_row_xml', 250, 20, cont(0, 0, 250, 20, [
    bmp(2, 2, 16, 16, K.fire, {name: 'mech_icon', color: '0x8a3ad0'}),
    txt(24, 2, 226, 16, {name: 'mech_txt', size: 9}),
], {name: 'mechanic_row', params: 144})));
write('vortex_instance_journal_xml', frame('vortex_instance_journal_xml', 540, 400, '${vortex.instance.journal}', [
    cont(8, 2, 400, 24, [], {name: 'tab_bar'}),
    box(8, 32, 120, 328, [list(5, 5, 110, 318, 'boss_list', 4, {scroll: true})], {style: 102, name: 'bosses'}),
    box(136, 32, 266, 328, [
        portrait(8, 8, 56, 'head_image'),
        txt(72, 10, 186, 16, {name: 'boss_name', size: 12, bold: true}), txt(72, 28, 186, 14, {name: 'boss_title', size: 9, color: C.sub}),
        txt(8, 70, 250, 44, {name: 'boss_lore', size: 9, color: C.sub, multi: true}),
        txt(8, 118, 250, 14, {caption: '${vortex.instance.mechanics}', size: 10, bold: true, color: C.panelTitle}),
        list(8, 136, 250, 86, 'mechanic_list', 2),
        txt(8, 228, 250, 14, {caption: '${vortex.instance.known_loot}', size: 10, bold: true, color: C.panelTitle}),
        list(8, 246, 250, 56, 'loot_list', 4, {horizontal: true}),
    ], {style: 103, name: 'boss_detail'}),
    box(410, 32, 122, 328, [
        txt(8, 6, 106, 14, {caption: '${vortex.instance.info}', size: 10, bold: true, color: C.panelTitle}),
        list(6, 26, 110, 100, 'info_list', 2),
        txt(8, 134, 106, 14, {caption: '${vortex.ui.rewards}', size: 10, bold: true, color: C.panelTitle}),
        box(8, 152, 106, 60, [bmp(8, 8, 16, 16, K.chest, {color: '0xb08050', zoom: 2}), txt(46, 8, 56, 44, {name: 'lock_txt', size: 9, color: C.sub, multi: true})], {name: 'lock_box'}),
    ], {style: 103, name: 'instance_info'}),
]));
// weekly lock (small HUD-ish card)
write('vortex_instance_weekly_xml', frame('vortex_instance_weekly_xml', 300, 160, '${vortex.instance.weekly_lock}', [
    box(8, 4, 100, 100, [bmp(26, 26, 32, 32, K.chest, {name: 'chest_icon', color: '0xb08050', zoom: 1.5})], {name: 'chest_box', style: 102}),
    txt(116, 6, 176, 14, {caption: '${vortex.instance.weekly_title}', size: 10, bold: true, color: '0xffd890'}),
    txt(116, 22, 176, 44, {name: 'weekly_desc', size: 9, color: C.light, multi: true}),
    bmp(116, 68, 16, 16, K.clock, {color: '0xffd040'}), txt(136, 68, 156, 14, {name: 'reset_txt', size: 9, color: C.light}),
    btn(116, 88, 176, 'open_button', '${vortex.instance.open_chest}', {style: 301, color: '0x2f9e2f'}),
]));
// boss skill tooltip
write('vortex_instance_skill_tip_xml', layout('vortex_instance_skill_tip_xml', 300, 120, cont(0, 0, 300, 120, [box(0, 0, 300, 120, [
    box(6, 6, 44, 44, [bmp(14, 14, 16, 16, K.fire, {name: 'tip_icon', color: '0x8a3ad0'})], {name: 'tip_icon_box', style: 3, color: '0x201e19', blend: '0.8'}),
    txt(58, 7, 236, 16, {name: 'tip_title', size: 11, bold: true, color: C.title}),
    txt(58, 25, 236, 14, {name: 'tip_kind', caption: '${vortex.instance.boss_skill}', size: 9, color: C.light}),
    txt(6, 56, 288, 28, {name: 'tip_txt', size: 9, color: C.light, multi: true}),
    bmp(6, 86, 16, 16, I.warn, {color: '0xff6a6a'}), txt(26, 87, 268, 14, {name: 'tip_warning', size: 9, bold: true, color: '0xff8a6a'}),
    txt(6, 102, 288, 14, {name: 'tip_cooldown', size: 9, color: C.light}),
], {name: 'tip_frame', style: 9, color: '0x686661'})], {name: 'instance_skill_tip', params: 1073741840})));
locales('combat', {
    'vortex.combat.cast.normal': 'Incantation normale', 'vortex.combat.cast.channel': 'Canalisation', 'vortex.combat.cast.interrupted': 'Interrompue', 'vortex.combat.cast.out_of_range': 'Hors de portée', 'vortex.combat.cast.no_mana': 'Pas assez de mana',
    'vortex.combat.log': 'Journal de combat', 'vortex.combat.log.all': 'Tous', 'vortex.combat.log.damage': 'Dégâts', 'vortex.combat.log.heals': 'Soins', 'vortex.combat.log.system': 'Système', 'vortex.combat.log.loot': 'Butin',
    'vortex.combat.buff.debuff': 'Debuff', 'vortex.combat.buff.buff': 'Buff', 'vortex.combat.buff.stacks': '%count% cumuls', 'vortex.combat.buff.remaining': 'Durée restante : %time%', 'vortex.combat.buff.source': 'Origine : %name%',
    'vortex.combat.banner.no_mana': 'Pas assez de mana', 'vortex.combat.banner.out_of_range': 'Hors de portée', 'vortex.combat.banner.cooldown': 'Compétence en recharge', 'vortex.combat.banner.interrupt_ok': 'Interruption réussie !',
    'vortex.combat.text.blocked': 'BLOQUÉ', 'vortex.combat.text.dodged': 'ESQUIVÉ', 'vortex.combat.text.resisted': 'RÉSISTÉ', 'vortex.combat.target_of_target': 'Cible de la cible', 'vortex.combat.aggro': 'Aggré par la cible', 'vortex.combat.elite': 'Élite',
    'vortex.combat.filter.all': 'Tous', 'vortex.combat.filter.buffs': 'Buffs', 'vortex.combat.filter.debuffs': 'Debuffs', 'vortex.combat.filter.control': 'Contrôle', 'vortex.combat.filter.resources': 'Ressources', 'vortex.combat.filter.food': 'Nourriture',
}, {
    'vortex.combat.cast.normal': 'Normal cast', 'vortex.combat.cast.channel': 'Channeling', 'vortex.combat.cast.interrupted': 'Interrupted', 'vortex.combat.cast.out_of_range': 'Out of range', 'vortex.combat.cast.no_mana': 'Not enough mana',
    'vortex.combat.log': 'Combat log', 'vortex.combat.log.all': 'All', 'vortex.combat.log.damage': 'Damage', 'vortex.combat.log.heals': 'Heals', 'vortex.combat.log.system': 'System', 'vortex.combat.log.loot': 'Loot',
    'vortex.combat.buff.debuff': 'Debuff', 'vortex.combat.buff.buff': 'Buff', 'vortex.combat.buff.stacks': '%count% stacks', 'vortex.combat.buff.remaining': 'Remaining: %time%', 'vortex.combat.buff.source': 'Source: %name%',
    'vortex.combat.banner.no_mana': 'Not enough mana', 'vortex.combat.banner.out_of_range': 'Out of range', 'vortex.combat.banner.cooldown': 'Skill on cooldown', 'vortex.combat.banner.interrupt_ok': 'Interrupt succeeded!',
    'vortex.combat.text.blocked': 'BLOCKED', 'vortex.combat.text.dodged': 'DODGED', 'vortex.combat.text.resisted': 'RESISTED', 'vortex.combat.target_of_target': 'Target of target', 'vortex.combat.aggro': 'Aggro on you', 'vortex.combat.elite': 'Elite',
    'vortex.combat.filter.all': 'All', 'vortex.combat.filter.buffs': 'Buffs', 'vortex.combat.filter.debuffs': 'Debuffs', 'vortex.combat.filter.control': 'Control', 'vortex.combat.filter.resources': 'Resources', 'vortex.combat.filter.food': 'Food',
});
locales('dungeon', {
    'vortex.instance.entry': 'Entrée en donjon', 'vortex.instance.required_level': 'Niveau requis', 'vortex.instance.group_size': 'Taille du groupe : %count% joueurs', 'vortex.instance.kind.advanced': 'Type : Donjon avancé', 'vortex.instance.enter': 'Entrer',
    'vortex.instance.difficulty.normal': 'Normal', 'vortex.instance.difficulty.heroic': 'Héroïque', 'vortex.instance.difficulty.mythic': 'Mythique', 'vortex.instance.difficulty.level': '(Niv. %level%)',
    'vortex.instance.found_title': 'Groupe trouvé', 'vortex.instance.found': 'Groupe trouvé !', 'vortex.instance.found_desc': 'Un groupe a été formé pour : %dungeon% (%difficulty%)',
    'vortex.instance.results': 'Résultats du donjon', 'vortex.instance.completed': 'Donjon terminé !', 'vortex.instance.time': 'Temps de completion', 'vortex.instance.deaths': 'Morts du groupe', 'vortex.instance.score': 'Score', 'vortex.instance.xp': 'EXP obtenue', 'vortex.instance.gold': 'Or obtenu',
    'vortex.instance.journal': 'Journal de boss', 'vortex.instance.tab.overview': 'Aperçu', 'vortex.instance.tab.boss': 'Boss', 'vortex.instance.tab.loot': 'Butin', 'vortex.instance.tab.strategy': 'Stratégie', 'vortex.instance.mechanics': 'Mécaniques principales', 'vortex.instance.known_loot': 'Butin connu', 'vortex.instance.info': 'Infos d’instance',
    'vortex.instance.reset': 'Réinitialisation : %days% jours', 'vortex.instance.lock_once': '1 fois par semaine (Mode %difficulty%)', 'vortex.instance.boss_skill': 'Capacité du boss', 'vortex.instance.stay_away': 'S’éloigner des autres joueurs.', 'vortex.instance.recharge': 'Rechargement : %time%',
    'vortex.instance.weekly_lock': 'Verrou hebdomadaire', 'vortex.instance.weekly_title': 'Coffre hebdomadaire', 'vortex.instance.weekly_desc': 'Vous avez terminé cette instance cette semaine. Ouvrez votre coffre pour récupérer vos récompenses.', 'vortex.instance.reset_in': 'Réinitialisation dans : %time%', 'vortex.instance.open_chest': 'Ouvrir le coffre',
    'vortex.instance.reset_confirm': 'Voulez-vous réinitialiser l’instance ? Cette action vous téléportera à l’entrée et mettra fin à votre progression actuelle.',
}, {
    'vortex.instance.entry': 'Dungeon entrance', 'vortex.instance.required_level': 'Required level', 'vortex.instance.group_size': 'Group size: %count% players', 'vortex.instance.kind.advanced': 'Type: Advanced dungeon', 'vortex.instance.enter': 'Enter',
    'vortex.instance.difficulty.normal': 'Normal', 'vortex.instance.difficulty.heroic': 'Heroic', 'vortex.instance.difficulty.mythic': 'Mythic', 'vortex.instance.difficulty.level': '(Lvl %level%)',
    'vortex.instance.found_title': 'Group found', 'vortex.instance.found': 'Group found!', 'vortex.instance.found_desc': 'A group was formed for: %dungeon% (%difficulty%)',
    'vortex.instance.results': 'Dungeon results', 'vortex.instance.completed': 'Dungeon completed!', 'vortex.instance.time': 'Completion time', 'vortex.instance.deaths': 'Group deaths', 'vortex.instance.score': 'Score', 'vortex.instance.xp': 'XP gained', 'vortex.instance.gold': 'Gold gained',
    'vortex.instance.journal': 'Boss journal', 'vortex.instance.tab.overview': 'Overview', 'vortex.instance.tab.boss': 'Boss', 'vortex.instance.tab.loot': 'Loot', 'vortex.instance.tab.strategy': 'Strategy', 'vortex.instance.mechanics': 'Main mechanics', 'vortex.instance.known_loot': 'Known loot', 'vortex.instance.info': 'Instance info',
    'vortex.instance.reset': 'Reset: %days% days', 'vortex.instance.lock_once': 'Once a week (%difficulty% mode)', 'vortex.instance.boss_skill': 'Boss ability', 'vortex.instance.stay_away': 'Stay away from other players.', 'vortex.instance.recharge': 'Recharge: %time%',
    'vortex.instance.weekly_lock': 'Weekly lock', 'vortex.instance.weekly_title': 'Weekly chest', 'vortex.instance.weekly_desc': 'You finished this instance this week. Open your chest to collect your rewards.', 'vortex.instance.reset_in': 'Reset in: %time%', 'vortex.instance.open_chest': 'Open the chest',
    'vortex.instance.reset_confirm': 'Reset the instance? This teleports you to the entrance and ends your current progress.',
});
locales('progression', {'vortex.reward.reputation_title': 'Réputation'}, {'vortex.reward.reputation_title': 'Reputation'});
console.log('combat + instance layouts written');
