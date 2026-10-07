import {cellsInPolygon} from './cellsInPolygon';
import type {ZoneCell, ZoneDocument} from './Zone.generated';

type Shaped = {cell?: ZoneCell; area?: ZoneCell[]; polygon?: ZoneCell[]; arena?: ZoneCell[]; spawn?: ZoneCell; decor?: string | null};

/**
 * The cells an element of a world layer stands on: its cell, its area, the inside of its polygon,
 * its arena, or the cell of the mobi it is bound to. A trigger has none.
 */
export function elementCells(element: object, doc: ZoneDocument): ZoneCell[]
{
    const e = element as Shaped;

    if(e.polygon) return cellsInPolygon(e.polygon, doc.floor.width, doc.floor.length);
    if(e.area) return e.area;
    if(e.arena) return [...e.arena, ...e.spawn ? [e.spawn] : []];
    if(e.cell) return [e.cell];
    if(e.decor)
    {
        const decor = doc.decor?.find(d => d.id === e.decor);

        return decor ? [{x: decor.x, y: decor.y}] : [];
    }

    return [];
}
