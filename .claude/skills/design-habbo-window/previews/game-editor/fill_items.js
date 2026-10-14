// Objets (sheet b8798f13) in the rail's « Objets » entry: item library, the item's sheet in the view
// (art, identity, equipment preview, stats, affixes, sockets, art sets), its form, its sources below.
const RAIL = 'items';
// @include fill_common.js
const W_ = (n) => A('weapons', n), AR = (n) => A('armor', n);
const RAR = {common: 0x9a9a9a, uncommon: 0x4cc040, rare: 0x2a8fd6, epic: 0x9a4ad0, legendary: 0xe0a020};
library('Objets', [
    ['Tous (128)', U + 'tools_crafting_writing_parchment_scroll_document_icon', 0xc89040], ['Armes (28)', U + 'rpg_item_weapon_sword_attack_melee_slashing_damage_icon', 0x8a94a0], ['Armures (22)', U + 'rpg_item_armor_equipment_slot_chest_breastplate_body_icon', 0x6a7a90],
    ['Boucliers (14)', U + 'rpg_difficulty_3_medium_buckler_targe_shield_icon', 0x4a7ad0], ['Accessoires (18)', U + 'rpg_item_accessory_trinket_equipment_slot_finger_ring_jewelry_icon', 0xe0a020], ['Consommables (25)', U + 'alchemy_potion_vial_bottle_heart_health_life_full_icon', 0xd03030],
    ['Quête (12)', U + 'tools_crafting_writing_parchment_scroll_document_sealed_icon', 0xc08040], ['Cosmétiques (10)', U + 'hats_wizard_mage_magician_sorcerer_icon', 0x9a4ad0],
], [
    ['Épée du voyageur', 'Arme (épée à une main)', 'Niv. 1', RAR.uncommon, W_(2)], ['Casque de fer', 'Armure (casque)', 'Niv. 4', RAR.uncommon, AR(2)], ['Arc des forêts', 'Arme (arc)', 'Niv. 12', RAR.epic, W_(9)],
    ['Bouclier royal', 'Bouclier', 'Niv. 15', RAR.legendary, AR(7)], ['Armure du garde', 'Armure (torse)', 'Niv. 20', RAR.epic, AR(8)], ['Bottes de cuir', 'Armure (pieds)', 'Niv. 3', RAR.common, AR(17)],
    ['Épée solaire', 'Arme (épée à une main)', 'Niv. 25', RAR.legendary, W_(46)], ['Lame de givre', 'Arme (épée)', 'Niv. 18', RAR.rare, W_(51)],
]);
// the view shows the item itself: the zone's view tools do not apply
const s = viewport('item_sheet');
icon(s, 'item_art', W_(2)); text(s, 'item_name', 'Épée du voyageur'); text(s, 'rarity_txt', 'Peu commune'); text(s, 'level_txt', 'Niveau 1');
text(s, 'item_desc', 'Une épée simple mais fiable, souvent choisie par ceux qui quittent leur village pour la première fois. Légère et équilibrée, elle accompagne de nombreux aventuriers dans leurs premiers pas.');
[2, 51, 27, 42].forEach((n, i) => add(find(s, 'variant_list'), P + 'icon_slot_xml', (v) => { icon(v, 'slot_icon', W_(n)); show(v, 'selected', i === 0); }));
const SLOT_ICON = {head: 'rpg_item_armor_equipment_slot_head_helmet', amulet: 'rpg_item_accessory_trinket_equipment_slot_finger_ring_jewelry', cape: 'rpg_item_accessory_armor_equipment_slot_cape_cloak_clothing', shield: 'rpg_difficulty_3_medium_buckler_targe_shield', ring1: 'rpg_item_accessory_trinket_equipment_slot_finger_ring_jewelry', ring2: 'rpg_item_accessory_trinket_equipment_slot_finger_ring_jewelry', chest: 'rpg_item_armor_equipment_slot_chest_breastplate_body', feet: 'rpg_item_armor_equipment_slot_feet_boots_legplates', gloves: 'rpg_item_armor_equipment_slot_hands_gloves_gauntlets'};
for(const [k, n] of Object.entries(SLOT_ICON)) { show(s, `slot_${k}_icon`); icon(s, `slot_${k}_icon`, `${U}${n}_icon`); tint(s, `slot_${k}_icon`, 0x6a7a90); }
show(s, 'slot_weapon_icon'); icon(s, 'slot_weapon_icon', W_(2)); tint(s, 'slot_weapon', 0x2f9e2f);
for(const [uri, l, v] of [[U + 'rpg_item_weapon_sword_attack_melee_slashing_damage_icon', 'Attaque', '12'], [U + 'rpg_item_stat_shield_defense_armor_icon', 'Défense', '0'], [U + 'rpg_stat_dexterity_agility_boots_movement_speed_icon', 'Vitesse', '0'], [U + 'rpg_spell_skill_magic_explosive_explosion_icon', 'Critique', '5 %'],
    [U + 'rpg_stat_intelligence_intellect_brain_wisdom_thinking_iq_icon', 'Intelligence', '0'], [U + 'sports_fitness_dumbbell_weights_1_icon', 'Poids', '2.0'], [IC.coin, 'Valeur de base', '150'], [U + 'software_options_settings_tools_mechanics_wrench_bolt_icon', 'Durabilité', '100 / 100']])
    add(find(s, 'stat_list'), P + 'stat_row_xml', (r) => { icon(r, 'stat_icon', uri); tint(r, 'stat_icon', 0x4a5a6a); text(r, 'stat_label', l); text(r, 'stat_value', v); });
for(const [v, n, k] of [['+5', 'Attaque', 'Préfixe'], ['+2 %', 'Vitesse', 'Suffixe']]) add(find(s, 'affix_list'), P + 'affix_row_xml', (r) => { text(r, 'affix_value', v); text(r, 'affix_name', n); text(r, 'affix_kind', k); if(k === 'Suffixe') tint(r, 'kind_box', 0xe8dcf8); });
[true, false, false].forEach((g) => add(find(s, 'socket_list'), P + 'socket_xml', (r) => { if(g) { show(r, 'socket_gem'); tint(r, 'socket_gem', 0x30c040); } }));
[2, 3, 50].forEach((n, i) => add(find(s, 'icon_list'), P + 'icon_slot_xml', (v) => { icon(v, 'slot_icon', W_(n)); show(v, 'selected', i === 0); }));
[2, 13, 51, 10, 38].forEach((n) => add(find(s, 'look_list'), P + 'icon_slot_small_xml', (v) => icon(v, 'slot_icon', W_(n))));
for(const [l, c] of [['Commune', RAR.common], ['Peu commune', RAR.uncommon], ['Rare', RAR.rare], ['Épique', RAR.epic], ['Légendaire', RAR.legendary]])
    add(find(s, 'border_list'), P + 'rarity_slot_xml', (r) => { icon(r, 'slot_icon', W_(2)); tint(r, 'slot_box', c); text(r, 'slot_txt', l); tcolor(r, 'slot_txt', c); });
inspector('Épée du voyageur', [
    F.section('Propriétés de l’objet'),
    F.text('Identifiant', 'item_001'), F.text('Nom', 'Épée du voyageur'), F.area('Description', 'Une épée simple mais fiable…'), F.select('Type', 'Arme'), F.select('Sous-type', 'Épée à une main'),
    F.select('Emplacement', 'Main principale'), F.select('Rareté', 'Peu commune'), F.num('Niveau requis', '1'), F.select('Classe autorisée', 'Toutes les classes'), F.pick('Set', 'Aucun'),
    F.num('Valeur de vente', '150'), F.num('Coût de réparation', '30'), F.num('Durabilité max', '100'),
    F.section('Comportement'),
    F.check('Échangeable'), F.check('Lié au ramassage', false), F.check('Empilable', false), F.check('Apparence débloquée dans la collection'), F.check('Icône animée', false),
    F.section('Métadonnées'),
    F.tags('Étiquettes', ['début', 'épée', 'bas niveau']), F.select('Auteur', 'Équipe design'), F.pick('Créé le', '12/04/2026', IC.calendar), F.pick('Modifié le', '28/04/2026', IC.calendar),
]);
const b = bottom('bottom_item');
for(const [src, type, rate, min, max] of [['Slime vert', 'Monstre', '12 %', '1', '10'], ['Bandit des routes', 'Monstre', '8 %', '3', '12'], ['Coffre de débutant', 'Coffre', '25 %', '1', '1'], ['Marchand itinérant', 'Marchand', '-', '1', '-']])
    add(find(b, 'drops_list'), P + 'drop_row_xml', (r) => { text(r, 'col_source', src); text(r, 'col_type', type); text(r, 'col_rate', rate); text(r, 'col_min', min); text(r, 'col_max', max); });
for(const [rec, job, req] of [['Lame simple', 'Forgeron', '1'], ['Épée du voyageur (améliorée)', 'Forgeron', '10'], ['Arme d’entraînement', 'Forgeron', '1']])
    add(find(b, 'recipes_list'), P + 'recipe_row_xml', (r) => { text(r, 'col_recipe', rec); text(r, 'col_job', job); text(r, 'col_req', req); });
