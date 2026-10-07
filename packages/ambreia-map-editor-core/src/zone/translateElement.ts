import type {ZoneCell, ZoneFloor} from './Zone.generated';
import {inside} from './zoneGeometry';

const SHIFTED = ['cell', 'spawn'] as const;
const SHIFTED_LISTS = ['area', 'polygon', 'arena', 'adds'] as const;

/** The element moved by (dx, dy): every point it has; unchanged when a point would leave the floor. */
export function translateElement<T extends object>(element: T, dx: number, dy: number, floor: ZoneFloor): T
{
    const e = element as Record<string, unknown>;
    const move = (c: ZoneCell): ZoneCell => ({x: (c.x ?? 0) + dx, y: (c.y ?? 0) + dy});
    const next: Record<string, unknown> = {...e};
    const points: ZoneCell[] = [];

    for(const key of SHIFTED)
    {
        if(e[key]) points.push(next[key] = move(e[key] as ZoneCell));
    }

    for(const key of SHIFTED_LISTS)
    {
        if(Array.isArray(e[key])) points.push(...(next[key] = (e[key] as ZoneCell[]).map(move)) as ZoneCell[]);
    }

    if((dx === 0 && dy === 0) || !points.length || points.some(p => !inside(floor, p.x ?? 0, p.y ?? 0))) return element;

    return next as T;
}
