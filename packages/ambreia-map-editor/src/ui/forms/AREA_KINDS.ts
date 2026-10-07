/**
 * The sorts of area (S§20.1), as (value, label); the server's ZoneAreaKinds refuses any other. Safe,
 * Sans combat, PvP and Hostile rule combat (plan D6, D24); Accès restreint lets in only whoever
 * meets the area's conditions, nobody without any.
 */
export const AREA_KINDS: readonly (readonly [string, string])[] = [
    ['Safe', 'Zone sûre'],
    ['NoCombat', 'Sans combat'],
    ['PvP', 'Zone PvP'],
    ['Hostile', 'Zone hostile'],
    ['Restricted', 'Accès restreint'],
    ['NoMount', 'Sans monture'],
    ['Town', 'Ville / quartier'],
    ['Quest', 'Zone de quête'],
    ['Boss', 'Zone de boss'],
    ['Dungeon', 'Donjon'],
    ['Gathering', 'Zone de récolte'],
    ['Audio', 'Ambiance sonore'],
    ['Event', 'Événement'],
    ['Custom', 'Personnalisée']
];
