import type {LayerKey} from '@ambreia/map-editor-core/zone/LayerKey';
import type {Category} from './Category';

/** The document layer a rail category edits, for the categories made of identified elements. */
export const CATEGORY_LAYER: Readonly<Partial<Record<Category, LayerKey>>> = {
    entries: 'entries',
    passages: 'passages',
    zones: 'zones',
    npcs: 'npcs',
    spawns: 'spawns',
    resources: 'resources',
    chests: 'chests',
    interactives: 'interactives',
    bosses: 'bosses',
    events: 'events',
    triggers: 'triggers'
};
