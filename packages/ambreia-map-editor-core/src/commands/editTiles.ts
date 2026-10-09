import type {ZoneCell, ZoneDocument, ZoneTile} from '../zone/Zone.generated';
import {inside, MAX_SIZE, MAX_TILE_HEIGHT, tileIndex} from '../zone/zoneGeometry';
import type {IEditorCommand} from './IEditorCommand';
import {resizeFloor} from './resizeFloor';

/** What lies past the floor's far edges, and what a grown floor holds where nothing was painted. */
const VOID: ZoneTile = {hole: true};

/**
 * Rewrites the given cells with change: raise, lower, dig a hole, mark walkable… One command for
 * one stroke of a floor tool, however many cells it covers. Heights stay within 0..32. A change
 * that puts floor on a cell past the far edges grows the floor to it (up to MAX_SIZE).
 */
export const editTiles = (
    label: string,
    cells: Iterable<ZoneCell>,
    change: (tile: ZoneTile) => ZoneTile
): IEditorCommand =>
{
    const list = [...cells];

    return {
        label,
        apply: input =>
        {
            const doc = grow(input, list, change);
            const floor = doc.floor;
            let tiles: ZoneTile[] | null = null;

            for(const {x = 0, y = 0} of list)
            {
                if(!inside(floor, x, y)) continue;

                const i = tileIndex(floor, x, y);
                const before = (tiles ?? floor.tiles)[i];
                const after = change(before);
                const height = Math.min(MAX_TILE_HEIGHT, Math.max(0, after.height ?? 0));
                const clamped = (after.height ?? 0) === height ? after : {...after, height};

                if(sameTile(before, clamped)) continue;

                tiles ??= [...floor.tiles];
                tiles[i] = clamped;
            }

            return tiles ? {...doc, floor: {...floor, tiles}} : input;
        }
    };
};

function grow(doc: ZoneDocument, cells: ZoneCell[], change: (tile: ZoneTile) => ZoneTile): ZoneDocument
{
    if(change(VOID).hole ?? false) return doc;

    let width = doc.floor.width;
    let length = doc.floor.length;

    for(const {x = 0, y = 0} of cells)
    {
        if(x < 0 || y < 0 || x >= MAX_SIZE || y >= MAX_SIZE) continue;

        width = Math.max(width, x + 1);
        length = Math.max(length, y + 1);
    }

    return resizeFloor(width, length, VOID).apply(doc);
}

const sameTile = (a: ZoneTile, b: ZoneTile): boolean =>
    (a.height ?? 0) === (b.height ?? 0)
    && (a.walkable ?? true) === (b.walkable ?? true)
    && (a.hole ?? false) === (b.hole ?? false)
    && (a.zone ?? null) === (b.zone ?? null)
    && (a.note ?? null) === (b.note ?? null);
