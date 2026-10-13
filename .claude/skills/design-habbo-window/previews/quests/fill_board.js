const at = (name) => find(root, name);
const row = (slotName, {title, sub, icon: uri = 'rpg/materials/icon_00', locked = false, selected = false, ready = false, dx = 0, dy = 0}) =>
    place(at(slotName), 'vortex_quest_row_xml', dx, dy, (r) => {
        text(r, 'quest_title', title); text(r, 'quest_subtitle', sub); icon(r, 'quest_icon', uri);
        show(r, 'lock_icon', locked); show(r, 'quest_icon', !locked); show(r, 'selected', selected); show(r, 'turn_in_badge', ready); show(r, 'track_button', !ready && !locked);
        if(locked) tcolor(r, 'quest_title', 0x8a94a0);
    });
row('row_normal', {title: 'Un nouveau départ', sub: 'Parler à l’intendant de la ville'});
row('row_hover', {title: 'Un nouveau départ', sub: 'Parler à l’intendant de la ville', dx: -1, dy: -1});
row('row_selected', {title: 'Un nouveau départ', sub: 'Parler à l’intendant de la ville', selected: true});
row('row_locked', {title: 'Le mystère du phare', sub: 'Niv. 35 requis', locked: true});
row('row_ready', {title: 'Un forgeron occupé', sub: 'Rapporter 10 Minerais de Fer', ready: true, icon: 'rpg/gems-materials/icon_00'});

const daily = (slotName, {title, sub, points, px, done}) => place(at(slotName), 'vortex_quest_daily_row_xml', 0, 0, (r) => {
    text(r, 'quest_title', title); text(r, 'quest_objective', sub); text(r, 'points', points); bar(r, 'progress', px);
    show(r, 'done_badge', done); show(r, 'progress', !done); show(r, 'claim_button', false);
});
daily('daily_progress', {title: 'Collecte quotidienne', sub: 'Collecter 10 ressources', points: '4 / 10', px: 85, done: false});
daily('daily_done', {title: 'Chasse aux monstres', sub: 'Vaincre 15 monstres', points: '', px: 0, done: true});

const done = (slotName, selected) => place(at(slotName), 'vortex_quest_completed_row_xml', 0, 0, (r) => { text(r, 'quest_title', 'Un nouveau départ'); text(r, 'quest_region', 'Ville d’Ambre'); text(r, 'completed_date', '12/03/2024'); show(r, 'selected', selected); });
done('done_normal', false); done('done_selected', true);

place(at('region'), 'vortex_quest_region_header_xml', 0, 0, (h) => { text(h, 'region_name', 'Ville d’Ambre'); text(h, 'region_count', '2 / 3'); });
place(at('obj_todo'), 'vortex_quest_objective_row_xml', 0, 0, (o) => { text(o, 'label', 'Parler à l’intendant de la ville'); text(o, 'count', '0 / 1'); });
place(at('obj_done'), 'vortex_quest_objective_row_xml', 0, 0, (o) => { text(o, 'label', 'Parler à l’intendant de la ville'); text(o, 'count', '1 / 1'); show(o, 'check_icon', true); });
place(at('repeatable'), 'vortex_quest_detail_header_xml', 0, 0, (h) => { text(h, 'quest_title', 'Collecte quotidienne'); text(h, 'quest_subtitle', 'Quête quotidienne'); show(h, 'repeatable_pill', true); show(h, 'quest_desc', false); find(h, 'banner').width = 270; find(h, 'giver').x = 218; find(h, 'repeatable_pill').x = 120; });

const menu = (slotName, rows) => place(at(slotName), 'vortex_ui_menu_xml', 0, 0, (m) => {
    const height = rows.length * 25 + 12; m.height = height; find(m, 'menu_frame').height = height; find(m, 'menu_list').height = height - 12;
    for(const [label, uri, c, checked] of rows) add(find(m, 'menu_list'), 'vortex_ui_menu_row_xml', (r) => { text(r, 'row_label', label); if(uri) { icon(r, 'row_icon', uri); tint(r, 'row_icon', c); } else show(r, 'row_icon', false); show(r, 'row_check', !!checked); if(checked) tint(r, null, 0xffd890); });
});
menu('menu_regions', [['Toutes les régions', null, 0, true], ['Ville d’Ambre', null, 0], ['Région des Lacs', null, 0], ['Forêt d’Émeraude', null, 0], ['Montagnes du Nord', null, 0], ['Port de Brise-Lame', null, 0]]);
menu('menu_sort', [['Plus récentes', null, 0, true], ['Plus anciennes', null, 0], ['Ordre alphabétique', null, 0], ['Région (A → Z)', null, 0], ['Région (Z → A)', null, 0]]);
menu('menu_context', [['Suivre cette quête', 'rpg/ui-icons/map_markers_location_pin_small_icon', 0xe04848], ['Ne plus suivre', 'rpg/ui-icons/map_markers_location_pin_small_icon', 0x888888], ['Abandonner la quête', 'rpg/ui-icons/software_signs_maths_multiplication_x_crossout_checkmark_cancel_icon', 0xd23a2a], ['Partager dans le chat', 'rpg/ui-icons/software_speech_bubble_three_dots_dialogue_icon', 0x2a8fd6]]);

const tip = (slotName, title, body, uri, c, extra = '') => place(at(slotName), 'vortex_hud_tip_xml', 0, 0, (w) => { text(w, 'tip_title', title); text(w, 'tip_txt', body); if(uri) { icon(w, 'tip_icon', uri); tint(w, 'tip_icon', c); } else show(w, 'tip_icon_box', false); if(extra) { text(w, 'tip_extra', extra); show(w, 'tip_extra', true); } });
tip('tip_reward', 'Sac à dos de voyage', 'Équipement. Augmente la capacité de votre inventaire de 10 emplacements.', 'rpg/ui-icons/rpg_loot_bag_money_coins_purse_icon', 0xd8a060);
tip('tip_objective', 'Bois d’Ambre', 'Objet de quête. Un bois solide issu des forêts d’Ambre.', 'rpg/materials/icon_01', 0xffffff, 'Progression : 2 / 5 · Clique pour voir sur la carte');
tip('tip_pin', 'Voir sur la carte', '', null, 0);
tip('tip_repeatable', 'Quête répétable', 'Cette quête peut être refaite chaque jour jusqu’à la réinitialisation.', 'rpg/ui-icons/arrows_reload_refresh_rotate_clockwise_icon', 0x60a0e0);

place(at('toast_new'), 'vortex_hud_toast_xml', 0, 0, (w) => { text(w, 'toast_title', 'Nouvelle quête !'); text(w, 'toast_txt', 'Un forgeron occupé'); });
place(at('toast_progress'), 'vortex_hud_toast_xml', 0, 0, (w) => { text(w, 'toast_title', 'Progression de quête'); text(w, 'toast_txt', 'Ressources locales  2 / 5 → 3 / 5'); icon(w, 'toast_icon', 'rpg/materials/icon_01'); tint(w, 'toast_icon', 0xffffff); tint(w, 'toast_frame', 0x686661); });
const hudRow = (slotName, selected) => place(at(slotName), 'vortex_hud_quest_row_xml', 0, 0, (r) => { text(r, 'quest_title', 'Ressources locales'); text(r, 'quest_objective', 'Collecter 5 Bois d’Ambre'); text(r, 'quest_count', '2 / 5'); icon(r, 'quest_icon', 'rpg/materials/icon_01'); show(r, 'selected', selected); tint(r, null, 0xffffff); });
hudRow('hud_row', false); hudRow('hud_row_selected', true);
