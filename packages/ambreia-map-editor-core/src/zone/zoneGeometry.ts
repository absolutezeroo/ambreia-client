import type {ZoneDocument, ZoneFloor, ZoneTile} from './Zone.generated';
import type {IFootprint} from './IFootprint';

/** Same rules as the server's ZoneDocument. */
export const MAX_SIZE = 64;
export const MAX_TILE_HEIGHT = 32;
export const ROTATIONS = [0, 2, 4, 6] as const;

/** Tiles are row-major: (x, y) is tiles[y * width + x]. */
export const tileIndex = (floor: ZoneFloor, x: number, y: number): number => y * floor.width + x;

export const inside = (floor: ZoneFloor, x: number, y: number): boolean =>
    x >= 0 && y >= 0 && x < floor.width && y < floor.length;

export const tileAt = (floor: ZoneFloor, x: number, y: number): ZoneTile | null =>
    inside(floor, x, y) ? floor.tiles[tileIndex(floor, x, y)] : null;

/** A tile the server treats as walkable (walkable defaults to true). */
export const isWalkable = (tile: ZoneTile | null): boolean =>
    !!tile && !tile.hole && tile.walkable !== false;

/** Rotations 2 and 6 swap width and length, as on the server. */
export const rotatedFootprint = (size: IFootprint, rotation = 0): IFootprint =>
    rotation === 2 || rotation === 6 ? {width: size.length, length: size.width} : size;

/** "throne_3" when throne_1 and throne_2 exist, over every id-bearing layer. */
export function nextId(doc: ZoneDocument, prefix: string): string
{
    const taken = new Set(allIds(doc));
    let n = 1;

    while(taken.has(`${prefix}_${n}`)) n++;

    return `${prefix}_${n}`;
}

/** Every element id of the document, duplicates included. */
export function allIds(doc: ZoneDocument): string[]
{
    const layers = [
        doc.decor, doc.wallDecor, doc.entries, doc.passages, doc.zones, doc.npcs, doc.spawns,
        doc.resources, doc.chests, doc.interactives, doc.bosses, doc.events, doc.triggers, doc.prefabs
    ];

    return layers.flatMap(layer => (layer ?? []).map(e => (e as {id: string}).id));
}
