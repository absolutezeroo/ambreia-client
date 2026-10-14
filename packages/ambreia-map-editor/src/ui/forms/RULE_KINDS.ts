/**
 * The sorts of condition and action, their label, their defaults, and whether they need the RPG
 * systems (plan D11–D13: those are saved and validated but do nothing until the RPG exists).
 */
export const RULE_KINDS: Readonly<Record<'conditions' | 'actions', readonly {readonly kind: string; readonly label: string; readonly rpg: boolean; readonly defaults: Readonly<Record<string, unknown>>}[]>> = {
    conditions: [
        {kind: 'TimeOfDay', label: 'Heure', rpg: false, defaults: {kind: 'TimeOfDay', from: 8, to: 20}},
        {kind: 'ZoneActive', label: 'Aire active', rpg: false, defaults: {kind: 'ZoneActive', zone: ''}},
        {kind: 'PlayerLevel', label: 'Niveau du joueur', rpg: true, defaults: {kind: 'PlayerLevel', min: 1, max: 200}},
        {kind: 'QuestState', label: 'État de quête', rpg: false, defaults: {kind: 'QuestState', quest: '', state: 'active'}},
        {kind: 'HasItem', label: 'Possède un objet', rpg: true, defaults: {kind: 'HasItem', item: '', count: 1}},
        {kind: 'Faction', label: 'Faction', rpg: true, defaults: {kind: 'Faction', faction: ''}}
    ],
    actions: [
        {kind: 'ShowDialogue', label: 'Afficher un message', rpg: false, defaults: {kind: 'ShowDialogue', dialogue: ''}},
        {kind: 'Teleport', label: 'Téléporter', rpg: false, defaults: {kind: 'Teleport', zone: '', entry: ''}},
        {kind: 'OpenDoor', label: 'Ouvrir une porte', rpg: false, defaults: {kind: 'OpenDoor', decor: ''}},
        {kind: 'ActivateZone', label: 'Activer une aire', rpg: false, defaults: {kind: 'ActivateZone', zone: ''}},
        {kind: 'DeactivateZone', label: 'Désactiver une aire', rpg: false, defaults: {kind: 'DeactivateZone', zone: ''}},
        {kind: 'PlaySound', label: 'Jouer un son', rpg: false, defaults: {kind: 'PlaySound', sound: ''}},
        {kind: 'StartQuest', label: 'Démarrer une quête', rpg: false, defaults: {kind: 'StartQuest', quest: ''}},
        {kind: 'SpawnGroup', label: 'Faire apparaître', rpg: true, defaults: {kind: 'SpawnGroup', spawn: ''}}
    ]
};
