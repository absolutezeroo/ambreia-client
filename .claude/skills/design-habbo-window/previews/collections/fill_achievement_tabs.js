// @include fill_common.js
// The achievements window on the tab named by TAB.
tab(root, TAB);
const t = place(find(root, 'tab_content'), `vortex_achievement_${TAB}_xml`, 0, 0);
if(TAB === 'tab_achievements')
{
    categories(find(t, 'category_list'), CATS, 0);
    const h = find(t, 'category_header'); text(h, 'category_name', 'Général'); text(h, 'category_desc', 'Découvrez les bases du monde d’Ambre et relevez des défis variés.'); icon(h, 'category_icon', I.world); tint(h, 'category_icon', 0x40b0e0); text(h, 'category_count', '42 / 80'); text(h, 'category_pct', '52 %');
    const list = find(t, 'achievement_list');
    for(const [name, desc, prog, px, done, gold, uri, c, sel] of [['Premier pas', 'Se connecter au jeu pour la première fois.', '1 / 1', 120, true, '10', I.home, 0xd8a060, true], ['Bon vivant', 'Discuter 100 fois avec d’autres joueurs.', '56 / 100', 67, false, '30', I.chat, 0x2a8fd6], ['Grand voyageur', 'Visiter 20 zones différentes.', '12 / 20', 72, false, '30', I.boots, 0xb08050], ['Esprit d’équipe', 'Rejoindre ou créer un groupe.', '0 / 1', 0, false, '20', I.group, 0x2a8fd6], ['Ami du peuple', 'Ajouter 10 amis à votre liste.', '3 / 10', 36, false, '25', I.handshake, 0x40b030], ['Toujours plus haut', 'Atteindre le niveau 50.', '32 / 50', 77, false, '50', I.crown, 0xf0c030], ['Cueilleur débutant', 'Récolter 50 plantes.', '50 / 50', 120, true, '15', I.tree, 0x40b030]])
        add(list, 'vortex_achievement_row_xml', (r) => { text(r, 'achievement_name', name); text(r, 'achievement_desc', desc); text(r, 'points', prog); bar(r, 'progress', px); if(done) { const f = find(find(r, 'progress'), 'fill'); f.color = 0x6cbb2d; } show(r, 'done_box', done); text(r, 'reward_gold', gold); icon(r, 'achievement_icon', uri); tint(r, 'achievement_icon', c); show(r, 'selected', !!sel); });
    const recent = find(t, 'recent_list');
    for(const [name, time, uri, c] of [['Premier pas', 'Il y a 2 min', I.home, 0xd8a060], ['Nouvel ami', 'Il y a 1 h', I.group, 0x2a8fd6], ['Cueilleur', 'Il y a 3 h', I.tree, 0x40b030], ['Nouvelle zone', 'Il y a 5 h', I.explore, 0xd8a060]]) add(recent, 'vortex_achievement_recent_tile_xml', (r) => { text(r, 'recent_name', name); text(r, 'recent_time', time); icon(r, 'recent_icon', uri); tint(r, 'recent_icon', c); });
    const d = find(t, 'achievement_detail');
    icon(d, 'detail_icon', I.home); tint(d, 'detail_icon', 0xd8a060); text(d, 'detail_name', 'Premier pas'); text(d, 'detail_desc', 'Se connecter au jeu pour la première fois.');
    text(find(d, 'state_done'), 'state_desc', 'Succès débloqué le 14/02/2025 à 14:22');
    add(find(d, 'reward_list'), 'vortex_achievement_info_line_xml', (r) => { text(r, 'info_title', '10 Pièces d’Ambre'); text(r, 'info_desc', 'Devise principale du monde d’Ambre.'); icon(r, 'info_icon', I.coin); tint(r, 'info_icon', 0xf0c030); });
    bar(d, 'detail_progress', 324); text(find(d, 'detail_progress'), 'points', '1 / 1');
    const sim = find(d, 'similar_list');
    for(const [name, desc, prog, px, uri, c] of [['Explorateur en herbe', 'Visiter 5 zones différentes.', '5 / 5', 238, I.explore, 0xd8a060], ['Première quête', 'Terminer votre première quête.', '1 / 1', 238, I.quest, 0xd8a060]]) add(sim, 'vortex_achievement_similar_row_xml', (r) => { text(r, 'similar_name', name); text(r, 'similar_desc', desc); text(r, 'points', prog); bar(r, 'progress', px); icon(r, 'similar_icon', uri); tint(r, 'similar_icon', c); });
}
else if(TAB === 'tab_badges')
{
    categories(find(t, 'category_list'), [['Tous', '68 / 220', I.star, 0xf0c030], ['Aventure', '12 / 40', I.explore, 0xd8a060], ['Social', '10 / 35', I.social, 0x2a8fd6], ['Donjons', '8 / 25', I.skull, 0x8a94a0], ['Événements', '11 / 30', I.event, 0xd23a2a], ['Guildes', '7 / 25', I.crown, 0xd23a2a], ['Collection', '14 / 40', I.collection, 0xb08050], ['Saison', '6 / 25', I.snow, 0x40b0e0]], 0);
    text(t, 'list_title', 'Tous les badges (68 / 220)'); text(t, 'rarity_filter', 'Toutes les raretés');
    const grid = find(t, 'badge_grid');
    const BADGES = [[I.home, 0xd8a060, 'common', true], [I.sword, 0x4090e0, 'rare'], [I.tree, 0x40b030, 'rare'], [I.skull, 0xd23a2a, 'epic'], [I.group, 0x8a3ad0, 'epic'], [I.quest, 0xd8a060, 'common'], [I.boots, 0x8a94a0, 'rare'], [I.job, 0xb08050, 'rare'], [I.crown, 0xf0c030, 'legendary'], [I.star, 0xd23a2a, 'epic'], [I.book, 0x40b0e0, 'rare'], [I.chat, 0xd8a060, 'common'], [I.lantern, 0x40b030, 'rare'], [I.gem, 0x8a94a0, 'rare'], [I.coin, 0xf0c030, 'legendary']];
    BADGES.forEach(([uri, c, key, sel]) => add(grid, 'vortex_achievement_badge_slot_xml', (b) => { place(b, 'vortex_achievement_collection_item_xml', 18, 21, (it) => { it.width = 58; icon(it, 'item_icon', uri); tint(it, 'item_icon', c); show(it, 'found_icon', false); tint(it, null, RARITY[key][1]); }); find(b, 'badge_image').visible = false; show(b, 'selected', !!sel); }));
    for(let i = 0; i < 10; i++) add(grid, 'vortex_achievement_badge_slot_xml', (b) => { place(b, 'vortex_achievement_collection_item_xml', 18, 21, (it) => { icon(it, 'item_icon', I.lock); tint(it, 'item_icon', 0x8a94a0); show(it, 'found_icon', false); tint(it, null, 0xe6e6e0); }); find(b, 'badge_image').visible = false; });
    const d = find(t, 'badge_detail');
    place(d, 'vortex_achievement_collection_item_xml', 141, 20, (it) => { icon(it, 'item_icon', I.home); tint(it, 'item_icon', 0xd8a060); show(it, 'found_icon', false); tint(it, null, 0xb8e090); }); find(d, 'badge_image').visible = false;
    text(d, 'badge_name', 'Premier pas'); rarity(d, 'rarity_pill', 'common'); text(d, 'badge_desc', 'Se connecter au jeu pour la première fois et débuter votre aventure dans le monde d’Ambre.');
    text(d, 'condition_txt', 'Se connecter au jeu pour la première fois.'); text(find(d, 'state_unlocked'), 'state_desc', 'Débloqué le 14/02/2025 à 14:22');
    place(find(d, 'effect_slot'), 'vortex_achievement_info_line_xml', 0, 0, (r) => { text(r, 'info_title', 'Affiché sur votre profil'); text(r, 'info_desc', 'Ce badge est visible par les autres joueurs sur votre profil.'); icon(r, 'info_icon', I.home); tint(r, 'info_icon', 0xd8a060); });
}
else if(TAB === 'tab_collections')
{
    categories(find(t, 'category_list'), [['Objets rares', '12 / 45', I.collection, 0xb08050], ['Monstres', '28 / 92', I.beast, 0xd23a2a], ['Ressources', '18 / 68', I.tree, 0x40b030], ['Événements', '14 / 52', I.event, 0xd23a2a], ['Cosmétiques', '20 / 84', I.shirt, 0x8a3ad0], ['Lieux', '16 / 60', I.world, 0x40b0e0], ['Montures', '8 / 36', I.horse, 0xb08050], ['Saisonnier', '10 / 40', I.snow, 0x40b0e0]], 0);
    text(t, 'list_title', 'Collections d’objets rares (12 / 45)');
    const list = find(t, 'collection_list');
    for(const [name, desc, prog, px, pct, key, uri, c, sel] of [['Trésors oubliés', 'Retrouvez les reliques perdues des anciennes civilisations d’Ambre.', '5 / 8', 209, '62 %', 'common', I.crown, 0xf0c030, true], ['Artéfacts royaux', 'Objets appartenant aux anciennes lignées royales.', '3 / 10', 100, '30 %', 'rare', I.book, 0x40b030], ['Pierres mystiques', 'Cristaux et gemmes aux pouvoirs exceptionnels.', '7 / 15', 156, '47 %', 'epic', I.rare, 0x8a3ad0], ['Reliques des explorateurs', 'Souvenirs des plus grands explorateurs d’Ambre.', '6 / 8', 250, '75 %', 'common', I.quest, 0xd8a060], ['Objets légendaires', 'Objets uniques aux histoires fascinantes.', '2 / 12', 56, '17 %', 'legendary', I.lantern, 0xf0c030]])
        add(list, 'vortex_achievement_collection_row_xml', (r) => { text(r, 'collection_name', name); text(r, 'collection_desc', desc); text(r, 'points', prog); bar(r, 'progress', px); text(r, 'percent_txt', pct); icon(r, 'collection_icon', uri); tint(r, 'collection_icon', c); show(r, 'selected', !!sel); });
    const recent = find(t, 'recent_list');
    for(const [name, count, pct, uri, c] of [['Trésors oubliés', '5 / 8', '62 %', I.crown, 0xf0c030], ['Reliques', '6 / 8', '75 %', I.quest, 0xd8a060], ['Pierres', '7 / 15', '47 %', I.rare, 0x8a3ad0]]) add(recent, 'vortex_achievement_collection_tile_xml', (r) => { text(r, 'collection_name', name); text(r, 'collection_count', count); text(r, 'collection_pct', pct); icon(r, 'collection_icon', uri); tint(r, 'collection_icon', c); });
    const d = find(t, 'collection_detail');
    icon(d, 'detail_icon', I.crown); tint(d, 'detail_icon', 0xf0c030); text(d, 'detail_name', 'Trésors oubliés'); text(d, 'detail_desc', 'Retrouvez les reliques perdues des anciennes civilisations d’Ambre.');
    text(d, 'detail_lore', 'Ces objets antiques témoignent d’un passé mystérieux et fascinant.'); bar(d, 'detail_progress', 165); text(find(d, 'detail_progress'), 'points', '5 / 8'); text(d, 'detail_pct', '62 %');
    const grid = find(d, 'item_grid');
    for(const [uri, found, sel] of [['rpg/dungeon-objects/icon_20', true], ['rpg/gems-materials/icon_12', true], ['rpg/dungeon-objects/icon_25', true], ['rpg/gems-materials/icon_09', true, true], ['rpg/dungeon-objects/icon_37', true], [I.question, false], [I.question, false], [I.question, false]]) add(grid, 'vortex_achievement_collection_item_xml', (it) => { icon(it, 'item_icon', uri); show(it, 'found_icon', found); if(!found) tint(it, 'item_icon', 0x8a94a0); if(sel) tint(it, null, 0xffd890); });
    text(d, 'found_count', '5 objets trouvés sur 8');
    icon(d, 'reward_icon', I.collection); tint(d, 'reward_icon', 0xb08050); text(d, 'reward_name', 'Coffre des civilisations'); text(d, 'reward_desc', 'Débloque un coffre spécial contenant un objet cosmétique exclusif.'); tint(d, 'claim_button', 0x9a9a9a); text(d, 'claim_button', 'À compléter');
}
else
{
    categories(find(t, 'category_list'), [['Tous', '6 / 18', I.star, 0xf0c030], ['Aventure', '2 / 4', I.explore, 0xd8a060], ['Exploration', '1 / 3', I.world, 0x40b0e0], ['Combat', '1 / 3', I.sword, 0xd23a2a], ['Social', '1 / 2', I.social, 0x2a8fd6], ['Événements', '1 / 3', I.event, 0xd23a2a], ['Collection', '1 / 4', I.collection, 0xb08050], ['Secrets', '0 / 2', I.secret, 0x8a3ad0]], 0);
    text(t, 'list_title', 'Titres (6 / 18)'); text(t, 'rarity_filter', 'Toutes les raretés');
    const list = find(t, 'title_list');
    for(const [name, desc, key, uri, c, active, sel] of [['Explorateur d’Ambre', 'Visiter 5 zones différentes d’Ambre.', 'common', I.explore, 0xd8a060, true, true], ['Ami du Peuple', 'Ajouter 10 amis à votre liste.', 'rare', I.handshake, 0x40b030], ['Héros des Catacombes', 'Terminer toutes les catacombes d’Ambre.', 'epic', I.skull, 0x8a94a0], ['Maître des Ruines', 'Découvrir toutes les ruines anciennes.', 'legendary', I.crown, 0xf0c030], ['Grand Voyageur', 'Visiter 20 zones différentes.', 'rare', I.boots, 0xb08050], ['Artisan d’Ambre', 'Atteindre le niveau 50 dans un métier.', 'common', I.job, 0x8a94a0]])
        add(list, 'vortex_achievement_title_row_xml', (r) => { text(r, 'title_name', name); find(r, 'title_name').width = 160; rarity(r, 'rarity_pill', key); text(r, 'title_desc', desc); icon(r, 'title_emblem', uri); tint(r, 'title_emblem', c); show(r, 'active_pill', !!active); show(r, 'selected', !!sel); });
    const d = find(t, 'title_detail');
    icon(d, 'title_emblem', I.explore); tint(d, 'title_emblem', 0xd8a060); text(d, 'title_name', 'Explorateur d’Ambre'); rarity(d, 'rarity_pill', 'common'); text(d, 'title_desc', 'Un voyageur curieux qui parcourt les terres d’Ambre à la recherche de nouveaux horizons.');
    text(d, 'condition_txt', 'Visiter 5 zones différentes d’Ambre.'); bar(d, 'condition_progress', 290); text(find(d, 'condition_progress'), 'points', '5 / 5');
    place(find(d, 'reward_slot'), 'vortex_achievement_info_line_xml', 0, 0, (r) => { text(r, 'info_title', 'Affiché au-dessus de votre nom'); text(r, 'info_desc', 'Dans le jeu et dans le chat.'); icon(r, 'info_icon', I.chat); tint(r, 'info_icon', 0x2a8fd6); });
    place(find(d, 'effect_slot'), 'vortex_achievement_info_line_xml', 0, 0, (r) => { text(r, 'info_title', '+5 % d’expérience sur l’exploration'); text(r, 'info_desc', 'Tant que le titre est actif.'); icon(r, 'info_icon', I.star); tint(r, 'info_icon', 0xf0c030); });
}
