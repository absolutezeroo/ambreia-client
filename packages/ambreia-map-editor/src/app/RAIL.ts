import type {Category} from './Category';

/** The rail rows of vortex_map_editor_xml, in their order in the layout (its « Contenu » separator is not a row). */
export const RAIL: readonly Category[] = [
    'floor', 'walls', 'decor', 'entries', 'passages', 'zones', 'npcs', 'spawns',
    'resources', 'chests', 'interactives', 'bosses', 'events', 'triggers', 'ambience', 'settings',
    'items', 'vfx', 'sfx', 'quests'
];
