import type {ZoneCell, ZoneFloor, ZoneTile} from './Zone.generated';
import {inside, tileAt} from './zoneGeometry';

const kind = (t: ZoneTile | null): string => t ? `${t.hole ? 'h' : ''}${t.height ?? 0}` : '';

/** "Remplir": the cells connected to (x, y) — four neighbours — of the same height and hole state. */
export function fillCells(floor: ZoneFloor, x: number, y: number): ZoneCell[]
{
    const start = tileAt(floor, x, y);

    if(!start) return [];

    const wanted = kind(start);
    const seen = new Set<number>([y * floor.width + x]);
    const queue: ZoneCell[] = [{x, y}];
    const out: ZoneCell[] = [];

    while(queue.length)
    {
        const c = queue.pop()!;

        out.push(c);

        for(const [nx, ny] of [[c.x! + 1, c.y!], [c.x! - 1, c.y!], [c.x!, c.y! + 1], [c.x!, c.y! - 1]])
        {
            const i = ny * floor.width + nx;

            if(!inside(floor, nx, ny) || seen.has(i) || kind(tileAt(floor, nx, ny)) !== wanted) continue;

            seen.add(i);
            queue.push({x: nx, y: ny});
        }
    }

    return out;
}
