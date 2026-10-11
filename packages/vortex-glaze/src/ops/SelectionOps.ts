import type {IWindow} from '@ambreia/ui/IWindow';
import type {WindowController} from '@ambreia/ui/WindowController';
import type {AlignEdge, ISelectionOpsState} from '../state/EditorStateContracts';

interface IRect { x: number; y: number; width: number; height: number; }

/**
 * Multi-selection geometry operations. No AS3 equivalent — Glaze is a separate
 * authoring app; this is the editor tooling Clove calls its align/distribute bar.
 *
 * Everything is computed in **global** canvas space and applied back as a delta on
 * each node's local `x`/`y`, so a selection spanning several parents (a button in
 * one container aligned against a label in another) lands where the user sees it
 * rather than where its own parent's origin happens to be.
 */

function globalRect(window: IWindow): IRect
{
    const rect: IRect = {x: 0, y: 0, width: 0, height: 0};

    window.getGlobalRectangle(rect);

    return rect;
}

/** Moves a node so that its global position becomes (`globalX`, `globalY`). */
function moveTo(window: IWindow, current: IRect, globalX: number, globalY: number): void
{
    const controller = window as unknown as WindowController;

    controller.rectangle = {
        x: Math.round(controller.x + (globalX - current.x)),
        y: Math.round(controller.y + (globalY - current.y)),
        width: controller.width,
        height: controller.height
    };
}

/** The live, non-root nodes of the selection — the ones an align may move. */
function movableSelection(state: ISelectionOpsState): IWindow[]
{
    return state.selection.filter((win) => !win.disposed && win !== state.rootWindow);
}

/** The union of the selection's global rectangles. */
export function selectionBounds(state: ISelectionOpsState): IRect | null
{
    const rects = state.selection.filter((win) => !win.disposed).map(globalRect);

    if(rects.length === 0)
    {
        return null;
    }

    const left = Math.min(...rects.map((r) => r.x));
    const top = Math.min(...rects.map((r) => r.y));
    const right = Math.max(...rects.map((r) => r.x + r.width));
    const bottom = Math.max(...rects.map((r) => r.y + r.height));

    return {x: left, y: top, width: right - left, height: bottom - top};
}

/**
 * Aligns the selection.
 *
 * Two or more nodes align against the selection's own bounding box; a single node
 * aligns against its parent's edges/centre, which is what Glaze's align buttons
 * did before multi-selection existed.
 */
export function alignSelection(state: ISelectionOpsState, edge: AlignEdge): void
{
    const nodes = movableSelection(state);

    if(nodes.length === 0)
    {
        return;
    }

    if(nodes.length === 1)
    {
        alignToParent(state, nodes[0] as unknown as WindowController, edge);

        return;
    }

    const bounds = selectionBounds(state);

    if(!bounds)
    {
        return;
    }

    state.pushHistory();

    for(const node of nodes)
    {
        const rect = globalRect(node);
        let x = rect.x;
        let y = rect.y;

        switch(edge)
        {
            case 'left': x = bounds.x; break;
            case 'hcenter': x = bounds.x + Math.round((bounds.width - rect.width) / 2); break;
            case 'right': x = bounds.x + bounds.width - rect.width; break;
            case 'top': y = bounds.y; break;
            case 'vmiddle': y = bounds.y + Math.round((bounds.height - rect.height) / 2); break;
            case 'bottom': y = bounds.y + bounds.height - rect.height; break;
        }

        moveTo(node, rect, x, y);
    }

    state.notifyGeometryChanged();
}

function alignToParent(state: ISelectionOpsState, win: WindowController, edge: AlignEdge): void
{
    const parent = win.parent;

    if(!parent)
    {
        return;
    }

    let x = win.x;
    let y = win.y;

    state.pushHistory();

    switch(edge)
    {
        case 'left': x = 0; break;
        case 'hcenter': x = Math.round((parent.width - win.width) / 2); break;
        case 'right': x = parent.width - win.width; break;
        case 'top': y = 0; break;
        case 'vmiddle': y = Math.round((parent.height - win.height) / 2); break;
        case 'bottom': y = parent.height - win.height; break;
    }

    win.rectangle = {x, y, width: win.width, height: win.height};
    state.notifyGeometryChanged();
}

/**
 * Spreads the selection so the gaps between consecutive nodes are equal, keeping
 * the two extremes where they are. Returns false when fewer than three nodes are
 * selected, letting the caller fall back to distributing a container's children.
 */
export function distributeSelection(state: ISelectionOpsState, axis: 'h' | 'v'): boolean
{
    const nodes = movableSelection(state);

    if(nodes.length < 3)
    {
        return false;
    }

    const entries = nodes.map((node) => ({node, rect: globalRect(node)}));

    entries.sort((a, b) => axis === 'h' ? (a.rect.x - b.rect.x) : (a.rect.y - b.rect.y));

    const first = entries[0].rect;
    const last = entries[entries.length - 1].rect;
    const span = axis === 'h'
        ? (last.x + last.width) - first.x
        : (last.y + last.height) - first.y;
    const total = entries.reduce((sum, entry) => sum + (axis === 'h' ? entry.rect.width : entry.rect.height), 0);
    const gap = (span - total) / (entries.length - 1);

    state.pushHistory();

    let cursor = axis === 'h' ? first.x : first.y;

    for(const {node, rect} of entries)
    {
        if(axis === 'h')
        {
            moveTo(node, rect, Math.round(cursor), rect.y);
            cursor += rect.width + gap;
        }
        else
        {
            moveTo(node, rect, rect.x, Math.round(cursor));
            cursor += rect.height + gap;
        }
    }

    state.notifyGeometryChanged();

    return true;
}
