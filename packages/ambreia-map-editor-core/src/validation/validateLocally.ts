import type {ZoneDocument} from '../zone/Zone.generated';
import type {IFootprint} from '../zone/IFootprint';
import {allIds, isWalkable, MAX_SIZE, MAX_TILE_HEIGHT, ROTATIONS, rotatedFootprint, tileAt} from '../zone/zoneGeometry';
import type {IZoneFinding} from './IZoneFinding';

/**
 * The checks the editor can make on its own, with the server's codes, so mistakes show while
 * editing. The server stays the authority: its verdict comes back with each save.
 */
export function validateLocally(
    doc: ZoneDocument,
    sizeOf: (definition: number) => IFootprint | null
): IZoneFinding[]
{
    const f: IZoneFinding[] = [];
    const error = (code: string, elementId: string | null, message: string) =>
        f.push({severity: 'Error', code, elementId, message});
    const floor = doc.floor;

    if(floor.width < 1 || floor.width > MAX_SIZE || floor.length < 1 || floor.length > MAX_SIZE)
    {
        error('FloorTooLarge', null, `Sol ${floor.width}×${floor.length} ; au plus ${MAX_SIZE}×${MAX_SIZE}.`);
    }

    if(floor.tiles.length !== floor.width * floor.length)
    {
        error('FloorTileCount', null, `${floor.tiles.length} cases pour un sol ${floor.width}×${floor.length}.`);

        return f;
    }

    floor.tiles.forEach((t, i) =>
    {
        if((t.height ?? 0) < 0 || (t.height ?? 0) > MAX_TILE_HEIGHT)
        {
            error('TileHeight', null, `Case (${i % floor.width},${Math.floor(i / floor.width)}) : hauteur ${t.height}.`);
        }
    });

    const door = floor.door;

    if(!isWalkable(tileAt(floor, door.x ?? 0, door.y ?? 0)))
    {
        error('DoorNotWalkable', null, `La porte (${door.x},${door.y}) n'est pas sur une case marchable.`);
    }

    const seen = new Set<string>();

    for(const id of allIds(doc))
    {
        if(seen.has(id)) error('DuplicateId', id, `L'id ${id} est utilisé deux fois.`);
        seen.add(id);
    }

    for(const o of doc.decor ?? [])
    {
        if(!(ROTATIONS as readonly number[]).includes(o.rotation ?? 0))
        {
            error('BadRotation', o.id, `Rotation ${o.rotation} ; permises : 0, 2, 4, 6.`);
        }

        const size = sizeOf(o.definition);

        if(!size)
        {
            error('UnknownFurniture', o.id, `Le meuble ${o.definition} (${o.class}) est inconnu.`);
            continue;
        }

        const {width: w, length: l} = rotatedFootprint(size, o.rotation);

        if(o.x < 0 || o.y < 0 || o.x > floor.width - w || o.y > floor.length - l)
        {
            error('OutOfFloor', o.id, `L'emprise ${w}×${l} en (${o.x},${o.y}) sort du sol.`);
        }
    }

    for(const o of doc.wallDecor ?? [])
    {
        if(!tileAt(floor, o.x, o.y)) error('OutOfFloor', o.id, `(${o.x},${o.y}) est hors du sol.`);
    }

    return f;
}
