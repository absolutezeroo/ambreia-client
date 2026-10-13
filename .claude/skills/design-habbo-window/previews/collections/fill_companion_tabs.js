// The mounts (KIND = 'mounts') or pets (KIND = 'pets') window on the tab named by TAB.
tab(root, TAB);
const t = place(find(root, 'tab_content'), `vortex_${KIND}_tab_${TAB.replace('tab_', '')}_xml`, 0, 0);
const M = {
    paw: 'rpg/ui-icons/rpg_stat_pet_paw_animal_handling_tame_beast_mastery_icon', horse: 'rpg/ui-icons/travel_horse_riding_icon', saddle: 'rpg/ui-icons/travel_horseback_riding_saddle_icon', shield: 'rpg/ui-icons/rpg_difficulty_3_medium_buckler_targe_shield_icon',
    heart: 'rpg/ui-icons/rpg_stat_hp_health_heart_icon', speed: 'rpg/ui-icons/rpg_stat_dexterity_agility_boots_movement_speed_icon', stamina: 'rpg/ui-icons/software_power_electricity_battery_thunder_lightning_bolt_zap_icon', jump: 'rpg/ui-icons/arrows_pointer_up_north_icon',
    bag: 'rpg/ui-icons/rpg_loot_bag_money_coins_purse_icon', mountain: 'rpg/ui-icons/rpg_difficulty_4_hard_knightly_kite_heater_shield_icon', clock: 'rpg/ui-icons/software_clock_time_wait_1_icon', apple: 'rpg/ui-icons/food_fruit_apple_icon',
    sparkle: 'rpg/ui-icons/rpg_magic_sparkles_enchantment_icon', banner: 'rpg/ui-icons/map_markers_banner_heraldry_icon', star: 'rpg/ui-icons/boardgames_card_star_icon', snow: 'rpg/ui-icons/weather_thunderstorm_cloud_lightning_zap_icon', fire: 'rpg/ui-icons/weather_wildfire_flame_element_hot_burn_icon',
    search: 'rpg/ui-icons/software_magnifier_zoom_looking_magnifying_glass_icon', heal: 'rpg/ui-icons/software_signs_maths_plus_addition_bonus_add_new_icon', claw: 'rpg/ui-icons/rpg_skill_claw_scratch_rake_maul_attack_damage_icon', clover: 'rpg/ui-icons/alchemy_potion_vial_bottle_clover_luck_butterfly_fairy_full_icon',
    meat: 'rpg/ui-icons/food_meat_chicken_leg_drumstick_icon', fish: 'rpg/fish-loot/icon_00', cookie: 'rpg/ui-icons/food_cookie_biscuit_icon', tree: 'rpg/ui-icons/map_markers_tree_forest_pine_icon', chest: 'rpg/ui-icons/tools_crafting_chest_locked_loot_icon',
};
const RAR = {common: ['Commune', 0x4cc040, 0xb8e090, 0x1f6a1f], uncommon: ['Peu commune', 0x40b030, 0xc8e8c0, 0x2a6a2a], rare: ['Rare', 0x4090e0, 0xc8dcf4, 0x1a4a9a], epic: ['Épique', 0x8a3ad0, 0xdcc8f4, 0x5a2a9a], legendary: ['Légendaire', 0xf0c030, 0xf8e0a0, 0x8a5a10]};
const MOUNTS = [['Cheval d’Ambre', 'common', 'Niv. 1'], ['Loup des brumes', 'rare', 'Niv. 10', true], ['Sanglier cuirassé', 'uncommon', 'Niv. 1'], ['Cerf royal', 'epic', 'Niv. 20'], ['Raptor du canyon', 'rare', 'Niv. 15'], ['Drakelin', 'legendary', 'Niv. 30']];
const PETS = [['Renard d’Ambre', 'uncommon', 'Niv. 15', true, 'Soutien'], ['Slime azuré', 'common', 'Niv. 1', false, 'Tank'], ['Fée des bois', 'rare', 'Niv. 20', false, 'Soutien'], ['Dragonnet rubis', 'epic', 'Niv. 25', false, 'DPS'], ['Chat spectral', 'rare', 'Niv. 10', false, 'Utilitaire'], ['Hibou savant', 'uncommon', 'Niv. 18', false, 'Soutien']];
const mount = KIND === 'mounts';
const LIST = mount ? MOUNTS : PETS;
const rarityPill = (w, key) => { const [label, , bg, ink] = RAR[key]; text(w, 'rarity_pill_txt', label); tint(w, 'rarity_pill', bg); tcolor(w, 'rarity_pill_txt', ink); tint(w, 'rarity_icon', RAR[key][1]); };
const statRow = (list, label, value, uri, c = 0x6a6a72, vc = 0x2b9a00) => add(list, 'vortex_companion_stat_row_xml', (r) => { text(r, 'stat_label', label); text(r, 'stat_value', value); tcolor(r, 'stat_value', vc); icon(r, 'stat_icon', uri); tint(r, 'stat_icon', c); if(!value) find(r, 'stat_label').width = 226; });
const card = (slot, {name, level, key, state, stateColor, active, locked, lockedTxt, free, selected, isAdd = true}) => (isAdd ? add : (s, l, f) => place(s, l, 0, 0, f))(slot, 'vortex_companion_card_xml', (c) => {
    text(c, 'companion_name', name ?? ''); text(c, 'level_txt', level ?? ''); show(c, 'selected', !!selected); show(c, 'active_dot', !!active);
    if(state) { show(c, 'state_pill', true); text(c, 'state_txt', state); tint(c, 'state_pill', stateColor); }
    if(locked) { show(c, 'locked', true); text(c, 'locked_txt', lockedTxt); find(c, 'head_image_box').visible = false; show(c, 'more_button', false); tint(c, null, 0xe6e6e0); }
    if(free) { show(c, 'free', true); find(c, 'head_image_box').visible = false; show(c, 'more_button', false); }
});
if(TAB === 'tab_collection')
{
    text(t, 'type_menu', mount ? 'Tous les types' : 'Tous les rôles'); text(t, 'rarity_menu', 'Toutes les raretés');
    const list = find(t, 'companion_list');
    LIST.forEach(([name, key, level, sel, role]) => add(list, 'vortex_companion_row_xml', (r) => { text(r, 'companion_name', name); tint(r, 'rarity_dot', RAR[key][1]); text(r, 'rarity_txt', role ?? RAR[key][0]); text(r, 'level_txt', level); show(r, 'selected', !!sel); }));
    place(find(t, 'pager_slot'), 'vortex_market_pager_xml', 0, 0, (p) => { p.width = 280; find(p, 'next_button').x = 256; find(p, 'page_txt').width = 280; text(p, 'page_txt', '1 / 2'); });
    const d = find(t, 'detail');
    text(d, 'companion_name', mount ? 'Loup des brumes' : 'Renard d’Ambre'); rarityPill(d, mount ? 'rare' : 'uncommon'); text(t, 'required_level', 'Niveau requis : 10'); text(t, 'kind_txt', mount ? 'Monture terrestre' : 'Compagnon de soutien');
    text(t, 'companion_desc', mount ? 'Un loup au pelage argenté, habitué aux régions montagneuses. Sa prestance inspire le respect.' : 'Un renard au pelage doré, lié aux forêts d’Ambre. Intelligent et loyal, il offre son soutien à son maître en toutes circonstances.');
    const thumbs = find(t, 'thumb_list'); for(let i = 0; i < 4; i++) add(thumbs, 'vortex_inventory_item_slot_xml', (s) => { s.width = 32; s.height = 32; find(s, 'item_count').visible = false; find(s, 'selected').width = 32; find(s, 'selected').height = 32; show(s, 'selected', i === 0); if(i === 3) { show(s, 'lock_icon', true); find(s, 'lock_icon').x = 8; find(s, 'lock_icon').y = 8; } show(s, 'item_icon', false); });
    const st = find(t, 'stat_list');
    if(mount) { statRow(st, 'Vitesse de déplacement', '+60%', M.speed); statRow(st, 'Endurance', '120', M.stamina, 0x40b030, 0x1f2a33); statRow(st, 'Saut', '2,5 m', M.jump, 0x6a6a72, 0x1f2a33); statRow(st, 'Capacité de transport', '4 emplacements', M.bag, 0xb08050, 0x1f2a33); statRow(st, 'Bonus de terrain', 'Montagne (+30%)', M.mountain, 0x8a94a0, 0x1f2a33); }
    else { statRow(st, 'PV bonus', '+250', M.heart, 0xe03a3a); statRow(st, 'Énergie', '100', M.stamina, 0x4090e0, 0x1f2a33); statRow(st, 'Temps d’invocation', '10 s', M.clock, 0xd8a030, 0x1f2a33); statRow(st, 'Capacité de transport', '4 emplacements', M.bag, 0xb08050, 0x1f2a33); statRow(st, 'Zone d’effet des auras', 'Moyenne (5 m)', M.sparkle, 0x8a3ad0, 0x1f2a33); }
    text(t, 'affection_level', 'Niveau 3/5'); text(t, 'affection_txt', mount ? '120 / 300' : '220 / 300'); bar(t, 'affection_bar', mount ? 90 : 164); text(t, 'summon_time', '10 s');
    const bl = find(t, 'bonus_list');
    if(mount) { statRow(bl, '+5% de résistance au froid', '', M.snow, 0x40b0e0); statRow(bl, '+10% d’expérience en exploration', '', M.star, 0xf0c030); }
    else { statRow(bl, '+10% d’expérience gagnée', '', M.star, 0xf0c030); statRow(bl, '+5% de chances de butin', '', M.clover, 0x40b030); }
}
else if(TAB === 'tab_stable')
{
    text(t, 'slots_title', mount ? 'Emplacements dans l’écurie (3/6)' : 'Emplacements d’équipe (2/3)');
    const g = find(t, 'card_grid');
    if(mount) { card(g, {name: 'Cheval d’Ambre', level: 'Niv. 1'}); card(g, {name: 'Loup des brumes', level: 'Niv. 10', active: true, selected: true}); card(g, {name: 'Raptor du canyon', level: 'Niv. 15'}); card(g, {free: true}); card(g, {locked: true, lockedTxt: 'Écurie niv. 3 requis'}); card(g, {locked: true, lockedTxt: 'Écurie niv. 4 requis'}); }
    else { card(g, {name: 'Renard d’Ambre', level: 'Niv. 15', state: 'Actif', stateColor: 0x2f7a2f, active: true, selected: true}); card(g, {name: 'Slime azuré', level: 'Niv. 1', state: 'Repos', stateColor: 0x6a6a72}); card(g, {locked: true, lockedTxt: 'Niv. 20 requis', state: 'Verrouillé', stateColor: 0x6a6a72}); }
    text(t, 'slots_hint', mount ? 'Clic droit sur une monture : définir comme active, renommer, voir les détails, relâcher.' : 'Clic droit sur un compagnon : définir comme actif, voir les détails, retirer de l’équipe, relâcher.');
}
else if(TAB === 'tab_active')
{
    card(find(t, 'active_card_slot'), {name: mount ? 'Loup des brumes' : 'Renard d’Ambre', level: mount ? 'Niv. 10' : 'Niv. 15', active: true, isAdd: false});
    text(t, 'active_name', mount ? 'Loup des brumes' : 'Renard d’Ambre'); text(t, 'active_desc', mount ? 'Un loup au pelage argenté, habitué aux régions montagneuses.' : 'Un renard au pelage doré, lié aux forêts d’Ambre.'); text(t, 'active_summon', 'Temps d’invocation : 10 s'); text(t, 'active_affection', 'Lien d’affection : niveau 3/5');
}
else if(TAB === 'tab_appearances')
{
    const list = find(t, 'appearance_list');
    const APP = mount ? [['Apparence par défaut', 'Standard', 0x8a94a0], ['Pelage des neiges', 'Rare', 0x4090e0, true, true], ['Ombre nocturne', 'Rare', 0x4090e0], ['Flammes d’Ambre', 'Épique', 0x8a3ad0], ['Esprit sylvestre', 'Épique', 0x8a3ad0], ['Armure royale', 'Légendaire', 0xf0c030]] : [['Pelage naturel', 'Standard', 0x8a94a0, true, true], ['Pelage de feu', 'Rare', 0x4090e0], ['Pelage lunaire', 'Rare', 0x4090e0], ['Costume de festival', 'Épique', 0x8a3ad0], ['Ailes féeriques', 'Légendaire', 0xf0c030]];
    APP.forEach(([name, rar, c, sel, equipped]) => add(list, 'vortex_companion_item_row_xml', (r) => { text(r, 'item_name', name); text(r, 'item_sub', rar); tint(r, 'rarity_dot', c); show(r, 'selected', !!sel); show(r, 'equipped_icon', !!equipped); show(r, 'more_button', !equipped); tint(r, 'item_icon', c); }));
    text(t, 'appearance_name', mount ? 'Pelage des neiges' : 'Pelage naturel'); rarityPill(t, mount ? 'rare' : 'common'); text(t, 'appearance_desc', mount ? 'Un pelage immaculé qui rappelle les hivers éternels des hautes cimes.' : 'Le pelage naturel du renard d’Ambre.');
}
else if(TAB === 'tab_equipment')
{
    const list = find(t, 'slot_list');
    for(const [slotName, name, rar, c, sel, empty] of [['Selle', 'Selle d’explorateur', 'Peu commune', 0x40b030, true], ['Armure', 'Barde en cuir renforcé', 'Rare', 0x4090e0], ['Emblème', 'Emblème des pistes', 'Rare', 0x4090e0], ['Cosmétique', 'Aucun objet équipé', '', 0x8a94a0, false, true]])
        add(list, 'vortex_companion_item_row_xml', (r) => { r.width = 248; find(r, 'selected').width = 248; find(r, 'more_button').x = 216; text(r, 'item_name', slotName); text(r, 'item_sub', empty ? name : `${name} · ${rar}`); find(r, 'item_sub').width = 150; tint(r, 'rarity_dot', c); show(r, 'rarity_dot', !empty); if(empty) { find(r, 'item_sub').x = 48; tcolor(r, 'item_sub', 0x888888); show(r, 'more_button', false); } show(r, 'selected', !!sel); icon(r, 'item_icon', [M.saddle, M.shield, M.banner, M.sparkle][['Selle', 'Armure', 'Emblème', 'Cosmétique'].indexOf(slotName)]); tint(r, 'item_icon', empty ? 0x8a94a0 : 0xb08050); });
    const d = find(t, 'item_detail');
    text(d, 'item_name', 'Selle d’explorateur'); tint(d, 'rarity_dot', 0x40b030); text(d, 'rarity_txt', 'Peu commune'); text(d, 'item_desc', 'Une selle robuste, conçue pour les longs voyages.');
    const el = find(t, 'effect_list'); statRow(el, '+10 d’endurance', '', M.stamina, 0x40b030); statRow(el, '+5% de vitesse de déplacement', '', M.speed, 0x40b030);
    text(t, 'price_txt', '500');
}
else if(TAB === 'tab_skills')
{
    const list = find(t, 'skill_list');
    for(const [name, level, uri, c, sel] of [['Morsure vive', 'Niv. 2', M.claw, 0xd23a2a], ['Soin léger', 'Niv. 3', M.heal, 0x40b030], ['Ramassage rapide', 'Niv. 1', M.bag, 0xd8a060, true], ['Aura chanceuse', 'Niv. 1', M.clover, 0x40b030], ['Détection de ressources', 'Niv. 2', M.search, 0x4090e0]])
        add(list, 'vortex_companion_item_row_xml', (r) => { text(r, 'item_name', name); text(r, 'item_sub', level); show(r, 'rarity_dot', false); find(r, 'item_sub').x = 48; icon(r, 'item_icon', uri); tint(r, 'item_icon', c); show(r, 'selected', !!sel); });
    text(t, 'skill_name', 'Ramassage rapide'); text(t, 'skill_level', 'Niv. 1/5'); text(t, 'skill_desc', 'Le compagnon ramasse automatiquement les objets à proximité pour vous.');
    text(t, 'current_effect', 'Rayon de collecte : 5 m'); text(t, 'next_effect', 'Rayon de collecte : 7 m'); text(t, 'cooldown_txt', 'Temps de recharge : 5 s'); text(t, 'cost_txt', 'Coût en énergie : 15'); text(t, 'upgrade_button', 'Améliorer');
}
else if(TAB === 'tab_care')
{
    text(t, 'affection_level', 'Niv. 3/5'); text(t, 'affection_txt', '220 / 300'); text(t, 'state_txt', 'Compagnon heureux et en bonne santé !');
    for(const [n, v, px] of [['hunger', '60 / 100', 138], ['mood', '80 / 100', 184], ['energy', '70 / 100', 161], ['affection', '220 / 300', 168]]) { text(t, `${n}_txt`, v); bar(t, `${n}_bar`, px); }
    text(t, 'food_title', 'Nourriture disponible (3)');
    const g = find(t, 'food_grid');
    for(const [uri, n, c, sel] of [[M.apple, '12', 0xd23a2a, true], [M.cookie, '8', 0xb08050], [M.fish, '5', 0]]) add(g, 'vortex_inventory_item_slot_xml', (s) => { icon(s, 'item_icon', uri); if(c) tint(s, 'item_icon', c); text(s, 'item_count', n); show(s, 'selected', !!sel); });
    const fd = find(t, 'food_detail');
    text(fd, 'food_name', 'Baie sucrée'); tint(fd, 'rarity_dot', 0x40b030); text(fd, 'rarity_txt', 'Peu commun'); text(t, 'food_desc', 'Une nourriture sucrée très appréciée des compagnons.');
    const fl = find(t, 'food_effect_list'); statRow(fl, 'Restaure 30 points de faim.', '', M.meat, 0xd89a20); statRow(fl, '+30 points d’affection.', '', M.heart, 0xe03a3a);
    text(t, 'price_txt', '10');
}
