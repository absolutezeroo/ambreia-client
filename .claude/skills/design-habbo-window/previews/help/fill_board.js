// Fills the "États – Outils joueur, aide et sécurité" board (states_help.xml).
const at = (name) => find(root, name);
const U = 'rpg/ui-icons/';
const K = {
    heart: U + 'cosmetics_lips_lipstick_kiss_heart_icon', mana: U + 'alchemy_potion_vial_bottle_star_mana_full_icon', sword: U + 'rpg_item_weapon_sword_attack_melee_slashing_damage_icon', def: U + 'boardgames_card_defense_shield_icon',
    boots: U + 'rpg_stat_dexterity_agility_boots_movement_speed_icon', clover: U + 'rpg_stat_luck_four_leaf_clover_icon', star: U + 'boardgames_card_star_icon', swords: U + 'rpg_crossed_swords_duel_pvp_combat_battle_war_icon',
    skull: U + 'rpg_skull_death_dead_small_icon', hammer: U + 'rpg_item_weapon_hammer_mace_crushing_damage_icon', coin: U + 'rpg_coin_gold_currency_money_gp_icon', stats: U + 'rpg_stat_strength_fist_melee_attack_icon',
    gift: U + 'rpg_gift_present_icon', lamp: U + 'software_warning_sign_circle_exclaimation_mark_error_icon', group: U + 'travel_person_people_three_icon', gear: U + 'software_options_settings_cogwheel_gear_mechanics_icon',
    mail: U + 'software_email_message_read_opened_icon', check: U + 'software_signs_checkmark_checkbox_ticked_todo_icon', x: U + 'software_signs_maths_multiplication_x_crossout_checkmark_cancel_icon', warn: U + 'software_warning_sign_triangle_exclaimation_mark_error_icon',
    gem: U + 'rpg_gem_jewelcrafting_diamond_points_currency_icon', chest: U + 'tools_crafting_chest_locked_loot_icon',
};

// 1. guide and codex
place(at('guide'), 'vortex_help_guide_xml', 0, 0, (g) => {
    ['welcome', 'move', 'talk', 'quests', 'inventory', 'services'].forEach((k, i) => add(find(g, 'step_list'), 'vortex_help_step_row_xml', (r) => { text(r, 'step_number', String(i + 1)); text(r, 'step_label', `\${vortex.help.step.${k}}`); if(i === 0) { show(r, 'selected'); tint(r, 'step_ring', 0x2a6aa0); tcolor(r, 'step_number', 0xffffff); } }));
    const layer = find(g, 'callout_layer');
    [['Parlez aux PNJ pour obtenir des quêtes, des informations et des services.', 12, 12, 240], ['Les quêtes actives sont affichées ici.', 270, 70, 156], ['Utilisez les touches ZQSD pour vous déplacer dans le monde.', 100, 240, 250]].forEach(([t, x, y, w]) => place(layer, 'vortex_help_callout_xml', x, y, (c) => { c.width = w; find(c, 'callout_txt').width = w - 34; text(c, 'callout_txt', t); }));
    [0, 1, 2, 3, 4].forEach((i) => add(find(g, 'page_dots'), 'vortex_help_dot_xml', (d) => { if(i === 0) tint(d, 'dot', 0x8ab8ff); }));
    show(g, 'previous_button', false);
});
place(at('codex'), 'vortex_codex_xml', 0, 0, (c) => {
    [['stats', K.stats, 0xe09a60], ['rarity', K.star, 0xf0c030], ['roles', K.swords, 0x6a6a72], ['status', K.skull, 0xd23a2a], ['jobs', K.hammer, 0x8a94a0], ['currencies', K.coin, 0xf0c030]].forEach(([k, uri, col]) => add(find(c, 'category_list'), 'vortex_codex_category_row_xml', (r) => { text(r, 'category_name', `\${vortex.help.codex.${k}}`); icon(r, 'category_icon', uri); tint(r, 'category_icon', col); show(r, 'selected', k === 'stats'); }));
    text(c, 'section_title', 'Statistiques du personnage'); text(c, 'section_desc', 'Les statistiques influencent directement vos performances en jeu.');
    for(const [n, d, uri, col] of [['Points de vie (PV)', 'Détermine votre survie au combat.', K.heart, 0xd04040], ['Points de mana (PM)', 'Utilisés pour vos aptitudes.', K.mana, 0x4080d0], ['Attaque (ATT)', 'Augmente les dégâts infligés.', K.sword, 0x8a94a0],
        ['Défense (DÉF)', 'Réduit les dégâts subis.', K.def, 0x6090c0], ['Vitesse (VIT)', 'Influence l’ordre des actions.', K.boots, 0xb07840], ['Chance (CHA)', 'Augmente les chances de succès et les récompenses.', K.clover, 0x40b030]])
        add(find(c, 'entry_list'), 'vortex_codex_entry_row_xml', (r) => { text(r, 'entry_name', n); text(r, 'entry_desc', d); icon(r, 'entry_icon', uri); tint(r, 'entry_icon', col); });
});

// 2. report, reconnect, afk, notifications
place(at('report'), 'vortex_report_xml', 0, 0, (r) => {
    ['spam', 'harassment', 'cheat', 'name', 'other'].forEach((k, i) => add(find(r, 'reason_list'), 'vortex_report_reason_row_xml', (x) => { text(x, 'reason_txt', `\${vortex.help.reason.${k}}`); show(x, 'radio_dot', i === 0); if(i === 0) tint(x, 'radio_ring', 0xd8e8ff); }));
});
place(at('reconnect'), 'vortex_reconnect_xml', 0, 0, (w) => { text(w, 'retry_txt', 'Reconnexion dans 8 secondes…'); bar(w, 'retry_bar', 62); });
place(at('afk'), 'vortex_afk_xml', 0, 0, (w) => { text(w, 'afk_timer', '05 min 23'); text(w, 'afk_desc', 'Pour votre sécurité, vous serez déconnecté automatiquement dans 10 minutes.'); });
place(at('notifications'), 'vortex_notifications_xml', 0, 0, (n) => {
    let x = 0; [['Toutes (12)', 96], ['Système (4)', 92], ['Quêtes (3)', 86], ['Social (3)', 82], ['Récompenses (2)', 120]].forEach(([t, w], i) => { place(find(n, 'filter_bar'), 'vortex_hud_chip_xml', x, 0, (c) => { c.width = w; find(c, 'chip_txt').width = w; text(c, 'chip_txt', t); if(i === 0) tint(c, null, 0x2a6aa0); }); x += w + 6; });
    for(const [t, time, uri, col, unread] of [['Vous avez obtenu : Minerai de Fer x5', 'Il y a 2 min', K.gift, 0xd8a030, true], ['Nouvelle quête disponible : Un travail urgent', 'Il y a 5 min', K.lamp, 0xf0c030, true], ['Léa vous a envoyé un message.', 'Il y a 12 min', K.group, 0x2a8fd6, false],
        ['Maintenance terminée. Les serveurs sont de nouveau en ligne.', 'Il y a 1 h', K.gear, 0x6a6a72, false], ['Vous avez vendu 3x Bois d’Ambre pour 75 pièces.', 'Il y a 2 h', K.coin, 0xf0c030, false], ['Votre signalement a été pris en compte.', 'Il y a 3 h', K.mail, 0x6a6a72, false]])
        add(find(n, 'notification_list'), 'vortex_notification_row_xml', (r) => { text(r, 'notification_txt', t); text(r, 'notification_time', time); icon(r, 'notification_icon', uri); tint(r, 'notification_icon', col); show(r, 'unread_dot', unread); });
});

// 3. components
place(at('banner'), 'vortex_hud_alert_xml', 0, 0, (a) => text(a, 'alert_txt', 'Terminez d’abord la quête précédente.'));
const toast = (slotName, c, title, body, uri) => place(at(slotName), 'vortex_hud_toast_xml', 0, 0, (t) => { tint(t, 'toast_frame', c); text(t, 'toast_title', title); text(t, 'toast_txt', body); icon(t, 'toast_icon', uri); tint(t, 'toast_icon', 0xffffff); icon(t, 'toast_mark', K.x); tint(t, 'toast_mark', 0xffffff); });
toast('toast_ok', 0x2f7a2f, 'Quête acceptée !', 'Elle a été ajoutée à votre journal.', K.check);
toast('toast_err', 0x8a2a2a, 'Impossible d’effectuer cette action.', 'Veuillez réessayer plus tard.', K.x);
place(at('confirm'), 'vortex_ui_confirm_xml', 0, 0, (c) => text(c, 'message', 'Êtes-vous sûr de vouloir utiliser cet objet ?'));
place(at('hint'), 'vortex_ui_hint_xml', 0, 0, (h) => text(h, 'hint_txt', '${vortex.help.unavailable}'));
place(at('tip'), 'vortex_inventory_tip_xml', 0, 0, (t) => { icon(t, 'tip_icon', K.gem); tint(t, 'tip_icon', 0x3a90e0); text(t, 'tip_name', 'Minerai de Fer'); text(t, 'tip_kind', 'Ressource'); text(t, 'tip_rarity', ''); text(t, 'tip_desc', 'Un minerai commun utilisé pour la forge.'); text(t, 'tip_quantity', 'Valeur : 25'); });
place(at('list_row'), 'vortex_npc_choice_row_xml', 0, 0, (r) => { r.width = 370; text(r, 'choice_txt', 'Coffre mystérieux · récompense rare'); icon(r, 'choice_icon', K.chest); tint(r, 'choice_icon', 0xb07840); });
