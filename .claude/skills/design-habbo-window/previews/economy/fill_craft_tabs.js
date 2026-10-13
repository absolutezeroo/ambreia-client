// @include fill_common.js
// The craft window on the tab named by TAB.
tab(root, TAB);
const t = place(find(root, 'tab_content'), `vortex_craft_${TAB}_xml`, 0, 0);
const JOBS = [['Bûcheron', I.axe, 'Niv. 12', '320 / 1 000', 60], ['Mineur', I.pick, 'Niv. 10', '420 / 1 000', 78], ['Pêcheur', I.rod, 'Niv. 8', '220 / 1 000', 41], ['Forgeron', I.anvil, 'Niv. 10', '350 / 1 000', 65], ['Alchimiste', I.flask, 'Niv. 15', '780 / 1 000', 145]];
const jobs = (list, selected = 0) => JOBS.forEach(([name, uri, level, pts, px], i) => add(list, 'vortex_craft_job_row_xml', (r) => { text(r, 'job_name', name); icon(r, 'job_icon', uri); tint(r, 'job_icon', 0xb08050); text(r, 'job_level', level); text(r, 'points', pts); bar(r, 'job_bar', px); show(r, 'selected', i === selected); const w = list.width; if(w < r.width) { r.width = w; find(r, 'selected').width = w; find(r, 'job_level').width = w - 82; const b = find(r, 'job_bar'); b.width = w - 82; find(b, 'bg').width = w - 82; find(b, 'points').width = w - 82; find(r, 'open_button').x = w - 24; } }));
const bag = (slot) => place(slot, 'vortex_craft_bag_xml', 0, 0, (b) => { const g = find(b, 'bag_grid'); for(const [n, uri, c] of [['', 'rpg/plants-crops/icon_05', '5'], ['', 'rpg/plants-crops/icon_02', '8'], ['', 'rpg/materials/icon_00', '12'], ['', 'rpg/gems-materials/icon_00', '6'], ['', 'rpg/consumables-potions/icon_00', '3'], ['', 'rpg/fish-loot/icon_00', '4'], ['', 'rpg/materials/icon_03', '2'], ['', 'rpg/plants-crops/icon_06', '9']]) add(g, 'vortex_craft_bag_slot_xml', (s) => { icon(s, 'item_icon', uri); text(s, 'item_count', c); }); });
const sidebar = (slot) => place(slot, 'vortex_craft_sidebar_xml', 0, 0, (s) => { text(s, 'jobs_title', 'Vos métiers'); jobs(find(s, 'job_list'), -1); bag(find(s, 'bag_slot_container')); });
const ingredients = (list, rows, width = 344) => rows.forEach(([name, uri, count, ok]) => add(list, 'vortex_craft_ingredient_row_xml', (r) => { text(r, 'ingredient_name', name); icon(r, 'ingredient_icon', uri); text(r, 'ingredient_count', count); icon(r, 'state_icon', ok ? I.check : I.x); tint(r, 'state_icon', ok ? 0x40b030 : 0xd23a2a); r.width = width; }));
const ING = [['Fleur rouge', 'rpg/plants-crops/icon_05', '5 / 5', true], ['Feuille verte', 'rpg/plants-crops/icon_02', '8 / 5', true], ['Eau pure', 'rpg/consumables-potions/icon_04', '3 / 3', true]];
const RECIPES = [['Potion de soin (p)', 'rpg/consumables-potions/icon_00', 'Alchimie', 'Niv. 1', true], ['Potion de mana (p)', 'rpg/consumables-potions/icon_01', 'Alchimie', 'Niv. 1'], ['Repas simple', 'rpg/plants-crops/icon_00', 'Cuisine', 'Niv. 5'], ['Hache en bois', 'rpg/weapons/icon_02', 'Menuiserie', 'Niv. 5'], ['Pioche en fer', 'rpg/weapons/icon_08', 'Forge', 'Niv. 10'], ['Canne à pêche', 'rpg/weapons/icon_12', 'Pêche', 'Niv. 5'], ['Poutre raffinée', 'rpg/materials/icon_00', 'Menuiserie', 'Niv. 15', false, true]];
if(TAB === 'tab_recipes')
{
    text(t, 'category_filter', 'Toutes les catégories');
    const list = find(t, 'recipe_list');
    RECIPES.forEach(([name, uri, cat, level, sel, locked]) => add(list, 'vortex_craft_recipe_row_xml', (r) => { text(r, 'recipe_name', name); icon(r, 'recipe_icon', uri); text(r, 'recipe_category', cat); text(r, 'recipe_level', level); show(r, 'selected', !!sel); show(r, 'lock_icon', !!locked); if(locked) { tint(r, 'recipe_icon', 0x8080a0); tcolor(r, 'recipe_name', 0x8a94a0); } }));
    header(find(t, 'item_header_slot'), {name: 'Potion de soin (p)', level: 'Niv. 1', category: 'Alchimie', desc: 'Restaure une petite quantité de points de vie.', uri: I.potion, width: 300});
    quantity(find(t, 'quantity_slot'), '3');
    ingredients(find(t, 'ingredient_list'), ING);
    icon(t, 'result_icon', I.potion); text(t, 'result_name', 'Potion de soin (p)'); text(t, 'result_qty', 'x 3');
    text(t, 'queue_title', 'File de fabrication (2)');
    const q = find(t, 'queue_list');
    for(const [name, uri, qty, px, time] of [['Potion de soin (p)', I.potion, 'x3', 52, '00:00:28'], ['Lingot de fer', 'rpg/gems-materials/icon_00', 'x5', 16, '00:02:15']]) add(q, 'vortex_craft_queue_row_xml', (r) => { text(r, 'item_name', name); icon(r, 'item_icon', uri); text(r, 'item_qty', qty); bar(r, 'progress', px); text(r, 'points', ''); text(r, 'time_txt', time); show(r, 'collect_button', false); });
    sidebar(find(t, 'sidebar_slot'));
}
else if(TAB === 'tab_crafting')
{
    const cards = find(t, 'queue_cards');
    for(const [name, uri, qty, time, sel, ready] of [['Potion de soin (p)', I.potion, 'x3', '00:00:28', true], ['Lingot de fer', 'rpg/gems-materials/icon_00', 'x5', '00:02:15'], ['Flèche en fer', 'rpg/weapons/icon_12', 'x20', '00:05:40'], ['Repas simple', 'rpg/plants-crops/icon_00', 'x2', '', false, true]])
        add(cards, 'vortex_craft_queue_card_xml', (c) => { text(c, 'item_name', name); icon(c, 'item_icon', uri); text(c, 'item_qty', qty); text(c, 'time_txt', time); show(c, 'selected', !!sel); show(c, 'ready_pill', !!ready); });
    header(find(t, 'item_header_slot'), {name: 'Potion de soin (p)', level: 'Niv. 1', category: 'Alchimie', desc: 'Restaure une petite quantité de points de vie.', uri: I.potion, width: 344});
    quantity(find(t, 'quantity_slot'), '3'); bar(t, 'craft_progress', 107); text(t, 'points', ''); text(t, 'craft_time_txt', '00:00:28 / 00:01:30 (1/3)');
    ingredients(find(t, 'ingredient_list'), ING); text(t, 'unit_time_txt', '00:00:30 / unité');
    text(t, 'queue_title', 'File complète (4)');
    const q = find(t, 'queue_list');
    for(const [name, uri, qty, px, time, ready] of [['Potion de soin (p)', I.potion, 'x3', 52, '00:00:28'], ['Lingot de fer', 'rpg/gems-materials/icon_00', 'x5', 16, '00:02:15'], ['Repas simple', 'rpg/plants-crops/icon_00', 'x2', 78, 'Terminé', true]]) add(q, 'vortex_craft_queue_row_xml', (r) => { text(r, 'item_name', name); icon(r, 'item_icon', uri); text(r, 'item_qty', qty); bar(r, 'progress', px); text(r, 'points', ''); text(r, 'time_txt', time); show(r, 'collect_button', !!ready); show(r, 'cancel_button', !ready); });
    text(t, 'speed_up_button', 'Accélérer (1 gemme)');
    sidebar(find(t, 'sidebar_slot'));
}
else if(TAB === 'tab_jobs')
{
    jobs(find(t, 'job_list'), 0);
    header(find(t, 'item_header_slot'), {name: 'Bûcheron', level: 'Niveau 12', category: 'Métier de récolte', desc: 'Coupez des arbres pour obtenir du bois et des ressources végétales.', uri: I.axe, width: 344});
    text(t, 'level_from', 'Niv. 12'); bar(t, 'job_progress', 77); text(t, 'points', ''); text(t, 'level_to', 'Niv. 13'); text(t, 'job_progress_txt', '320 / 1 000 (32 %)');
    const st = find(t, 'job_stats'); kv(st, 'Bois récolté', '1 240', {width: 268}); kv(st, 'Arbres abattus', '312', {width: 268}); kv(st, 'Bonus de rendement', '+ 10 %', {width: 268, color: 0x2b9a00}); kv(st, 'Outil équipé', 'Hache en bois', {width: 268});
    const ms = find(t, 'milestone_list');
    for(const [level, label, uri, state] of [['Niv. 5', 'Bois exotique débloqué', I.tree, 'done'], ['Niv. 10', '+10 % rendement', 'rpg/plants-crops/icon_02', 'done'], ['Niv. 15', 'Nouvelle recette débloquée', I.lock, 'locked'], ['Niv. 20', 'Hache en acier', I.axe, 'locked'], ['Niv. 25', 'Récolte rapide', I.ff, 'locked']])
        add(ms, 'vortex_craft_milestone_xml', (m) => { text(m, 'milestone_level', level); text(m, 'milestone_label', label); icon(m, 'milestone_icon', uri); if(state === 'locked') { tint(m, null, 0xe8e8e2); icon(m, 'state_icon', I.lock); tint(m, 'state_icon', 0x8a94a0); tint(m, 'milestone_icon', 0x8a94a0); } else { tint(m, null, 0xd8f0c0); icon(m, 'state_icon', I.check); } });
    text(t, 'recipes_title', 'Recettes débloquées (6)');
    const ur = find(t, 'unlocked_recipes');
    for(const [label, uri] of [['Planche', 'rpg/materials/icon_00'], ['Hache', 'rpg/weapons/icon_02'], ['Bâton', 'rpg/weapons/icon_20'], ['Torche', 'rpg/dungeon-objects/icon_05'], ['Caisse', 'rpg/dungeon-objects/icon_37'], ['Arc', 'rpg/weapons/icon_12']]) add(ur, 'vortex_craft_recipe_tile_xml', (r) => { text(r, 'recipe_label', label); icon(r, 'recipe_icon', uri); });
    icon(t, 'tool_icon', I.axe); text(t, 'tool_name', 'Hache en bois'); text(t, 'tool_info', 'Niv. 5 · Menuiserie');
    icon(t, 'resource_icon', 'rpg/materials/icon_00'); text(t, 'resource_name', 'Bois d’Ambre'); text(t, 'resource_desc', 'Ressource principale des bûcherons d’Ambre.');
    bag(find(t, 'bag_slot_container'));
}
else
{
    text(t, 'order_filter', 'Toutes les commandes'); tint(t, 'filter_0', 0x6a4c9c);
    const list = find(t, 'order_list');
    for(const [npc, title, uri, progress, gold, time, sel, state] of [['Sophie', 'Potions de soin pour l’expédition', I.potion, '5/5', '500', '2h 14m', true, 'En cours'], ['Capitaine Renaud', 'Haches pour les bûcherons', 'rpg/weapons/icon_02', '0/3', '750', '6h 32m'], ['Maître Alchimiste', 'Potions de mana', 'rpg/consumables-potions/icon_01', '0/4', '600', '11h 05m'], ['Guide d’Avoria', 'Cannes à pêche', 'rpg/weapons/icon_12', '0/5', '400', '1j 02h']])
        add(list, 'vortex_craft_order_row_xml', (r) => { text(r, 'npc_name', npc); text(r, 'order_title', title); icon(r, 'item_icon', uri); text(r, 'order_progress', progress); text(r, 'order_gold', gold); text(r, 'order_time', time); show(r, 'selected', !!sel); if(state) { show(r, 'order_state', true); text(r, 'order_state_txt', state); } });
    text(t, 'order_title', 'Potions de soin pour l’expédition'); icon(t, 'order_item_icon', I.potion); text(t, 'npc_name', 'Sophie'); text(t, 'npc_role', 'Guide d’expédition');
    text(t, 'order_desc', 'L’expédition de samedi a besoin de potions de soin. Fabriquez-en cinq et livrez-les avant le départ.');
    place(find(t, 'order_objective_slot'), 'vortex_craft_ingredient_row_xml', 0, 0, (r) => { text(r, 'ingredient_name', 'Potion de soin (p)'); icon(r, 'ingredient_icon', I.potion); text(r, 'ingredient_count', '5 / 5'); icon(r, 'state_icon', I.check); tint(r, 'state_icon', 0x40b030); r.width = 232; find(r, 'ingredient_count').x = 170; find(r, 'state_icon').x = 212; });
    text(t, 'order_hint', 'Tous les objets sont prêts : livrez la commande.'); text(t, 'reward_gold', '500'); text(t, 'reward_xp', '+ 1 200 XP'); text(t, 'deadline_txt', '2h 14m');
    text(t, 'order_status_txt', 'En cours'); text(t, 'status_hint', 'Commande acceptée, livraison possible.');
    show(t, 'accept_button', false); show(t, 'deliver_button', true); show(t, 'abandon_button', true);
    sidebar(find(t, 'sidebar_slot'));
}
