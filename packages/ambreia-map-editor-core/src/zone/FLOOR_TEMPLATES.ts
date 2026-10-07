import type {IFloorTemplate} from './IFloorTemplate';
import type {ZoneFloor, ZoneTile} from './Zone.generated';

/** A w × l floor whose tile at (x, y) is tile(x, y); the door on the left edge, facing in. */
function floor(w: number, l: number, tile: (x: number, y: number) => ZoneTile, door = {x: 0, y: Math.floor(l / 2)}): ZoneFloor
{
    const tiles: ZoneTile[] = [];

    for(let y = 0; y < l; y++)
    {
        for(let x = 0; x < w; x++) tiles.push(tile(x, y));
    }

    return {width: w, length: l, tiles, door, doorDirection: 2};
}

const flat = () => ({});

/** "Modèles de salle" of the floor panel. */
export const FLOOR_TEMPLATES: readonly IFloorTemplate[] = [
    {label: 'Vide (petite)', build: () => floor(10, 10, flat)},
    {label: 'Vide (moyenne)', build: () => floor(20, 20, flat)},
    {label: 'Vide (grande)', build: () => floor(40, 40, flat)},
    {
        // A sunken ring with raised stands all round; the door cuts through the left stand.
        label: 'Arène',
        build: () => floor(22, 22, (x, y) =>
        {
            const edge = Math.min(x, y, 21 - x, 21 - y);

            return edge < 3 && !(x < 3 && y >= 10 && y <= 11) ? {height: 3 - edge} : {};
        })
    },
    {
        // A lobby with a raised stage at the back, reached by two steps.
        label: 'Lobby',
        build: () => floor(24, 16, (x, y) => (y < 4 && x >= 8 ? {height: 2} : y < 6 && x >= 8 ? {height: 1} : {}))
    },
    {
        // An L-shaped hall: the corner beyond the bend is outside the room.
        label: 'Salle en L',
        build: () => floor(20, 20, (x, y) => (x >= 10 && y >= 10 ? {hole: true} : {}))
    }
];
