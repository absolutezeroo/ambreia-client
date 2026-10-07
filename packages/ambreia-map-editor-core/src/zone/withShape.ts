import {cellsInPolygon} from './cellsInPolygon';
import type {LayerItem} from './LayerItem';
import type {LayerKey} from './LayerKey';
import type {ZoneCell, ZoneFloor} from './Zone.generated';

/**
 * The element given a drawn shape (the corners of a rectangle, or a polygon's points): an area
 * keeps the polygon itself; spawns, passages, events and boss arenas take the cells inside it;
 * a one-cell element takes the first point.
 */
export function withShape<K extends LayerKey>(layer: K, element: LayerItem<K>, points: readonly ZoneCell[], floor: ZoneFloor): LayerItem<K>
{
    if(!points.length) return element;

    const cells = () => cellsInPolygon(points, floor.width, floor.length);

    switch(layer)
    {
        case 'zones': return {...element, polygon: [...points]};
        case 'spawns':
        case 'passages':
        case 'events': return {...element, area: cells()};
        case 'bosses': return {...element, arena: cells()};
        case 'entries':
        case 'npcs':
        case 'resources': return {...element, cell: points[0]};
        default: return element;
    }
}
