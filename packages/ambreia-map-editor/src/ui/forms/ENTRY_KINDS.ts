/** The sorts of entry the server knows (plan D4), as (value, label). */
export const ENTRY_KINDS: readonly (readonly [string, string])[] = [
    ['arrival', 'Arrivée (par défaut)'],
    ['respawn', 'Réapparition'],
    ['teleport', 'Arrivée de téléporteur'],
    ['dungeon_entry', 'Entrée de donjon'],
    ['dungeon_return', 'Retour de donjon']
];
