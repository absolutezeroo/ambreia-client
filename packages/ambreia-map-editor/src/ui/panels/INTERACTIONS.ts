/**
 * What a zone furni does when a player uses it (plan D10), as (value, label). The server's
 * ZoneInteractionModule gives each its effect; "" leaves the furni's own logic.
 */
export const INTERACTIONS: readonly (readonly [string, string])[] = [
    ['', 'Aucune (logique du mobi)'],
    ['door', 'Porte (ouvre / ferme)'],
    ['lever', 'Levier (bascule)'],
    ['sign', 'Panneau (affiche le tag)'],
    ['teleport', 'Téléporteur'],
    ['sit', 'S\'asseoir'],
    ['use', 'Utiliser']
];
