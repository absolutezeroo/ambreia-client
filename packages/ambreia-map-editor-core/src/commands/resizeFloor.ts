import type {ZoneTile} from '../zone/Zone.generated';
import {MAX_SIZE} from '../zone/zoneGeometry';
import type {IEditorCommand} from './IEditorCommand';

/** Grows or crops the floor from its far edges: the cells that remain keep their tiles. */
export const resizeFloor = (width: number, length: number): IEditorCommand => ({
    label: `Sol ${width}×${length}`,
    apply: doc =>
    {
        const floor = doc.floor;
        const w = Math.min(MAX_SIZE, Math.max(1, Math.trunc(width)));
        const l = Math.min(MAX_SIZE, Math.max(1, Math.trunc(length)));

        if(w === floor.width && l === floor.length) return doc;

        const tiles: ZoneTile[] = [];

        for(let y = 0; y < l; y++)
        {
            for(let x = 0; x < w; x++)
            {
                tiles.push(x < floor.width && y < floor.length ? floor.tiles[y * floor.width + x] : {});
            }
        }

        return {...doc, floor: {...floor, width: w, length: l, tiles}};
    }
});
