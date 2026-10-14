const UI = 'rpg/ui-icons/';

/** A quest ready to hand in. */
export const QUEST_READY_ICON = `${UI}software_speech_bubble_question_mark_quest_return_finished_icon`;

const DEFAULT_ICON = `${UI}tools_crafting_writing_parchment_scroll_document_icon`;

const BY_KIND: Readonly<Record<string, string>> = {
    kill: `${UI}rpg_crossed_swords_duel_pvp_combat_battle_war_icon`,
    talk: `${UI}software_speech_bubble_three_dots_dialogue_icon`,
    reach: `${UI}map_markers_location_pin_big_icon`,
    interact: `${UI}emoji_hand_pointer_cursor_link_index_finger_icon`,
    collect: `${UI}map_markers_building_treasure_pot_of_gold_luck_icon`
};

/** An objective's icon by its kind; a kind the client does not know yet has the scroll. */
export function objectiveIcon(kind: string): string
{
    return BY_KIND[kind] ?? DEFAULT_ICON;
}
