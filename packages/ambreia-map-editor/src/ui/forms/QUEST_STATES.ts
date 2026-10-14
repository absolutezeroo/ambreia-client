/** The states a quest rule can test (the server's QuestStatus), as (value, label). */
export const QUEST_STATES: readonly (readonly [string, string])[] = [
    ['active', 'En cours'],
    ['ready', 'À rendre'],
    ['done', 'Terminée']
];
