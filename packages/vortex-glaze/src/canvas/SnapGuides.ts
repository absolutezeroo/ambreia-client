import type {IWindow} from '@ambreia/ui/IWindow';

export interface ISnapRect { x: number; y: number; width: number; height: number; }

/** A guide line to paint while a drag is snapped, in global canvas space. */
export interface ISnapGuide
{
    axis: 'x' | 'y';
    /** The snapped coordinate (a vertical guide's x, a horizontal guide's y). */
    position: number;
    /** Extent of the line along the other axis, so it spans both rectangles. */
    from: number;
    to: number;
}

export interface ISnapResult
{
    dx: number;
    dy: number;
    guides: ISnapGuide[];
}

interface IAnchorHit
{
    adjustment: number;
    position: number;
    target: ISnapRect;
}

/** Distance in *screen* pixels within which a drag snaps to a target line. */
export const SNAP_THRESHOLD = 6;

/**
 * SnapGuides — sibling/parent alignment snapping for canvas drags.
 *
 * No AS3 equivalent: Glaze's own manipulation only ever snapped to a fixed pixel
 * grid. This is the "aimant" Clove implements in `snapGeometry.ts`, extended with
 * the parent's own edges and centre (a child aligned to its container's middle is
 * the single most common Habbo layout gesture) and with the guide extents needed
 * to paint the line across both rectangles.
 *
 * All rectangles are in global canvas space, so a node can snap to a target under
 * a different parent.
 */

/** Reads a window's global rectangle into a fresh {@link ISnapRect}. */
export function globalRectOf(window: IWindow): ISnapRect
{
    const rect: ISnapRect = {x: 0, y: 0, width: 0, height: 0};

    window.getGlobalRectangle(rect);

    return rect;
}

/**
 * The rectangles a dragged node may snap to: every visible sibling that is not
 * itself being dragged, plus the parent's own box.
 */
export function collectSnapTargets(moving: IWindow[], root: IWindow | null): ISnapRect[]
{
    const primary = moving[0];

    if(!primary || primary.disposed || !primary.parent)
    {
        return [];
    }

    const parent = primary.parent;
    const dragged = new Set(moving);
    const targets: ISnapRect[] = [globalRectOf(parent)];
    const list = parent as unknown as { numChildren?: number; getChildAt?: (index: number) => IWindow | null };

    if(typeof list.numChildren === 'number' && typeof list.getChildAt === 'function')
    {
        for(let i = 0; i < list.numChildren; i++)
        {
            const child = list.getChildAt(i);

            if(child && child !== root && !child.disposed && child.visible && !dragged.has(child))
            {
                targets.push(globalRectOf(child));
            }
        }
    }

    return targets;
}

function nearest(sources: number[], targets: Array<{ value: number; rect: ISnapRect }>, threshold: number): IAnchorHit | null
{
    let best: IAnchorHit | null = null;

    for(const source of sources)
    {
        for(const target of targets)
        {
            const adjustment = target.value - source;

            if(Math.abs(adjustment) > threshold)
            {
                continue;
            }

            if(!best || Math.abs(adjustment) < Math.abs(best.adjustment))
            {
                best = {adjustment, position: target.value, target: target.rect};
            }
        }
    }

    return best;
}

function verticalLines(rects: ISnapRect[]): Array<{ value: number; rect: ISnapRect }>
{
    return rects.flatMap((rect) => [
        {value: rect.x, rect},
        {value: rect.x + Math.round(rect.width / 2), rect},
        {value: rect.x + rect.width, rect}
    ]);
}

function horizontalLines(rects: ISnapRect[]): Array<{ value: number; rect: ISnapRect }>
{
    return rects.flatMap((rect) => [
        {value: rect.y, rect},
        {value: rect.y + Math.round(rect.height / 2), rect},
        {value: rect.y + rect.height, rect}
    ]);
}

/**
 * Adjusts a proposed move so the rectangle's edges or centre line up with a
 * target's, and reports the guides to draw. `threshold` is in the same units as
 * the rectangles (callers divide the screen threshold by the zoom).
 */
export function snapMove(rect: ISnapRect, dx: number, dy: number, targets: ISnapRect[], threshold: number = SNAP_THRESHOLD): ISnapResult
{
    if(targets.length === 0 || threshold <= 0)
    {
        return {dx, dy, guides: []};
    }

    const left = rect.x + dx;
    const top = rect.y + dy;
    const xHit = nearest(
        [left, left + Math.round(rect.width / 2), left + rect.width],
        verticalLines(targets),
        threshold
    );
    const yHit = nearest(
        [top, top + Math.round(rect.height / 2), top + rect.height],
        horizontalLines(targets),
        threshold
    );
    const guides: ISnapGuide[] = [];
    const snappedX = left + (xHit?.adjustment ?? 0);
    const snappedY = top + (yHit?.adjustment ?? 0);

    if(xHit)
    {
        guides.push({
            axis: 'x',
            position: xHit.position,
            from: Math.min(snappedY, xHit.target.y),
            to: Math.max(snappedY + rect.height, xHit.target.y + xHit.target.height)
        });
    }

    if(yHit)
    {
        guides.push({
            axis: 'y',
            position: yHit.position,
            from: Math.min(snappedX, yHit.target.x),
            to: Math.max(snappedX + rect.width, yHit.target.x + yHit.target.width)
        });
    }

    return {dx: dx + (xHit?.adjustment ?? 0), dy: dy + (yHit?.adjustment ?? 0), guides};
}

/**
 * Snaps one moving edge (a resize handle) to the nearest target line on that
 * axis, returning the adjusted coordinate and the guide to draw.
 */
export function snapEdge(value: number, axis: 'x' | 'y', targets: ISnapRect[], span: { from: number; to: number }, threshold: number = SNAP_THRESHOLD): { value: number; guide: ISnapGuide | null }
{
    if(targets.length === 0 || threshold <= 0)
    {
        return {value, guide: null};
    }

    const hit = nearest([value], axis === 'x' ? verticalLines(targets) : horizontalLines(targets), threshold);

    if(!hit)
    {
        return {value, guide: null};
    }

    const target = hit.target;
    const guide: ISnapGuide = axis === 'x'
        ? {axis, position: hit.position, from: Math.min(span.from, target.y), to: Math.max(span.to, target.y + target.height)}
        : {axis, position: hit.position, from: Math.min(span.from, target.x), to: Math.max(span.to, target.x + target.width)};

    return {value: hit.position, guide};
}
