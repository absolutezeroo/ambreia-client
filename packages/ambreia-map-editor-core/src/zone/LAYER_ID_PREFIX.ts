import type {LayerKey} from './LayerKey';

/** What a new element's id starts with: "npc_3", "spawn_1"… (S§57: stable, readable ids). */
export const LAYER_ID_PREFIX: Readonly<Record<LayerKey, string>> = {
    entries: 'entry',
    passages: 'passage',
    zones: 'area',
    npcs: 'npc',
    spawns: 'spawn',
    resources: 'resource',
    chests: 'chest',
    interactives: 'interactive',
    bosses: 'boss',
    events: 'event',
    triggers: 'trigger'
};
