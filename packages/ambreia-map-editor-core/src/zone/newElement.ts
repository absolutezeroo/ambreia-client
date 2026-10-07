import {LAYER_ID_PREFIX} from './LAYER_ID_PREFIX';
import type {LayerItem} from './LayerItem';
import type {LayerKey} from './LayerKey';
import type {ZoneCell, ZoneDocument} from './Zone.generated';
import {nextId} from './zoneGeometry';

/**
 * A new element of the layer, placed on cell, with the defaults the editor offers. The fields a
 * designer must fill (monster, template, destination…) start empty: validation names them.
 */
export function newElement<K extends LayerKey>(layer: K, doc: ZoneDocument, cell: ZoneCell): LayerItem<K>
{
    const id = nextId(doc, LAYER_ID_PREFIX[layer]);
    const x = cell.x ?? 0;
    const y = cell.y ?? 0;
    const here = {x, y};
    // A 3 × 3 square from the cell, kept on the floor: an area needs three points at least.
    const x2 = Math.min(doc.floor.width - 1, x + 2);
    const y2 = Math.min(doc.floor.length - 1, y + 2);
    const square = [{x, y}, {x: x2, y}, {x: x2, y: y2}, {x, y: y2}];
    const elements: {[L in LayerKey]: LayerItem<L>} = {
        entries: {id, kind: 'arrival', cell: here, direction: 2},
        passages: {id, area: [here], destinationZone: doc.settings.id, destinationEntry: ''},
        zones: {id, kind: 'Safe', name: '', polygon: square, priority: 0},
        npcs: {id, template: '', name: '', cell: here, rotation: 2, interactions: ['talk']},
        spawns: {id, area: [here], monster: '', min: 1, max: 3, respawnSeconds: 30, wanderRadius: 3, aggroRadius: 5, levelMin: 1, levelMax: 5},
        resources: {id, cell: here, template: ''},
        chests: {id, decor: '', lootTable: ''},
        interactives: {id, decor: '', interaction: 'door'},
        bosses: {id, arena: [here], encounter: '', spawn: here},
        events: {id, area: [here], definition: ''},
        triggers: {id, type: 'EnterZone', target: null, conditions: [], actions: [], cooldownMs: 0, active: true}
    };

    return elements[layer];
}
