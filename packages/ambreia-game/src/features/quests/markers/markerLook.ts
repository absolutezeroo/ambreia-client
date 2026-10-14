const UI = 'rpg/ui-icons/';
const OFFERED = `${UI}software_speech_bubble_exclaimation_mark_quest_new_icon`;
const RETURN = `${UI}software_speech_bubble_question_mark_quest_return_finished_icon`;

/** What a marker looks like over its NPC (M2a §4.4); null: no marker. */
export function markerLook(marker: string): {icon: string; dim: boolean} | null
{
    switch(marker)
    {
        case 'available': return {icon: OFFERED, dim: false};
        case 'ready': return {icon: RETURN, dim: false};
        case 'active': return {icon: RETURN, dim: true};
        default: return null;
    }
}
