import type {IWindow} from '@ambreia/ui/IWindow';
import type {WindowController} from '@ambreia/ui/WindowController';
import {EditorEvents, type EditorState} from '../state/EditorState';
import type {CanvasSurface} from './CanvasSurface';
import {collectSnapTargets, globalRectOf, snapEdge, snapMove, SNAP_THRESHOLD, type ISnapGuide, type ISnapRect} from './SnapGuides';

interface IRect { x: number; y: number; width: number; height: number; }
interface IHandle { dir: string; l: boolean; r: boolean; t: boolean; b: boolean; }
interface IContainerLike { addChild(child: IWindow): IWindow; }

const HANDLES: IHandle[] = [
    {dir: 'nw', l: true, r: false, t: true, b: false},
    {dir: 'n', l: false, r: false, t: true, b: false},
    {dir: 'ne', l: false, r: true, t: true, b: false},
    {dir: 'e', l: false, r: true, t: false, b: false},
    {dir: 'se', l: false, r: true, t: false, b: true},
    {dir: 's', l: false, r: false, t: false, b: true},
    {dir: 'sw', l: true, r: false, t: false, b: true},
    {dir: 'w', l: true, r: false, t: false, b: false}
];

const HANDLE_HIT = 7;

/** A node captured at drag start, so every move is applied from the origin. */
interface IDragNode { window: WindowController; x: number; y: number; }

/**
 * EditorCanvasLayer — direct manipulation of the edited layout in the centre.
 *
 * Intercepts mouse events in the canvas centre (the gap between the chrome
 * panels) to select, move and resize the edited layout's windows, and paints the
 * selection outlines, resize handles, alignment guides and the marquee directly
 * onto the 2D canvas after each composite (no DOM). Clicks over the chrome panels
 * pass through untouched so the Habbo widget toolbar/tree/inspector keep working.
 *
 * Three things layer on top of that base:
 *
 * - **Zoom.** The edited layout is drawn magnified about the centre of the content
 *   area while the chrome stays 1:1. Since the window system composites everything
 *   into one buffer, the layer repaints the canvas background over the centre —
 *   erasing the unscaled layout, which nothing else occupies — and blits a
 *   snapshot of the root window through the zoom transform.
 * - **Multi-selection.** Ctrl/Cmd-click toggles, Shift-click adds, and dragging on
 *   empty canvas rubber-bands. Moves apply to every selected node.
 * - **Snapping.** Beyond the pixel grid, a drag aligns to its siblings' and its
 *   parent's edges and centres, with the guide lines painted while it holds.
 */
export class EditorCanvasLayer
{
    private readonly _state: EditorState;
    private readonly _surface: CanvasSurface;
    private readonly _getInsets: () => { top: number; left: number; right: number; bottom: number };
    private readonly _rectScratch: IRect = {x: 0, y: 0, width: 0, height: 0};

    private _docMove: ((e: MouseEvent) => void) | null = null;
    private _docUp: (() => void) | null = null;
    private _pushedForDrag = false;
    private _dragging = false;
    private _guides: ISnapGuide[] = [];
    private _marquee: IRect | null = null;

    private _snapshot: OffscreenCanvas | null = null;
    private _snapshotVersion = -1;
    private _snapshotDirty = true;

    public constructor(state: EditorState, surface: CanvasSurface, getInsets: () => { top: number; left: number; right: number; bottom: number })
    {
        this._state = state;
        this._surface = surface;
        this._getInsets = getInsets;

        const canvas = surface.canvas;

        if(canvas)
        {
            canvas.addEventListener('mousedown', this._onMouseDown, true);
            canvas.addEventListener('mousemove', this._onMouseMove);
        }

        surface.setOverlayPainter((ctx, w, h) => this.paint(ctx, w, h));
        surface.setBackgroundPainter((ctx, w, h) => this.paintBackground(ctx, w, h));
        surface.setCoordMapper((x, y) => this.mapForwardedPoint(x, y));

        state.events.on(EditorEvents.GEOMETRY_CHANGED, this._invalidateSnapshot);
        state.events.on(EditorEvents.TREE_CHANGED, this._invalidateSnapshot);
        state.events.on(EditorEvents.LAYOUT_CHANGED, this._invalidateSnapshot);
        state.events.on(EditorEvents.VIEW_CHANGED, this._invalidateSnapshot);
        state.events.on(EditorEvents.DEBUG_CHANGED, this._invalidateSnapshot);
    }

    // ---- Zoom transform ----------------------------------------------------

    /** The editing area — the canvas minus the docked chrome panels. */
    private contentRect(): IRect
    {
        const canvas = this._surface.canvas;
        const {top, left, right, bottom} = this._getInsets();
        const width = canvas ? canvas.width : 0;
        const height = canvas ? canvas.height : 0;

        return {x: left, y: top, width: Math.max(0, width - left - right), height: Math.max(0, height - top - bottom)};
    }

    /** Zoom pivots on the middle of the content area, so magnifying keeps it in view. */
    private zoomOrigin(): { x: number; y: number }
    {
        const rect = this.contentRect();

        return {x: rect.x + rect.width / 2, y: rect.y + rect.height / 2};
    }

    /** Layout (window-tree) coordinates → canvas pixels. */
    public toCanvasPoint(x: number, y: number): { x: number; y: number }
    {
        const zoom = this._state.zoom;
        const origin = this.zoomOrigin();

        return {x: origin.x + (x - origin.x) * zoom, y: origin.y + (y - origin.y) * zoom};
    }

    /** Canvas pixels → layout (window-tree) coordinates. */
    public toLayoutPoint(x: number, y: number): { x: number; y: number }
    {
        const zoom = this._state.zoom;
        const origin = this.zoomOrigin();

        return {x: origin.x + (x - origin.x) / zoom, y: origin.y + (y - origin.y) / zoom};
    }

    /**
     * Transform for coordinates forwarded to the window tree (preview mode).
     * Chrome clicks stay untouched; clicks inside the content area are mapped into
     * layout space, and dropped when that lands outside the area — a mapped point
     * must never be able to hit a chrome panel that lives somewhere else.
     */
    private mapForwardedPoint(x: number, y: number): { x: number; y: number } | null
    {
        if(this._state.zoom === 1)
        {
            return {x, y};
        }

        const rect = this.contentRect();

        if(!this.inRect(rect, x, y))
        {
            return {x, y};
        }

        const point = this.toLayoutPoint(x, y);

        return this.inRect(rect, point.x, point.y) ? point : null;
    }

    private inRect(rect: IRect, x: number, y: number): boolean
    {
        return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
    }

    private readonly _invalidateSnapshot = (): void =>
    {
        this._snapshotDirty = true;
    };

    // ---- Background --------------------------------------------------------

    private paintBackground(ctx: CanvasRenderingContext2D, w: number, h: number): void
    {
        const {top, left, right, bottom} = this._getInsets();
        const cw = Math.max(0, w - left - right);
        const ch = Math.max(0, h - top - bottom);

        if(cw <= 0 || ch <= 0) return;

        const bg = this._state.canvasBg;

        ctx.save();
        ctx.beginPath();
        ctx.rect(left, top, cw, ch);
        ctx.clip();

        if(bg.image)
        {
            ctx.drawImage(bg.image, left, top, cw, ch);
        }
        else if(bg.mode === 'solid')
        {
            ctx.fillStyle = this.cssColor(bg.color);
            ctx.fillRect(left, top, cw, ch);
        }
        else
        {
            this.drawChecker(ctx, left, top, cw, ch);
        }

        ctx.restore();
    }

    private drawChecker(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void
    {
        const size = 12;

        ctx.fillStyle = '#f6f7fb';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#e5e7f0';

        for(let iy = 0; iy * size < h; iy++)
        {
            for(let ix = 0; ix * size < w; ix++)
            {
                if((ix + iy) % 2 === 0) ctx.fillRect(x + ix * size, y + iy * size, size, size);
            }
        }
    }

    private cssColor(argb: number): string
    {
        const a = ((argb >>> 24) & 0xff) / 255;
        const r = (argb >>> 16) & 0xff;
        const g = (argb >>> 8) & 0xff;
        const b = argb & 0xff;

        return `rgba(${r},${g},${b},${a})`;
    }

    private readonly _onMouseMove = (e: MouseEvent): void =>
    {
        const {x, y} = this._surface.toCanvasCoords(e);
        const point = this.toLayoutPoint(x, y);

        this._state.mouse.x = Math.round(point.x);
        this._state.mouse.y = Math.round(point.y);
    };

    private inCentre(x: number, y: number): boolean
    {
        return this.inRect(this.contentRect(), x, y);
    }

    // ---- Picking -----------------------------------------------------------

    private readonly _onMouseDown = (e: MouseEvent): void =>
    {
        if(this._state.modalOpen || this._state.mode === 'preview')
        {
            return; // a popup is on top, or the layout owns the mouse — stand down
        }

        const {x, y} = this._surface.toCanvasCoords(e);

        if(!this.inCentre(x, y))
        {
            return; // over the chrome — let the window system handle it
        }

        // In the editor centre: we own the interaction (select / move / resize).
        e.preventDefault();
        e.stopImmediatePropagation();

        const origin = this.toLayoutPoint(x, y);
        const handle = this.handleAt(x, y);

        if(handle)
        {
            this.beginResize(handle, origin);

            return;
        }

        const hits = this.collectAtPoint(origin.x, origin.y);
        const top = hits[0] ?? null;
        const additive = e.ctrlKey || e.metaKey;

        if(!top)
        {
            if(!additive && !e.shiftKey)
            {
                this._state.select(null);
            }

            this.beginMarquee({x, y});

            return;
        }

        if(additive)
        {
            this._state.toggleSelected(top);

            return;
        }

        if(e.shiftKey)
        {
            if(!this._state.isSelected(top))
            {
                this._state.selectMany([...this._state.selection, top]);
            }
        }
        else if(!this._state.isSelected(top))
        {
            this._state.select(top);
        }

        if(e.altKey)
        {
            this.duplicateSelectionForDrag();
        }

        this.beginMove(origin);
    };

    // ---- Interaction -------------------------------------------------------

    /** The selection minus the root and anything already covered by an ancestor. */
    private dragNodes(): IDragNode[]
    {
        const selection = this._state.selection.filter((win) => !win.disposed && win !== this._state.rootWindow);

        return selection
            .filter((win) => !selection.some((other) => other !== win && this.isAncestor(other, win)))
            .map((win) =>
            {
                const controller = win as unknown as WindowController;

                return {window: controller, x: controller.x, y: controller.y};
            });
    }

    private isAncestor(candidate: IWindow, node: IWindow): boolean
    {
        let parent: IWindow | null = node.parent;

        while(parent)
        {
            if(parent === candidate) return true;

            parent = parent.parent;
        }

        return false;
    }

    /**
     * Alt-drag: clones every selected node into its own parent and makes the
     * clones the selection, so the drag moves the copies and leaves the originals
     * where they were.
     */
    private duplicateSelectionForDrag(): void
    {
        const nodes = this.dragNodes();

        if(nodes.length === 0) return;

        this._state.pushHistory();
        this._pushedForDrag = true;

        const clones: IWindow[] = [];

        for(const {window} of nodes)
        {
            const parent = window.parent as unknown as IContainerLike | null;

            if(!parent) continue;

            const clone = window.clone() as unknown as WindowController;

            parent.addChild(clone as unknown as IWindow);
            clone.rectangle = {x: window.x, y: window.y, width: window.width, height: window.height};
            clones.push(clone as unknown as IWindow);
        }

        if(clones.length > 0)
        {
            this._state.selectMany(clones);
            this._state.notifyTreeChanged();
        }
    }

    private beginMove(origin: { x: number; y: number }): void
    {
        const nodes = this.dragNodes();

        if(nodes.length === 0) return;

        const bounds = this.unionRect(nodes.map(({window}) => globalRectOf(window as unknown as IWindow)));
        const targets = this._state.smartGuides
            ? collectSnapTargets(nodes.map(({window}) => window as unknown as IWindow), this._state.rootWindow)
            : [];

        this.startDrag(origin, (dx, dy) =>
        {
            let moveX = dx;
            let moveY = dy;

            this._guides = [];

            if(this._state.snap > 0)
            {
                moveX = this._state.snapValue(nodes[0].x + dx) - nodes[0].x;
                moveY = this._state.snapValue(nodes[0].y + dy) - nodes[0].y;
            }

            if(targets.length > 0 && bounds)
            {
                const snapped = snapMove(bounds, moveX, moveY, targets, SNAP_THRESHOLD / this._state.zoom);

                moveX = snapped.dx;
                moveY = snapped.dy;
                this._guides = snapped.guides;
            }

            for(const node of nodes)
            {
                node.window.rectangle = {
                    x: Math.round(node.x + moveX),
                    y: Math.round(node.y + moveY),
                    width: node.window.width,
                    height: node.window.height
                };
            }
        });
    }

    private unionRect(rects: ISnapRect[]): ISnapRect | null
    {
        if(rects.length === 0) return null;

        const left = Math.min(...rects.map((r) => r.x));
        const top = Math.min(...rects.map((r) => r.y));
        const right = Math.max(...rects.map((r) => r.x + r.width));
        const bottom = Math.max(...rects.map((r) => r.y + r.height));

        return {x: left, y: top, width: right - left, height: bottom - top};
    }

    private beginResize(handle: IHandle, origin: { x: number; y: number }): void
    {
        const win = this._state.selected as unknown as WindowController | null;

        if(!win || win.disposed) return;

        const sx = win.x;
        const sy = win.y;
        const sw = win.width;
        const sh = win.height;
        const global = globalRectOf(win as unknown as IWindow);
        const offsetX = global.x - sx;
        const offsetY = global.y - sy;
        const targets = this._state.smartGuides
            ? collectSnapTargets([win as unknown as IWindow], this._state.rootWindow)
            : [];
        const threshold = SNAP_THRESHOLD / this._state.zoom;

        this.startDrag(origin, (dx, dy) =>
        {
            let x = sx;
            let y = sy;
            let w = sw;
            let h = sh;

            this._guides = [];

            if(handle.l) { x = this._state.snapValue(sx + dx); w = sw + (sx - x); }
            if(handle.r) { w = this._state.snapValue(sw + dx); }
            if(handle.t) { y = this._state.snapValue(sy + dy); h = sh + (sy - y); }
            if(handle.b) { h = this._state.snapValue(sh + dy); }

            if(targets.length > 0)
            {
                const span = {from: y + offsetY, to: y + offsetY + h};

                if(handle.l)
                {
                    const hit = snapEdge(x + offsetX, 'x', targets, span, threshold);

                    if(hit.guide) { w += (x + offsetX) - hit.value; x = hit.value - offsetX; this._guides.push(hit.guide); }
                }
                else if(handle.r)
                {
                    const hit = snapEdge(x + offsetX + w, 'x', targets, span, threshold);

                    if(hit.guide) { w = hit.value - (x + offsetX); this._guides.push(hit.guide); }
                }

                const hSpan = {from: x + offsetX, to: x + offsetX + w};

                if(handle.t)
                {
                    const hit = snapEdge(y + offsetY, 'y', targets, hSpan, threshold);

                    if(hit.guide) { h += (y + offsetY) - hit.value; y = hit.value - offsetY; this._guides.push(hit.guide); }
                }
                else if(handle.b)
                {
                    const hit = snapEdge(y + offsetY + h, 'y', targets, hSpan, threshold);

                    if(hit.guide) { h = hit.value - (y + offsetY); this._guides.push(hit.guide); }
                }
            }

            win.rectangle = {x: Math.round(x), y: Math.round(y), width: Math.max(1, Math.round(w)), height: Math.max(1, Math.round(h))};
        });
    }

    /** Rubber-band selection: every node fully inside the band is selected. */
    private beginMarquee(origin: { x: number; y: number }): void
    {
        this._marquee = {x: origin.x, y: origin.y, width: 0, height: 0};

        this._docMove = (ev: MouseEvent): void =>
        {
            const now = this._surface.toCanvasCoords(ev);

            this._marquee = {
                x: Math.min(origin.x, now.x),
                y: Math.min(origin.y, now.y),
                width: Math.abs(now.x - origin.x),
                height: Math.abs(now.y - origin.y)
            };
        };

        this._docUp = (): void =>
        {
            const band = this._marquee;

            this.endDrag();

            if(!band || (band.width < 3 && band.height < 3)) return;

            const topLeft = this.toLayoutPoint(band.x, band.y);
            const bottomRight = this.toLayoutPoint(band.x + band.width, band.y + band.height);
            const layoutBand: IRect = {
                x: topLeft.x,
                y: topLeft.y,
                width: bottomRight.x - topLeft.x,
                height: bottomRight.y - topLeft.y
            };

            this._state.selectMany(this.collectInside(layoutBand));
        };

        document.addEventListener('mousemove', this._docMove);
        document.addEventListener('mouseup', this._docUp);
    }

    private collectInside(band: IRect): IWindow[]
    {
        const root = this._state.rootWindow;

        if(!root || root.disposed) return [];

        const found: IWindow[] = [];
        const visit = (window: IWindow): void =>
        {
            if(window.disposed || !window.visible) return;

            if(window !== root)
            {
                const rect = globalRectOf(window);

                if(rect.x >= band.x
                    && rect.y >= band.y
                    && (rect.x + rect.width) <= (band.x + band.width)
                    && (rect.y + rect.height) <= (band.y + band.height))
                {
                    // Nodes are collected whole: once a container fits, its
                    // children move with it, so descending would select twice.
                    found.push(window);

                    return;
                }
            }

            const container = window as unknown as { numChildren?: number; getChildAt?: (i: number) => IWindow | null };

            if(typeof container.numChildren === 'number' && typeof container.getChildAt === 'function')
            {
                for(let i = 0; i < container.numChildren; i++)
                {
                    const child = container.getChildAt(i);

                    if(child) visit(child);
                }
            }
        };

        visit(root);

        return found;
    }

    private startDrag(origin: { x: number; y: number }, apply: (dx: number, dy: number) => void): void
    {
        this._dragging = true;

        this._docMove = (ev: MouseEvent): void =>
        {
            const raw = this._surface.toCanvasCoords(ev);
            const now = this.toLayoutPoint(raw.x, raw.y);
            const dx = now.x - origin.x;
            const dy = now.y - origin.y;

            // Snapshot once, on the first real movement — a click that selects
            // without dragging must not create an undo step.
            if(!this._pushedForDrag && (dx !== 0 || dy !== 0))
            {
                this._pushedForDrag = true;
                this._state.pushHistory();
            }

            apply(dx, dy);
            this._state.events.emit(EditorEvents.GEOMETRY_CHANGED);
        };

        this._docUp = (): void =>
        {
            this.endDrag();
            this._state.notifyGeometryChanged();
        };

        document.addEventListener('mousemove', this._docMove);
        document.addEventListener('mouseup', this._docUp);
    }

    private endDrag(): void
    {
        if(this._docMove) document.removeEventListener('mousemove', this._docMove);
        if(this._docUp) document.removeEventListener('mouseup', this._docUp);

        this._docMove = null;
        this._docUp = null;
        this._pushedForDrag = false;
        this._dragging = false;
        this._guides = [];
        this._marquee = null;
        this._snapshotDirty = true;
    }

    private collectAtPoint(x: number, y: number): IWindow[]
    {
        const root = this._state.rootWindow;

        if(!root || root.disposed) return [];

        const hits: Array<{ window: IWindow; depth: number; order: number }> = [];
        let order = 0;

        const visit = (window: IWindow, depth: number): void =>
        {
            if(window.disposed || !window.visible) return;

            const r = this._rectScratch;

            window.getGlobalRectangle(r);

            if(x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height)
            {
                hits.push({window, depth, order: order++});
            }

            const container = window as unknown as { numChildren?: number; getChildAt?: (i: number) => IWindow | null };

            if(typeof container.numChildren === 'number' && typeof container.getChildAt === 'function')
            {
                for(let i = container.numChildren - 1; i >= 0; i--)
                {
                    const child = container.getChildAt(i);

                    if(child) visit(child, depth + 1);
                }
            }
        };

        visit(root, 0);
        hits.sort((a, b) => (b.depth - a.depth) || (b.order - a.order));

        return hits.map((h) => h.window);
    }

    /** Handles are hit in canvas space — they keep their size whatever the zoom. */
    private handleAt(x: number, y: number): IHandle | null
    {
        const selected = this._state.selected;

        if(!selected || selected.disposed) return null;

        const r = this.canvasRectOf(selected);

        for(const spec of HANDLES)
        {
            const hx = spec.l ? r.x : (spec.r ? r.x + r.width : r.x + r.width / 2);
            const hy = spec.t ? r.y : (spec.b ? r.y + r.height : r.y + r.height / 2);

            if(Math.abs(x - hx) <= HANDLE_HIT && Math.abs(y - hy) <= HANDLE_HIT)
            {
                return spec;
            }
        }

        return null;
    }

    /** A window's global rectangle expressed in canvas pixels (zoom applied). */
    private canvasRectOf(window: IWindow): IRect
    {
        const r = this._rectScratch;

        window.getGlobalRectangle(r);

        const topLeft = this.toCanvasPoint(r.x, r.y);
        const zoom = this._state.zoom;

        return {x: topLeft.x, y: topLeft.y, width: r.width * zoom, height: r.height * zoom};
    }

    // ---- Overlay paint -----------------------------------------------------

    private paint(ctx: CanvasRenderingContext2D, w: number, h: number): void
    {
        const {top, left, right, bottom} = this._getInsets();

        ctx.save();
        ctx.beginPath();
        ctx.rect(left, top, Math.max(0, w - left - right), Math.max(0, h - top - bottom));
        ctx.clip();

        if(this._state.zoom !== 1)
        {
            this.paintZoomedLayout(ctx, w, h);
        }

        // Preview hands the layout back to the user, and a popup (gallery, palette,
        // colour picker) sits above the canvas — in both cases the selection
        // furniture would be painted over something it does not belong to.
        if(this._state.mode === 'preview' || this._state.modalOpen)
        {
            ctx.restore();

            return;
        }

        if(this._state.debugRects)
        {
            this.paintDebugRects(ctx);
        }

        this.paintSelection(ctx);
        this.paintGuides(ctx);
        this.paintMarquee(ctx);

        ctx.restore();
    }

    /**
     * Erases the unscaled layout from the centre (nothing else is drawn there)
     * and blits the root's snapshot through the zoom transform.
     */
    private paintZoomedLayout(ctx: CanvasRenderingContext2D, w: number, h: number): void
    {
        const root = this._state.rootWindow;

        if(!root || root.disposed) return;

        this.paintBackground(ctx, w, h);

        const snapshot = this.layoutSnapshot(w, h);

        if(!snapshot) return;

        const origin = this.zoomOrigin();
        const zoom = this._state.zoom;

        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.translate(origin.x, origin.y);
        ctx.scale(zoom, zoom);
        ctx.translate(-origin.x, -origin.y);
        ctx.drawImage(snapshot, 0, 0);
        ctx.restore();
    }

    /**
     * The root window rendered on its own, cached until either the window
     * renderer or the editor reports a change — re-snapshotting a full-canvas
     * buffer every frame would allocate one per frame for no benefit.
     */
    private layoutSnapshot(w: number, h: number): OffscreenCanvas | null
    {
        const root = this._state.rootWindow;

        if(!root || root.disposed) return null;

        const version = this._surface.renderVersion;
        const stale = this._snapshotDirty
            || this._dragging
            || version !== this._snapshotVersion
            || !this._snapshot
            || this._snapshot.width !== w
            || this._snapshot.height !== h;

        if(stale)
        {
            this._snapshot = this._state.runtime.windowManager.renderWindowSnapshot(root, w, h);
            this._snapshotVersion = version;
            this._snapshotDirty = false;
        }

        return this._snapshot;
    }

    private paintSelection(ctx: CanvasRenderingContext2D): void
    {
        const primary = this._state.selected;

        for(const window of this._state.selection)
        {
            if(window.disposed) continue;

            const r = this.canvasRectOf(window);
            const isPrimary = window === primary;

            ctx.strokeStyle = isPrimary ? '#12b5c9' : 'rgba(18,181,201,0.55)';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.width - 1, r.height - 1);
        }

        if(!primary || primary.disposed || !this._state.showScaler) return;

        const r = this.canvasRectOf(primary);

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#6c5ce7';
        ctx.lineWidth = 1.5;

        for(const spec of HANDLES)
        {
            const hx = spec.l ? r.x : (spec.r ? r.x + r.width : r.x + r.width / 2);
            const hy = spec.t ? r.y : (spec.b ? r.y + r.height : r.y + r.height / 2);

            ctx.beginPath();
            ctx.rect(hx - 4, hy - 4, 8, 8);
            ctx.fill();
            ctx.stroke();
        }
    }

    private paintGuides(ctx: CanvasRenderingContext2D): void
    {
        if(this._guides.length === 0) return;

        ctx.save();
        ctx.strokeStyle = '#ff2e88';
        ctx.lineWidth = 1;

        for(const guide of this._guides)
        {
            const start = guide.axis === 'x'
                ? this.toCanvasPoint(guide.position, guide.from)
                : this.toCanvasPoint(guide.from, guide.position);
            const end = guide.axis === 'x'
                ? this.toCanvasPoint(guide.position, guide.to)
                : this.toCanvasPoint(guide.to, guide.position);

            ctx.beginPath();
            ctx.moveTo(Math.round(start.x) + 0.5, Math.round(start.y) + 0.5);
            ctx.lineTo(Math.round(end.x) + 0.5, Math.round(end.y) + 0.5);
            ctx.stroke();
        }

        ctx.restore();
    }

    private paintMarquee(ctx: CanvasRenderingContext2D): void
    {
        const band = this._marquee;

        if(!band || (band.width < 2 && band.height < 2)) return;

        ctx.save();
        ctx.fillStyle = 'rgba(18,181,201,0.12)';
        ctx.strokeStyle = '#12b5c9';
        ctx.lineWidth = 1;
        ctx.fillRect(band.x, band.y, band.width, band.height);
        ctx.strokeRect(band.x + 0.5, band.y + 0.5, band.width, band.height);
        ctx.restore();
    }

    /** Outlines every window in the edited layout (Glaze's "Debug Rects"). */
    private paintDebugRects(ctx: CanvasRenderingContext2D): void
    {
        const root = this._state.rootWindow;

        if(!root || root.disposed) return;

        ctx.strokeStyle = 'rgba(233,30,99,0.5)';
        ctx.lineWidth = 1;

        const visit = (win: IWindow): void =>
        {
            if(win.disposed || !win.visible) return;

            const r = this.canvasRectOf(win);

            ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.width - 1, r.height - 1);

            const c = win as unknown as { numChildren?: number; getChildAt?: (i: number) => IWindow | null };

            if(typeof c.numChildren === 'number' && typeof c.getChildAt === 'function')
            {
                for(let i = 0; i < c.numChildren; i++)
                {
                    const child = c.getChildAt(i);

                    if(child) visit(child);
                }
            }
        };

        visit(root);
    }

    public dispose(): void
    {
        const canvas = this._surface.canvas;

        if(canvas)
        {
            canvas.removeEventListener('mousedown', this._onMouseDown, true);
            canvas.removeEventListener('mousemove', this._onMouseMove);
        }

        this.endDrag();
        this._state.events.off(EditorEvents.GEOMETRY_CHANGED, this._invalidateSnapshot);
        this._state.events.off(EditorEvents.TREE_CHANGED, this._invalidateSnapshot);
        this._state.events.off(EditorEvents.LAYOUT_CHANGED, this._invalidateSnapshot);
        this._state.events.off(EditorEvents.VIEW_CHANGED, this._invalidateSnapshot);
        this._state.events.off(EditorEvents.DEBUG_CHANGED, this._invalidateSnapshot);
        this._surface.setOverlayPainter(null);
        this._surface.setBackgroundPainter(null);
        this._surface.setCoordMapper(null);
        this._snapshot = null;
    }
}
