/**
 * The rail of the owner's layout, top to bottom: one category per layer of the zone document, then
 * (under « Contenu ») the game content edited without a zone: items, VFX, SFX, quests.
 */
export type Category =
    | 'floor'
    | 'walls'
    | 'decor'
    | 'entries'
    | 'passages'
    | 'zones'
    | 'npcs'
    | 'spawns'
    | 'resources'
    | 'chests'
    | 'interactives'
    | 'bosses'
    | 'events'
    | 'triggers'
    | 'ambience'
    | 'settings'
    | 'items'
    | 'vfx'
    | 'sfx'
    | 'quests';
