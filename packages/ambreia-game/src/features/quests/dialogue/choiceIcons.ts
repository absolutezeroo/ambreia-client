const UI = 'rpg/ui-icons/';

const TALK = `${UI}software_speech_bubble_three_dots_dialogue_icon`;

const BY_KIND: Readonly<Record<string, string>> = {
    accept: `${UI}software_speech_bubble_exclaimation_mark_quest_new_icon`,
    complete: `${UI}software_speech_bubble_question_mark_quest_return_finished_icon`
};

/** A choice's icon in the dialogue (vortex_npc_choice_row_xml): a quest taken, handed in, or plain talk. */
export function choiceIcon(kind: string): string
{
    return BY_KIND[kind] ?? TALK;
}
