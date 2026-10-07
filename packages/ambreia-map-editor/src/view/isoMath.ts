/** Habbo's room geometry at scale 64, as RoomGeometry projects it: x → (32, 16), y → (−32, 16), z → (0, −32). */
export const HALF_W = 32;
export const HALF_H = 16;
export const STEP = 32;

/** Screen position of the grid corner (x, y) at altitude h. Tile (x, y) spans corners x..x+1, y..y+1. */
export const project = (x: number, y: number, h: number): [number, number] =>
    [(x - y) * HALF_W, (x + y) * HALF_H - h * STEP];

/** The w × l rhombus from grid corner (x, y) at altitude h: top, right, bottom, left. */
export function rhombus(x: number, y: number, w: number, l: number, h: number): number[]
{
    return [...project(x, y, h), ...project(x + w, y, h), ...project(x + w, y + l, h), ...project(x, y + l, h)];
}

/** Even-odd test of a point against a flat [x0, y0, x1, y1, …] polygon. */
export function inPolygon(px: number, py: number, pts: readonly number[]): boolean
{
    let inside = false;

    for(let i = 0, j = pts.length - 2; i < pts.length; j = i, i += 2)
    {
        const [xi, yi, xj, yj] = [pts[i], pts[i + 1], pts[j], pts[j + 1]];

        if((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside;
    }

    return inside;
}

export function tracePolygon(ctx: CanvasRenderingContext2D, pts: readonly number[]): void
{
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for(let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.closePath();
}
