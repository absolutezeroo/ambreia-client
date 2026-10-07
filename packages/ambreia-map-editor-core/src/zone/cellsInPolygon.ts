import type {ZoneCell} from './Zone.generated';

/** Is (px, py) on the segment a–b? */
function onSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): boolean
{
    const cross = (bx - ax) * (py - ay) - (by - ay) * (px - ax);

    return cross === 0 && px >= Math.min(ax, bx) && px <= Math.max(ax, bx) && py >= Math.min(ay, by) && py <= Math.max(ay, by);
}

/**
 * The cells of a width × length floor that a polygon of cell positions covers, its edges and
 * corners included: an area drawn from (1,1) to (3,3) covers the nine cells, not four.
 */
export function cellsInPolygon(points: readonly ZoneCell[], width: number, length: number): ZoneCell[]
{
    const pts = points.map(p => [p.x ?? 0, p.y ?? 0] as const);
    const out: ZoneCell[] = [];

    if(pts.length === 0) return out;

    for(let y = 0; y < length; y++)
    {
        for(let x = 0; x < width; x++)
        {
            let inside = false;
            let edge = false;

            for(let i = 0, j = pts.length - 1; i < pts.length; j = i++)
            {
                const [xi, yi] = pts[i];
                const [xj, yj] = pts[j];

                if(onSegment(x, y, xi, yi, xj, yj)) edge = true;
                if((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
            }

            if(edge || inside) out.push({x, y});
        }
    }

    return out;
}
