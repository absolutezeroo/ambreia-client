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

/**
 * The outline of tile (x, y) over its floor as iso draws it, `s` being its 4 × 4 quarter heights
 * (IsoStage.tileSurface): the four edges, stepping up and down with the stair quarters.
 */
export function surfaceOutline(x: number, y: number, s: readonly number[]): number[]
{
    const pts: number[] = [];
    // One quarter of an edge: from (ax, ay) to (bx, by) at height h.
    const edge = (ax: number, ay: number, bx: number, by: number, h: number): void =>
    {
        pts.push(...project(ax, ay, h), ...project(bx, by, h));
    };

    for(let q = 0; q < 4; q++) edge(x + q / 4, y, x + (q + 1) / 4, y, s[q]);
    for(let q = 0; q < 4; q++) edge(x + 1, y + q / 4, x + 1, y + (q + 1) / 4, s[q * 4 + 3]);
    for(let q = 3; q >= 0; q--) edge(x + (q + 1) / 4, y + 1, x + q / 4, y + 1, s[12 + q]);
    for(let q = 3; q >= 0; q--) edge(x, y + (q + 1) / 4, x, y + q / 4, s[q * 4]);

    return pts;
}

/** Traces the 16 quarter tops of tile (x, y) over `s` (as surfaceOutline) as one path, to fill. */
export function traceSurface(ctx: CanvasRenderingContext2D, x: number, y: number, s: readonly number[]): void
{
    ctx.beginPath();

    for(let i = 0; i < 16; i++)
    {
        const q = rhombus(x + (i % 4) / 4, y + Math.floor(i / 4) / 4, 0.25, 0.25, s[i]);

        ctx.moveTo(q[0], q[1]);
        for(let k = 2; k < 8; k += 2) ctx.lineTo(q[k], q[k + 1]);
        ctx.closePath();
    }
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
