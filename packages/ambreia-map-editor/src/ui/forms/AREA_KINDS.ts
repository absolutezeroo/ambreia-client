/** The sorts of area (S§20.1), as (value, label): their rules come from plan D6. */
export const AREA_KINDS: readonly (readonly [string, string])[] = [
    ['Safe', 'Zone sûre'],
    ['PvP', 'Zone PvP'],
    ['Town', 'Ville / quartier'],
    ['Quest', 'Zone de quête'],
    ['Boss', 'Zone de boss'],
    ['Dungeon', 'Donjon'],
    ['NoCombat', 'Sans combat'],
    ['Custom', 'Personnalisée']
];
