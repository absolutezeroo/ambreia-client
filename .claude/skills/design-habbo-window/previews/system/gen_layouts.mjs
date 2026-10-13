// Writes the layouts of the "Calendrier, événements & récompenses" and "Paramètres, raccourcis & accessibilité"
// sheets: reward calendar, events, world boss, missions, reward popup, wallet; main menu, settings window with
// its panels, keybinds. Texts go to calendar.json and settings.json.
import {slider, bmp, txt, btn, iconBtn, sep, box, cont, list, shape, bar, input, portrait, selectedOverlay, frame, layout, hud, write, locales, I, C} from '../../tools/ui_helpers.mjs';
const S = {
    calendar: 'rpg/ui-icons/software_calendar_dates_organizer_month_1_icon', gift: 'rpg/ui-icons/rpg_gift_present_icon', chest: I.chest, coin: I.coin, gem: 'rpg/ui-icons/rpg_gem_jewelcrafting_diamond_points_currency_icon',
    clock: 'rpg/ui-icons/software_clock_time_wait_1_icon', swords: 'rpg/ui-icons/rpg_crossed_swords_duel_pvp_combat_battle_war_icon', banner: 'rpg/ui-icons/map_markers_banner_heraldry_icon', boss: 'rpg/ui-icons/rpg_difficulty_5_brutal_monster_demon_boss_skull_shield_icon',
    refresh: 'rpg/ui-icons/arrows_roundabout_rotation_circle_reload_refresh_loop_icon', group: I.group, info: I.info, lock: I.lock, check: I.check, star: I.star, right: I.right,
    volume: 'rpg/ui-icons/media_audio_sound_volume_3_icon', monitor: 'rpg/ui-icons/software_hardware_monitor_display_pc_computer_icon', bell: 'rpg/ui-icons/travel_bell_notification_ringing_icon', access: 'rpg/ui-icons/travel_person_wheelchair_accessiblity_special_wc_toilet_icon',
    chat: 'rpg/ui-icons/software_speech_bubble_three_dots_dialogue_icon', keyboard: 'rpg/ui-icons/software_hardware_keyboard_button_key_input_icon', gear: 'rpg/ui-icons/software_options_settings_cogwheel_gear_mechanics_icon', play: 'rpg/ui-icons/arrows_media_controls_play_triangle_icon',
    profile: 'rpg/ui-icons/travel_person_people_two_icon', book: I.book, power: 'rpg/ui-icons/arrows_power_button_switch_turn_on_off_icon', x: I.x, lamp: I.lamp, pencil: I.pencil, sliders: 'rpg/ui-icons/software_options_settings_sliders_knobs_audio_icon',
};


// ---------- calendar window: tabs rewards / events / missions / wallet
write('vortex_calendar_day_xml', layout('vortex_calendar_day_xml', 88, 110, box(0, 0, 88, 110, [
    selectedOverlay(88, 110),
    txt(0, 6, 88, 14, {name: 'day_txt', size: 10, bold: true, align: 'center'}),
    box(22, 24, 44, 44, [bmp(6, 6, 32, 32, '', {name: 'reward_icon', tags: false, zoom: 2})], {name: 'reward_box'}),
    txt(0, 70, 88, 14, {name: 'count_txt', size: 9, bold: true, align: 'center'}),
    bmp(36, 82, 16, 16, I.check, {name: 'state_icon', color: '0x40b030'}),
    txt(0, 96, 88, 12, {name: 'state_txt', size: 8, color: C.sub, align: 'center'}),
], {name: 'calendar_day', params: 17, dyn: 'lifted_hover'})));
write('vortex_calendar_tab_rewards_xml', layout('vortex_calendar_tab_rewards_xml', 700, 420, cont(0, 0, 700, 420, [
    cont(8, 0, 684, 24, [box(0, 0, 220, 24, [txt(0, 4, 220, 16, {name: 'daily_tab_txt', caption: '${vortex.calendar.daily}', size: 10, bold: true, color: C.title, align: 'center'})], {name: 'daily_tab', style: 6, color: '0x2a6aa0', params: 17, dyn: 'button'}), box(228, 0, 220, 24, [txt(0, 4, 220, 16, {name: 'weekly_tab_txt', caption: '${vortex.calendar.weekly}', size: 10, bold: true, color: C.title, align: 'center'})], {name: 'weekly_tab', style: 6, color: '0x3a3254', params: 17, dyn: 'button'})], {name: 'period_tabs'}),
    box(8, 32, 684, 130, [list(8, 8, 668, 114, 'day_list', 8, {horizontal: true})], {style: 102, name: 'days'}),
    box(8, 170, 684, 80, [
        box(8, 8, 64, 64, [bmp(16, 12, 32, 32, '', {name: 'detail_icon', tags: false, zoom: 2}), txt(4, 48, 56, 14, {name: 'detail_count', size: 9, bold: true, align: 'right'})], {name: 'detail_box'}),
        txt(80, 10, 300, 16, {name: 'detail_day', size: 11, bold: true}),
        txt(80, 28, 300, 16, {name: 'detail_name', size: 11, bold: true}),
        txt(80, 46, 300, 28, {name: 'detail_desc', size: 10, color: C.sub, multi: true}),
        btn(420, 24, 256, 'claim_button', '${vortex.calendar.claim}', {style: 301, color: '0x2f9e2f', h: 32}),
    ], {style: 103, name: 'detail'}),
    box(8, 258, 684, 150, [
        bmp(8, 8, 16, 16, S.boss, {color: '0xd23a2a'}), txt(30, 6, 400, 16, {name: 'boss_name', size: 11, bold: true}), txt(30, 22, 400, 14, {name: 'boss_sub', size: 9, color: C.sub}),
        bmp(8, 42, 16, 16, S.clock, {color: '0xd8a030'}), txt(30, 42, 200, 14, {name: 'boss_timer', size: 10, bold: true, color: C.red}),
        bmp(260, 42, 16, 16, S.group, {color: '0x6a6a72'}), txt(282, 42, 200, 14, {name: 'boss_players', size: 10}),
        txt(8, 64, 300, 14, {caption: '${vortex.calendar.participation}', size: 10, bold: true, color: C.panelTitle}), txt(400, 64, 268, 14, {name: 'boss_rank', size: 10, bold: true, align: 'right'}),
        bar(8, 82, 660, 'boss_bar', 328, '0x2a8fd6', {stroke: '0xff1a5a90'}),
        list(8, 102, 668, 44, 'tier_list', 6, {horizontal: true}),
    ], {style: 103, name: 'boss_box'}),
], {name: 'tab_root'})));
write('vortex_calendar_tier_xml', layout('vortex_calendar_tier_xml', 128, 44, box(0, 0, 128, 44, [
    selectedOverlay(128, 44),
    txt(6, 4, 90, 12, {name: 'tier_txt', size: 9, bold: true}),
    bmp(106, 2, 16, 16, I.check, {name: 'tier_state', color: '0x40b030'}),
    bmp(6, 20, 16, 16, '', {name: 'tier_icon', tags: false}), txt(26, 22, 96, 14, {name: 'tier_reward', size: 9, bold: true}),
], {name: 'tier', params: 17, dyn: 'lifted_hover'})));
write('vortex_calendar_event_row_xml', layout('vortex_calendar_event_row_xml', 684, 50, box(0, 0, 684, 50, [
    selectedOverlay(684, 50),
    box(6, 6, 38, 38, [bmp(11, 11, 16, 16, S.swords, {name: 'event_icon', color: '0xd23a2a'})], {name: 'event_icon_box'}),
    txt(52, 6, 300, 16, {name: 'event_name', bold: true}),
    box(52, 25, 120, 18, [txt(0, 2, 120, 14, {name: 'kind_txt', size: 9, bold: true, color: C.title, align: 'center'})], {name: 'kind_pill', style: 6, color: '0xb02818'}),
    txt(180, 27, 250, 14, {name: 'event_when', size: 10, color: C.sub}),
    bmp(520, 17, 16, 16, S.clock, {color: '0x6a6a72'}), txt(542, 10, 100, 14, {name: 'countdown_label', caption: '${vortex.calendar.in}', size: 9, color: C.sub}), txt(542, 24, 100, 16, {name: 'countdown_txt', size: 11, bold: true}),
    bmp(656, 17, 16, 16, I.right, {color: '0x5a4a7a'}),
], {name: 'event_row', params: 17, dyn: 'lifted_hover'})));
write('vortex_calendar_tab_events_xml', layout('vortex_calendar_tab_events_xml', 700, 420, cont(0, 0, 700, 420, [
    cont(8, 0, 684, 24, [], {name: 'filter_bar'}),
    box(8, 32, 684, 380, [list(0, 6, 684, 368, 'event_list', 4, {scroll: true})], {style: 102, name: 'events'}),
], {name: 'tab_root'})));
write('vortex_calendar_mission_row_xml', layout('vortex_calendar_mission_row_xml', 684, 50, box(0, 0, 684, 50, [
    selectedOverlay(684, 50),
    box(6, 6, 38, 38, [bmp(11, 11, 16, 16, S.swords, {name: 'mission_icon', color: '0x6a6a72'})], {name: 'mission_icon_box'}),
    txt(52, 6, 330, 16, {name: 'mission_name', bold: true}),
    bar(52, 27, 220, 'progress', 66, '0x2a8fd6', {text: false, h: 10, stroke: '0xff1a5a90'}), txt(280, 24, 80, 16, {name: 'progress_txt', size: 10, bold: true}),
    box(420, 10, 80, 30, [bmp(6, 7, 16, 16, S.coin, {name: 'reward_icon', color: '0xf0c030'}), txt(26, 8, 48, 14, {name: 'reward_txt', size: 10, bold: true})], {name: 'reward_box'}),
    btn(560, 11, 114, 'action_button', '${vortex.calendar.see}', {style: 301, color: '0x2a6aa0', h: 28}),
], {name: 'mission_row', params: 17, dyn: 'lifted_hover'})));
write('vortex_calendar_tab_missions_xml', layout('vortex_calendar_tab_missions_xml', 700, 420, cont(0, 0, 700, 420, [
    cont(8, 0, 684, 24, [], {name: 'filter_bar'}),
    box(8, 32, 684, 380, [list(0, 6, 684, 368, 'mission_list', 4, {scroll: true})], {style: 102, name: 'missions'}),
], {name: 'tab_root'})));
write('vortex_calendar_currency_row_xml', layout('vortex_calendar_currency_row_xml', 684, 44, box(0, 0, 684, 44, [
    box(6, 6, 32, 32, [bmp(8, 8, 16, 16, S.coin, {name: 'currency_icon', color: '0xf0c030'})], {name: 'currency_box'}),
    txt(46, 6, 400, 16, {name: 'currency_name', bold: true}),
    txt(46, 24, 400, 14, {name: 'currency_desc', size: 9, color: C.sub}),
    txt(520, 13, 156, 18, {name: 'currency_amount', size: 12, bold: true, align: 'right'}),
], {name: 'currency_row'})));
write('vortex_calendar_tab_wallet_xml', layout('vortex_calendar_tab_wallet_xml', 700, 420, cont(0, 0, 700, 420, [
    txt(8, 2, 400, 16, {caption: '${vortex.calendar.wallet_title}', size: 11, bold: true, color: C.title}),
    box(8, 22, 684, 390, [list(0, 6, 684, 378, 'currency_list', 4)], {style: 103, name: 'wallet'}),
], {name: 'tab_root'})));
write('vortex_calendar_xml', frame('vortex_calendar_xml', 706, 500, '${vortex.calendar.title}', [
    `<tab_context x="6" y="2" width="690" height="32" params="17" style="3" name="tab_context">
  <children>
    <tab_button x="0" y="0" width="160" height="32" params="17" style="3" name="tab_rewards" caption="\${vortex.calendar.tab.rewards}" id="1"/>
    <tab_button x="160" y="0" width="160" height="32" params="17" style="3" name="tab_events" caption="\${vortex.calendar.tab.events}" id="2"/>
    <tab_button x="320" y="0" width="160" height="32" params="17" style="3" name="tab_missions" caption="\${vortex.calendar.tab.missions}" id="3"/>
    <tab_button x="480" y="0" width="160" height="32" params="17" style="3" name="tab_wallet" caption="\${vortex.calendar.tab.wallet}" id="4"/>
  </children>
</tab_context>`,
    cont(0, 40, 700, 420, [], {name: 'tab_content'}),
]));
// reward popup
write('vortex_calendar_reward_popup_xml', frame('vortex_calendar_reward_popup_xml', 360, 300, '${vortex.calendar.reward_obtained}', [
    box(8, 4, 344, 150, [bmp(140, 14, 64, 64, S.chest, {color: '0xb08050', zoom: 4}), txt(8, 96, 328, 18, {name: 'reward_title', size: 13, bold: true, color: C.amber, align: 'center'}), txt(8, 118, 328, 16, {caption: '${vortex.calendar.reward_desc}', size: 10, color: C.sub, align: 'center'})], {style: 102, name: 'reward_stage'}),
    list(56, 162, 248, 60, 'reward_list', 8, {horizontal: true}),
    btn(8, 230, 344, 'take_all_button', '${vortex.reward.take_all}', {style: 301, color: '0x2f9e2f', h: 32}),
]));
locales('calendar', {
    'vortex.calendar.title': 'Calendrier et événements', 'vortex.calendar.tab.rewards': 'Récompenses', 'vortex.calendar.tab.events': 'Événements', 'vortex.calendar.tab.missions': 'Missions', 'vortex.calendar.tab.wallet': 'Portefeuille',
    'vortex.calendar.daily': 'Récompenses quotidiennes', 'vortex.calendar.weekly': 'Récompenses hebdomadaires', 'vortex.calendar.day': 'Jour %n%', 'vortex.calendar.claimed': 'Récupérée', 'vortex.calendar.today': 'Aujourd’hui', 'vortex.calendar.locked': 'Verrouillée', 'vortex.calendar.claim': 'Récupérer la récompense',
    'vortex.calendar.filter.all': 'Tous', 'vortex.calendar.filter.server': 'Événements serveur', 'vortex.calendar.filter.guild': 'Guilde', 'vortex.calendar.filter.boss': 'World Boss', 'vortex.calendar.in': 'Dans', 'vortex.calendar.kind.server': 'Événement serveur', 'vortex.calendar.kind.guild': 'Événement de guilde', 'vortex.calendar.kind.boss': 'World Boss',
    'vortex.calendar.participation': 'Votre participation', 'vortex.calendar.rank': 'Rang actuel : Top %pct% %', 'vortex.calendar.tier': 'Palier %n%', 'vortex.calendar.tier.reached': 'Atteint', 'vortex.calendar.tier.current': 'En cours', 'vortex.calendar.tier.upcoming': 'À venir',
    'vortex.calendar.missions.daily': 'Quotidiennes', 'vortex.calendar.missions.weekly': 'Hebdomadaires', 'vortex.calendar.missions.seasonal': 'Saisonnières', 'vortex.calendar.see': 'Voir', 'vortex.calendar.collect': 'Récupérer',
    'vortex.calendar.reward_obtained': 'Récompense obtenue !', 'vortex.calendar.reward_desc': 'Voici les récompenses que vous avez obtenues :', 'vortex.calendar.wallet_title': 'Monnaies et portefeuille',
    'vortex.calendar.currency.gold': 'Or', 'vortex.calendar.currency.gold_desc': 'Monnaie principale du monde d’Ambreia.', 'vortex.calendar.currency.gems': 'Gemmes', 'vortex.calendar.currency.gems_desc': 'Utilisées pour la boutique et services.', 'vortex.calendar.currency.pvp': 'Jetons PvP', 'vortex.calendar.currency.pvp_desc': 'Obtenus en JcJ, échangeables en boutique.',
    'vortex.calendar.currency.guild': 'Sceaux de guilde', 'vortex.calendar.currency.guild_desc': 'Utilisés pour les améliorations de guilde.', 'vortex.calendar.currency.event': 'Jetons d’événement', 'vortex.calendar.currency.event_desc': 'Obtenus lors des événements publics.', 'vortex.calendar.currency.shards': 'Éclats d’Ambre', 'vortex.calendar.currency.shards_desc': 'Matériau rare pour crafts et échanges.',
}, {
    'vortex.calendar.title': 'Calendar and events', 'vortex.calendar.tab.rewards': 'Rewards', 'vortex.calendar.tab.events': 'Events', 'vortex.calendar.tab.missions': 'Missions', 'vortex.calendar.tab.wallet': 'Wallet',
    'vortex.calendar.daily': 'Daily rewards', 'vortex.calendar.weekly': 'Weekly rewards', 'vortex.calendar.day': 'Day %n%', 'vortex.calendar.claimed': 'Claimed', 'vortex.calendar.today': 'Today', 'vortex.calendar.locked': 'Locked', 'vortex.calendar.claim': 'Claim the reward',
    'vortex.calendar.filter.all': 'All', 'vortex.calendar.filter.server': 'Server events', 'vortex.calendar.filter.guild': 'Guild', 'vortex.calendar.filter.boss': 'World Boss', 'vortex.calendar.in': 'In', 'vortex.calendar.kind.server': 'Server event', 'vortex.calendar.kind.guild': 'Guild event', 'vortex.calendar.kind.boss': 'World Boss',
    'vortex.calendar.participation': 'Your participation', 'vortex.calendar.rank': 'Current rank: Top %pct%%', 'vortex.calendar.tier': 'Tier %n%', 'vortex.calendar.tier.reached': 'Reached', 'vortex.calendar.tier.current': 'In progress', 'vortex.calendar.tier.upcoming': 'Upcoming',
    'vortex.calendar.missions.daily': 'Daily', 'vortex.calendar.missions.weekly': 'Weekly', 'vortex.calendar.missions.seasonal': 'Seasonal', 'vortex.calendar.see': 'See', 'vortex.calendar.collect': 'Collect',
    'vortex.calendar.reward_obtained': 'Reward obtained!', 'vortex.calendar.reward_desc': 'Here are the rewards you obtained:', 'vortex.calendar.wallet_title': 'Currencies and wallet',
    'vortex.calendar.currency.gold': 'Gold', 'vortex.calendar.currency.gold_desc': 'Main currency of Ambreia.', 'vortex.calendar.currency.gems': 'Gems', 'vortex.calendar.currency.gems_desc': 'Used for the shop and services.', 'vortex.calendar.currency.pvp': 'PvP tokens', 'vortex.calendar.currency.pvp_desc': 'Earned in PvP, tradable in the shop.',
    'vortex.calendar.currency.guild': 'Guild seals', 'vortex.calendar.currency.guild_desc': 'Used for guild upgrades.', 'vortex.calendar.currency.event': 'Event tokens', 'vortex.calendar.currency.event_desc': 'Earned during public events.', 'vortex.calendar.currency.shards': 'Amber shards', 'vortex.calendar.currency.shards_desc': 'Rare material for crafts and trades.',
});

// ---------- main menu (Escape)
write('vortex_main_menu_row_xml', layout('vortex_main_menu_row_xml', 260, 36, box(0, 0, 260, 36, [
    selectedOverlay(260, 36),
    bmp(10, 10, 16, 16, S.play, {name: 'row_icon', color: '0x40b030'}),
    txt(36, 10, 190, 16, {name: 'row_label', size: 11, bold: true}),
    bmp(234, 10, 16, 16, I.right, {color: '0x5a4a7a'}),
], {name: 'menu_row', params: 17, dyn: 'lifted_hover'})));
write('vortex_main_menu_xml', frame('vortex_main_menu_xml', 284, 400, '${vortex.settings.menu}', [
    portrait(8, 4, 56, 'head_image'),
    txt(72, 10, 200, 18, {name: 'menu_title', caption: '${vortex.settings.menu}', size: 13, bold: true, color: C.title}),
    txt(72, 30, 200, 14, {caption: '${vortex.settings.universe}', size: 10, color: C.light}),
    list(8, 68, 268, 290, 'menu_list', 4),
]));
// settings window: categories on the left, a panel per category on the right
write('vortex_settings_category_row_xml', layout('vortex_settings_category_row_xml', 150, 40, box(0, 0, 150, 40, [
    selectedOverlay(150, 40),
    bmp(10, 12, 16, 16, S.volume, {name: 'category_icon', color: '0x5a4a7a'}),
    txt(36, 12, 110, 16, {name: 'category_name', size: 11, bold: true}),
], {name: 'category_row', params: 17, dyn: 'lifted_hover'})));
const sliderRow = (y, label, name, fillW, value, uri) => [bmp(8, y + 1, 16, 16, uri, {color: '0x5a4a7a'}), txt(30, y, 150, 16, {caption: label, size: 10}), slider(190, y, 220, name, fillW, {value})];
write('vortex_settings_panel_audio_xml', layout('vortex_settings_panel_audio_xml', 500, 400, box(0, 0, 500, 400, [
    bmp(8, 8, 16, 16, S.volume, {color: '0x5a4a7a'}), txt(30, 8, 300, 16, {caption: '${vortex.settings.audio_title}', size: 12, bold: true, color: C.panelTitle}),
    ...sliderRow(40, '${vortex.settings.audio.master}', 'master', 176, '80 %', S.volume),
    ...sliderRow(70, '${vortex.settings.audio.music}', 'music', 132, '60 %', S.volume),
    ...sliderRow(100, '${vortex.settings.audio.sfx}', 'sfx', 198, '90 %', S.volume),
    ...sliderRow(130, '${vortex.settings.audio.ambience}', 'ambience', 154, '70 %', S.volume),
    ...sliderRow(160, '${vortex.settings.audio.voices}', 'voices', 176, '80 %', S.chat),
    ...sliderRow(190, '${vortex.settings.audio.ui}', 'ui', 165, '75 %', S.gear),
    txt(30, 230, 150, 16, {caption: '${vortex.settings.audio.output}', size: 10}),
    `<dropmenu x="190" y="226" width="270" height="24" params="17" style="3" name="output_menu" caption="Casque (Realtek HD Audio)"/>`,
], {style: 103, name: 'panel'})));
const checkRow = (y, label, name, {checked = true, info = false} = {}) => [txt(8, y + 2, 220, 16, {caption: label, size: 10}), `<checkbox x="240" y="${y}" width="18" height="18" params="17" style="3" name="${name}"/>`, txt(266, y + 2, 120, 16, {name: `${name}_txt`, caption: checked ? '${vortex.settings.enabled}' : '${vortex.settings.disabled}', size: 10, color: C.sub}), ...(info ? [iconBtn(392, y - 3, `${name}_info`, I.info, {w: 22, h: 22})] : [])];
write('vortex_settings_panel_interface_xml', layout('vortex_settings_panel_interface_xml', 500, 400, box(0, 0, 500, 400, [
    bmp(8, 8, 16, 16, S.monitor, {color: '0x5a4a7a'}), txt(30, 8, 300, 16, {caption: '${vortex.settings.interface_title}', size: 12, bold: true, color: C.panelTitle}),
    ...checkRow(40, '${vortex.settings.ui.player_names}', 'player_names'),
    ...checkRow(66, '${vortex.settings.ui.npc_names}', 'npc_names'),
    ...checkRow(92, '${vortex.settings.ui.combat_text}', 'combat_text'),
    txt(8, 124, 180, 16, {caption: '${vortex.settings.ui.hud_scale}', size: 10}), slider(240, 124, 160, 'hud_scale', 80, {value: '100 %'}),
    txt(8, 154, 180, 16, {caption: '${vortex.settings.ui.bar_size}', size: 10}), slider(240, 154, 160, 'bar_size', 110, {value: '120 %'}),
    txt(8, 184, 180, 16, {caption: '${vortex.settings.ui.minimap_zoom}', size: 10}), slider(240, 184, 160, 'minimap_zoom', 50, {value: '1.2x'}),
    txt(8, 214, 180, 16, {caption: '${vortex.settings.ui.chat_opacity}', size: 10}), slider(240, 214, 160, 'chat_opacity', 108, {value: '80 %'}),
], {style: 103, name: 'panel'})));
const menuRow = (y, label, name, value) => [txt(8, y + 4, 180, 16, {caption: label, size: 10}), `<dropmenu x="240" y="${y}" width="220" height="24" params="17" style="3" name="${name}" caption="${value}"/>`];
write('vortex_settings_panel_graphics_xml', layout('vortex_settings_panel_graphics_xml', 500, 400, box(0, 0, 500, 400, [
    bmp(8, 8, 16, 16, S.monitor, {color: '0x5a4a7a'}), txt(30, 8, 300, 16, {caption: '${vortex.settings.graphics_title}', size: 12, bold: true, color: C.panelTitle}),
    ...menuRow(36, '${vortex.settings.gfx.display_mode}', 'display_mode', 'Plein écran'),
    ...menuRow(66, '${vortex.settings.gfx.resolution}', 'resolution', '1920 × 1080 (16:9)'),
    ...menuRow(96, '${vortex.settings.gfx.quality}', 'quality', 'Élevée'),
    ...menuRow(126, '${vortex.settings.gfx.shadows}', 'shadows', 'Moyenne'),
    ...menuRow(156, '${vortex.settings.gfx.effects}', 'effects', 'Élevée'),
    ...menuRow(186, '${vortex.settings.gfx.textures}', 'textures', 'Élevée'),
    ...menuRow(216, '${vortex.settings.gfx.distance}', 'distance', 'Moyenne'),
    `<checkbox x="8" y="252" width="18" height="18" params="17" style="3" name="vsync"/>`, txt(32, 254, 300, 16, {caption: '${vortex.settings.gfx.vsync}', size: 10}), txt(400, 254, 60, 16, {name: 'vsync_txt', caption: '${vortex.settings.enabled}', size: 10, color: C.sub, align: 'right'}),
], {style: 103, name: 'panel'})));
write('vortex_settings_panel_accessibility_xml', layout('vortex_settings_panel_accessibility_xml', 500, 400, box(0, 0, 500, 400, [
    bmp(8, 8, 16, 16, S.access, {color: '0x5a4a7a'}), txt(30, 8, 300, 16, {caption: '${vortex.settings.accessibility_title}', size: 12, bold: true, color: C.panelTitle}),
    ...menuRow(36, '${vortex.settings.acc.colorblind}', 'colorblind', 'Aucun (par défaut)'),
    txt(8, 70, 180, 16, {caption: '${vortex.settings.acc.font_scale}', size: 10}), slider(240, 70, 160, 'font_scale', 100, {value: '125 %'}),
    txt(8, 100, 180, 16, {caption: '${vortex.settings.acc.contrast}', size: 10}), slider(240, 100, 160, 'contrast', 70, {value: '110 %'}),
    ...checkRow(134, '${vortex.settings.acc.reduce_flash}', 'reduce_flash', {info: true}), txt(8, 154, 460, 14, {caption: '${vortex.settings.acc.reduce_flash_desc}', size: 9, color: C.sub}),
    ...checkRow(180, '${vortex.settings.acc.input_assist}', 'input_assist', {info: true}), txt(8, 200, 460, 14, {caption: '${vortex.settings.acc.input_assist_desc}', size: 9, color: C.sub}),
], {style: 103, name: 'panel'})));
write('vortex_settings_keybind_row_xml', layout('vortex_settings_keybind_row_xml', 476, 24, cont(0, 0, 476, 24, [
    bmp(4, 4, 16, 16, S.swords, {name: 'action_icon', color: '0x6a6a72'}),
    txt(26, 4, 300, 16, {name: 'action_txt', size: 10}),
    box(350, 1, 120, 22, [txt(0, 3, 120, 16, {name: 'key_txt', size: 10, bold: true, align: 'center'})], {name: 'key_box', style: 102, params: 17, dyn: 'button'}),
], {name: 'keybind_row'})));
write('vortex_settings_panel_keybinds_xml', layout('vortex_settings_panel_keybinds_xml', 500, 400, box(0, 0, 500, 400, [
    bmp(8, 8, 16, 16, S.keyboard, {color: '0x5a4a7a'}), txt(30, 8, 300, 16, {caption: '${vortex.settings.keybinds_title}', size: 12, bold: true, color: C.panelTitle}),
    txt(8, 40, 80, 16, {caption: '${vortex.settings.keys.category}', size: 10}), `<dropmenu x="240" y="36" width="220" height="24" params="17" style="3" name="category_menu" caption="\${vortex.settings.keys.all}"/>`,
    cont(8, 70, 480, 16, [txt(26, 0, 170, 14, {caption: '${vortex.settings.keys.action}', size: 9, bold: true, color: C.sub}), txt(350, 0, 120, 14, {caption: '${vortex.settings.keys.shortcut}', size: 9, bold: true, color: C.sub, align: 'center'})], {name: 'keys_header'}),
    sep(8, 88, 480),
    list(8, 94, 480, 260, 'keybind_list', 2),
    btn(8, 362, 480, 'reset_button', '${vortex.settings.keys.reset}', {style: 301, color: '0x8c8c86', h: 28}),
], {style: 103, name: 'panel'})));
write('vortex_settings_xml', frame('vortex_settings_xml', 680, 500, '${vortex.settings.title}', [
    box(8, 4, 160, 400, [list(5, 5, 150, 390, 'category_list', 4)], {style: 102, name: 'categories'}),
    cont(176, 4, 500, 400, [], {name: 'panel_slot'}),
    btn(176, 422, 244, 'cancel_button', '${vortex.ui.cancel}', {style: 301, color: '0x8c8c86'}),
    btn(432, 422, 244, 'apply_button', '${vortex.settings.apply}', {style: 301, color: '0x2f9e2f'}),
]));
locales('settings', {
    'vortex.settings.title': 'Paramètres', 'vortex.settings.menu': 'Menu', 'vortex.settings.universe': 'Univers Ambreia', 'vortex.settings.apply': 'Appliquer', 'vortex.settings.enabled': 'Activé', 'vortex.settings.disabled': 'Désactivé',
    'vortex.settings.menu.resume': 'Reprendre', 'vortex.settings.menu.character': 'Personnage', 'vortex.settings.menu.settings': 'Paramètres', 'vortex.settings.menu.help': 'Aide', 'vortex.settings.menu.keys': 'Raccourcis', 'vortex.settings.menu.switch': 'Changer de personnage', 'vortex.settings.menu.logout': 'Déconnexion',
    'vortex.settings.cat.audio': 'Audio', 'vortex.settings.cat.interface': 'Interface', 'vortex.settings.cat.graphics': 'Graphismes', 'vortex.settings.cat.notifications': 'Notifications', 'vortex.settings.cat.accessibility': 'Accessibilité', 'vortex.settings.cat.chat': 'Chat', 'vortex.settings.cat.keys': 'Commandes',
    'vortex.settings.audio_title': 'Réglages audio', 'vortex.settings.audio.master': 'Volume principal', 'vortex.settings.audio.music': 'Musique', 'vortex.settings.audio.sfx': 'Effets sonores', 'vortex.settings.audio.ambience': 'Ambiance', 'vortex.settings.audio.voices': 'Voix (PNJ)', 'vortex.settings.audio.ui': 'Interface (UI)', 'vortex.settings.audio.output': 'Sortie audio',
    'vortex.settings.interface_title': 'Réglages de l’interface', 'vortex.settings.ui.player_names': 'Afficher les noms des joueurs', 'vortex.settings.ui.npc_names': 'Afficher les noms des PNJ', 'vortex.settings.ui.combat_text': 'Afficher le texte de combat', 'vortex.settings.ui.hud_scale': 'Échelle de l’interface (HUD)', 'vortex.settings.ui.bar_size': 'Taille des barres de vie', 'vortex.settings.ui.minimap_zoom': 'Zoom de la mini-carte', 'vortex.settings.ui.chat_opacity': 'Opacité du chat',
    'vortex.settings.graphics_title': 'Réglages graphiques', 'vortex.settings.gfx.display_mode': 'Mode d’affichage', 'vortex.settings.gfx.resolution': 'Résolution', 'vortex.settings.gfx.quality': 'Qualité globale', 'vortex.settings.gfx.shadows': 'Qualité des ombres', 'vortex.settings.gfx.effects': 'Qualité des effets', 'vortex.settings.gfx.textures': 'Qualité des textures', 'vortex.settings.gfx.distance': 'Distance d’affichage', 'vortex.settings.gfx.vsync': 'Synchronisation verticale (V-Sync)',
    'vortex.settings.accessibility_title': 'Accessibilité', 'vortex.settings.acc.colorblind': 'Mode daltonien', 'vortex.settings.acc.font_scale': 'Échelle de police', 'vortex.settings.acc.contrast': 'Contraste de l’interface', 'vortex.settings.acc.reduce_flash': 'Réduire les effets lumineux', 'vortex.settings.acc.reduce_flash_desc': 'Réduit les flashs et effets clignotants.', 'vortex.settings.acc.input_assist': 'Aide à la saisie (input assist)', 'vortex.settings.acc.input_assist_desc': 'Facilite les enchaînements et la visée.',
    'vortex.settings.keybinds_title': 'Raccourcis (keybinds)', 'vortex.settings.keys.category': 'Catégorie :', 'vortex.settings.keys.all': 'Toutes les catégories', 'vortex.settings.keys.action': 'Action', 'vortex.settings.keys.shortcut': 'Raccourci', 'vortex.settings.keys.reset': 'Réinitialiser par défaut',
    'vortex.settings.confirm.title': 'Appliquer les paramètres ?', 'vortex.settings.confirm.message': 'Voulez-vous appliquer ces changements ? Certains paramètres nécessitent un redémarrage du jeu pour être pleinement effectifs.',
}, {
    'vortex.settings.title': 'Settings', 'vortex.settings.menu': 'Menu', 'vortex.settings.universe': 'Ambreia universe', 'vortex.settings.apply': 'Apply', 'vortex.settings.enabled': 'Enabled', 'vortex.settings.disabled': 'Disabled',
    'vortex.settings.menu.resume': 'Resume', 'vortex.settings.menu.character': 'Character', 'vortex.settings.menu.settings': 'Settings', 'vortex.settings.menu.help': 'Help', 'vortex.settings.menu.keys': 'Shortcuts', 'vortex.settings.menu.switch': 'Switch character', 'vortex.settings.menu.logout': 'Log out',
    'vortex.settings.cat.audio': 'Audio', 'vortex.settings.cat.interface': 'Interface', 'vortex.settings.cat.graphics': 'Graphics', 'vortex.settings.cat.notifications': 'Notifications', 'vortex.settings.cat.accessibility': 'Accessibility', 'vortex.settings.cat.chat': 'Chat', 'vortex.settings.cat.keys': 'Controls',
    'vortex.settings.audio_title': 'Audio settings', 'vortex.settings.audio.master': 'Master volume', 'vortex.settings.audio.music': 'Music', 'vortex.settings.audio.sfx': 'Sound effects', 'vortex.settings.audio.ambience': 'Ambience', 'vortex.settings.audio.voices': 'Voices (NPC)', 'vortex.settings.audio.ui': 'Interface (UI)', 'vortex.settings.audio.output': 'Audio output',
    'vortex.settings.interface_title': 'Interface settings', 'vortex.settings.ui.player_names': 'Show player names', 'vortex.settings.ui.npc_names': 'Show NPC names', 'vortex.settings.ui.combat_text': 'Show combat text', 'vortex.settings.ui.hud_scale': 'Interface scale (HUD)', 'vortex.settings.ui.bar_size': 'Health bar size', 'vortex.settings.ui.minimap_zoom': 'Minimap zoom', 'vortex.settings.ui.chat_opacity': 'Chat opacity',
    'vortex.settings.graphics_title': 'Graphics settings', 'vortex.settings.gfx.display_mode': 'Display mode', 'vortex.settings.gfx.resolution': 'Resolution', 'vortex.settings.gfx.quality': 'Overall quality', 'vortex.settings.gfx.shadows': 'Shadow quality', 'vortex.settings.gfx.effects': 'Effects quality', 'vortex.settings.gfx.textures': 'Texture quality', 'vortex.settings.gfx.distance': 'Draw distance', 'vortex.settings.gfx.vsync': 'Vertical sync (V-Sync)',
    'vortex.settings.accessibility_title': 'Accessibility', 'vortex.settings.acc.colorblind': 'Colorblind mode', 'vortex.settings.acc.font_scale': 'Font scale', 'vortex.settings.acc.contrast': 'Interface contrast', 'vortex.settings.acc.reduce_flash': 'Reduce light effects', 'vortex.settings.acc.reduce_flash_desc': 'Reduces flashes and blinking effects.', 'vortex.settings.acc.input_assist': 'Input assist', 'vortex.settings.acc.input_assist_desc': 'Eases combos and aiming.',
    'vortex.settings.keybinds_title': 'Shortcuts (keybinds)', 'vortex.settings.keys.category': 'Category:', 'vortex.settings.keys.all': 'All categories', 'vortex.settings.keys.action': 'Action', 'vortex.settings.keys.shortcut': 'Shortcut', 'vortex.settings.keys.reset': 'Reset to defaults',
    'vortex.settings.confirm.title': 'Apply the settings?', 'vortex.settings.confirm.message': 'Apply these changes? Some settings need a game restart to take full effect.',
});
console.log('calendar + settings layouts written');
// open drop-down: the option list under a dropmenu (selected row in blue, current choice checked)
write('vortex_ui_dropdown_option_xml', layout('vortex_ui_dropdown_option_xml', 220, 22, cont(0, 0, 220, 22, [
    shape(0, 0, 220, 22, '0x2a6aa0', {name: 'highlight', radius: 3, hidden: true}),
    txt(8, 3, 180, 16, {name: 'option_txt', size: 10}),
    bmp(198, 3, 16, 16, I.check, {name: 'option_check', color: '0x40b030', hidden: true}),
], {name: 'option_row', params: 17})));
write('vortex_ui_dropdown_list_xml', layout('vortex_ui_dropdown_list_xml', 228, 120, box(0, 0, 228, 120, [list(4, 4, 220, 112, 'option_list', 1)], {style: 102, name: 'dropdown_list'})));
console.log('dropdown written');
