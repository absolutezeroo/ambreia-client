// The quest window's main tab with sample quests; `P` is '' for the shipped layouts, 'dark_'
// for the dark-theme prototype (the root tells which).
const P = 'purple_';
const L = (n) => P + n;
const frame = root;
tab(frame, 'tab_main');
const content = find(frame, 'tab_content');
const t = place(content, L('vortex_quest_tab_active_xml'), 0, 0);
const list = find(t, 'quest_list');
const region = (name, count) => add(list, L('vortex_quest_region_header_xml'), (h) => { text(h, 'region_name', name); text(h, 'region_count', count); });
const quest = (title, sub, {icon = 'rpg/materials/icon_00', locked = false, selected = false, ready = false} = {}) => add(list, L('vortex_quest_row_xml'), (r) => {
    text(r, 'quest_title', title); text(r, 'quest_subtitle', sub); icon && (find(r, 'quest_icon').assetUri = icon);
    show(r, 'lock_icon', locked); show(r, 'quest_icon', !locked); show(r, 'selected', selected); show(r, 'turn_in_badge', ready); show(r, 'track_button', !ready && !locked);
    if(locked) tcolor(r, 'quest_title', 0x8a94a0);
});
region('Ville d’Ambre', '2 / 3');
quest('Un nouveau départ', 'Parler à l’intendant de la ville', {selected: true});
quest('Ressources locales', 'Collecter 5 Bois d’Ambre', {icon: 'rpg/materials/icon_01'});
quest('Un forgeron occupé', 'Rapporter 10 Minerais de Fer', {icon: 'rpg/gems-materials/icon_00', ready: true});
region('Région des Lacs', '0 / 2');
quest('Le mystère du phare', 'Niv. 35 requis', {locked: true});
quest('Des pêcheurs en difficulté', 'Niv. 38 requis', {locked: true, icon: 'rpg/materials/icon_02'});
region('Montagnes du Nord', '0 / 1');
quest('Les traces du passé', 'Niv. 40 requis', {locked: true, icon: 'rpg/materials/icon_03'});

const header = place(find(t, 'detail_header'), L('vortex_quest_detail_header_xml'), 0, 0, (h) => {
    text(h, 'quest_title', 'Un nouveau départ'); text(h, 'quest_subtitle', 'Ville d’Ambre');
    text(h, 'quest_desc', 'L’intendant de la ville souhaite te rencontrer pour te donner tes premières responsabilités et t’aider à t’installer à Ambre.');
});
add(find(t, 'objective_list'), L('vortex_quest_objective_row_xml'), (o) => { text(o, 'label', 'Parler à l’intendant de la ville'); text(o, 'count', '0 / 1'); });
add(find(t, 'objective_list'), L('vortex_quest_objective_row_xml'), (o) => { text(o, 'label', 'Visiter la place du marché'); text(o, 'count', '1 / 1'); show(o, 'check_icon', true); });
const rewards = find(t, 'reward_list');
add(rewards, L('vortex_quest_reward_tile_xml'), (w) => { text(w, 'reward_name', 'Or'); text(w, 'reward_value', '500'); icon(w, 'icon', 'rpg/ui-icons/rpg_coin_gold_currency_money_gp_icon'); tint(w, 'icon', 0xf0c030); });
add(rewards, L('vortex_quest_reward_tile_xml'), (w) => { text(w, 'reward_name', 'XP'); text(w, 'reward_value', '1 000'); icon(w, 'icon', 'rpg/ui-icons/boardgames_card_star_icon'); tint(w, 'icon', 0x6cbb2d); });
add(rewards, L('vortex_quest_reward_tile_xml'), (w) => { text(w, 'reward_name', 'Sac de voyage'); text(w, 'reward_value', 'Équipement'); icon(w, 'icon', 'rpg/ui-icons/rpg_loot_bag_money_coins_purse_icon'); tint(w, 'icon', 0xd8a060); });
place(find(t, 'progression_slot'), L('vortex_quest_progress_xml'), 0, 0, (p) => {
    text(p, 'level_txt', 'Niveau 32'); text(p, 'points', '12 450 / 48 000'); text(p, 'xp_pct', '25 % du niveau'); bar(p, 'xp_bar', 27);
    const factions = find(p, 'faction_list');
    for(const [name, lvl, pts, px, standing] of [['Ville d’Ambre', 'Niv. 4', '280 / 500', 76, 'Neutre'], ['Région des Lacs', 'Niv. 3', '120 / 500', 33, 'Inconnu']])
    {
        add(factions, L('vortex_character_faction_compact_row_xml'), (r) => { text(r, 'faction_name', name); text(r, 'faction_level', lvl); text(r, 'points', pts); bar(r, 'faction_bar', px); text(r, 'standing_txt', standing); show(r, 'help_button', false); });
    }
});
