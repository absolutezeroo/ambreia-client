import type {ZoneDecorObject, ZoneTile} from '@ambreia/map-editor-core/zone/Zone.generated';
import {rotatedFootprint, tileAt} from '@ambreia/map-editor-core/zone/zoneGeometry';
import type {IPick} from './IPick';
import type {IViewModel} from './IViewModel';
import {HALF_H, inPolygon, project, rhombus, STEP, tracePolygon} from './isoMath';

type PointerKind = 'down' | 'move' | 'up';

/**
 * The simple isometric view of the first editor: tiles with their heights, the door, and each
 * furniture as a box the size of its footprint with its class name. @ambreia/iso replaces it.
 */
export class IsoView
{
    onPointer: (kind: PointerKind, pick: IPick, e: PointerEvent) => void = () => undefined;

    private readonly _ctx: CanvasRenderingContext2D;
    private _model: IViewModel | null = null;
    private _zoom = 1;
    private _ox = 0;
    private _oy = 0;
    private _pan: {x: number; y: number} | null = null;
    private _fitted = false;

    constructor(private readonly _canvas: HTMLCanvasElement)
    {
        this._ctx = _canvas.getContext('2d')!;

        new ResizeObserver(() => this.resize()).observe(_canvas.parentElement!);
        _canvas.addEventListener('contextmenu', e => e.preventDefault());
        _canvas.addEventListener('wheel', e => this.wheel(e), {passive: false});
        _canvas.addEventListener('pointerdown', e => this.pointer('down', e));
        _canvas.addEventListener('pointermove', e => this.pointer('move', e));
        _canvas.addEventListener('pointerup', e => this.pointer('up', e));
    }

    setModel(model: IViewModel): void
    {
        this._model = model;
        if(!this._fitted) this.fit();
        this.draw();
    }

    /** Centres the floor in the canvas. */
    fit(): void
    {
        // The stage, not the canvas: the canvas has no size of its own until the first resize.
        const stage = this._canvas.parentElement!;

        if(!this._model || !stage.clientWidth) return;

        const {width, length} = this._model.doc.floor;
        const [cx, cy] = project(width / 2, length / 2, 0);
        const span = width + length;

        this._zoom = Math.min(1.5, Math.max(0.3, Math.min(stage.clientWidth / (span * 36), stage.clientHeight / (span * 20))));
        this._ox = stage.clientWidth / 2 - cx * this._zoom;
        this._oy = stage.clientHeight / 2 - cy * this._zoom;
        this._fitted = true;
    }

    centerOn(x: number, y: number): void
    {
        const stage = this._canvas.parentElement!;
        const [sx, sy] = project(x + 0.5, y + 0.5, 0);

        this._ox = stage.clientWidth / 2 - sx * this._zoom;
        this._oy = stage.clientHeight / 2 - sy * this._zoom;
        this.draw();
    }

    pick(clientX: number, clientY: number): IPick
    {
        const model = this._model;

        if(!model) return {cell: null, objectId: null};

        const rect = this._canvas.getBoundingClientRect();
        const px = (clientX - rect.left - this._ox) / this._zoom;
        const py = (clientY - rect.top - this._oy) / this._zoom;
        const floor = model.doc.floor;
        let cell: IPick['cell'] = null;

        for(let i = floor.tiles.length - 1; i >= 0 && !cell; i--)
        {
            const x = i % floor.width;
            const y = Math.floor(i / floor.width);

            if(inPolygon(px, py, rhombus(x, y, 1, 1, floor.tiles[i].height ?? 0))) cell = {x, y};
        }

        let objectId: string | null = null;

        if(model.layers.isVisible('decor'))
        {
            for(const o of this.sortedDecor(model).reverse())
            {
                if(inPolygon(px, py, this.outline(model, o, 0, 0)))
                {
                    objectId = o.id;
                    break;
                }
            }
        }

        return {cell, objectId};
    }

    draw(): void
    {
        const ctx = this._ctx;
        const dpr = window.devicePixelRatio || 1;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = '#1b1f29';
        ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);

        const model = this._model;

        if(!model) return;

        ctx.setTransform(dpr * this._zoom, 0, 0, dpr * this._zoom, dpr * this._ox, dpr * this._oy);

        const floor = model.doc.floor;

        if(model.layers.isVisible('floor'))
        {
            floor.tiles.forEach((t, i) => this.drawTile(model, i % floor.width, Math.floor(i / floor.width), t, i));
        }

        if(model.layers.isVisible('door'))
        {
            const {x = 0, y = 0} = floor.door;

            this.overlay(x, y, tileAt(floor, x, y)?.height ?? 0, 'rgba(255, 196, 0, 0.75)', '#ffd84a');
        }

        if(model.layers.isVisible('decor'))
        {
            for(const o of this.sortedDecor(model)) this.drawObject(model, o);
        }

        if(model.layers.isVisible('wallDecor'))
        {
            for(const w of model.doc.wallDecor ?? [])
            {
                const h = tileAt(floor, w.x, w.y)?.height ?? 0;

                this.overlay(w.x, w.y, h, 'rgba(180, 120, 255, 0.5)', '#c9a0ff');
            }
        }

        const hover = model.hover;

        if(hover && model.ghost)
        {
            const h = tileAt(floor, hover.x, hover.y)?.height ?? 0;
            const pts = rhombus(hover.x, hover.y, model.ghost.width, model.ghost.length, h);

            tracePolygon(ctx, pts);
            ctx.fillStyle = 'rgba(120, 200, 255, 0.35)';
            ctx.fill();
            this.label(model.ghost.class, pts);
        }
        else if(hover)
        {
            this.overlay(hover.x, hover.y, tileAt(floor, hover.x, hover.y)?.height ?? 0, null, '#ffffff');
        }
    }

    private drawTile(model: IViewModel, x: number, y: number, t: ZoneTile, i: number): void
    {
        const ctx = this._ctx;
        const h = t.height ?? 0;
        const top = rhombus(x, y, 1, 1, h);

        if(t.hole)
        {
            tracePolygon(ctx, rhombus(x, y, 1, 1, 0));
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        else
        {
            const floor = model.doc.floor;
            const front = (nx: number, ny: number) =>
            {
                const n = tileAt(floor, nx, ny);

                return n && !n.hole ? n.height ?? 0 : -0.5;
            };

            // Left face down to the front-left neighbour, right face down to the front-right one.
            const left = h - front(x, y + 1);
            const right = h - front(x + 1, y);

            if(left > 0) this.face([top[6], top[7], top[4], top[5]], left * STEP, '#4a5a3a');
            if(right > 0) this.face([top[4], top[5], top[2], top[3]], right * STEP, '#3a4830');

            const light = Math.max(38, 62 - h * 1.2);

            tracePolygon(ctx, top);
            ctx.fillStyle = t.walkable === false ? `hsl(8, 45%, ${light - 10}%)` : `hsl(88, 28%, ${light}%)`;
            ctx.fill();
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        if(model.selectedCells.has(i)) this.overlay(x, y, h, 'rgba(255, 216, 74, 0.45)', '#ffd84a');
        if(model.strokeCells.has(i)) this.overlay(x, y, h, 'rgba(90, 200, 255, 0.45)', null);
    }

    private face(edge: number[], depth: number, color: string): void
    {
        const ctx = this._ctx;

        tracePolygon(ctx, [edge[0], edge[1], edge[2], edge[3], edge[2], edge[3] + depth, edge[0], edge[1] + depth]);
        ctx.fillStyle = color;
        ctx.fill();
    }

    private overlay(x: number, y: number, h: number, fill: string | null, stroke: string | null): void
    {
        const ctx = this._ctx;

        tracePolygon(ctx, rhombus(x, y, 1, 1, h));
        if(fill)
        {
            ctx.fillStyle = fill;
            ctx.fill();
        }
        if(stroke)
        {
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 2 / this._zoom;
            ctx.stroke();
        }
    }

    /** Back to front: the object whose front corner is nearer the viewer is drawn last. */
    private sortedDecor(model: IViewModel): ZoneDecorObject[]
    {
        const size = (o: ZoneDecorObject) => this.footprint(model, o);

        return [...model.doc.decor ?? []].sort((a, b) =>
        {
            const fa = size(a);
            const fb = size(b);

            return a.x + a.y + fa.width + fa.length - (b.x + b.y + fb.width + fb.length) || (a.z ?? 0) - (b.z ?? 0);
        });
    }

    private footprint(model: IViewModel, o: ZoneDecorObject): {width: number; length: number}
    {
        const entry = model.furniture(o.definition);

        return rotatedFootprint(entry ?? {width: 1, length: 1}, o.rotation);
    }

    /** Box height in pixels: the stack height when it has one, a token box otherwise. */
    private boxHeight(model: IViewModel, o: ZoneDecorObject): number
    {
        const stack = model.furniture(o.definition)?.stackHeight ?? 0;

        return Math.max(10, Math.min(4, stack) * STEP * 2);
    }

    /** Silhouette of the box: base left, bottom, right, then top right, top, top left. */
    private outline(model: IViewModel, o: ZoneDecorObject, dx: number, dy: number): number[]
    {
        const {width, length} = this.footprint(model, o);
        const b = rhombus(o.x + dx, o.y + dy, width, length, o.z ?? 0);
        const up = this.boxHeight(model, o);

        return [b[6], b[7], b[4], b[5], b[2], b[3], b[2], b[3] - up, b[0], b[1] - up, b[6], b[7] - up];
    }

    private drawObject(model: IViewModel, o: ZoneDecorObject): void
    {
        const ctx = this._ctx;
        const selected = model.selectedIds.has(o.id);
        const offset = selected ? model.dragOffset : null;
        const {width, length} = this.footprint(model, o);
        const base = rhombus(o.x + (offset?.dx ?? 0), o.y + (offset?.dy ?? 0), width, length, o.z ?? 0);
        const up = this.boxHeight(model, o);
        const top = base.map((v, i) => i % 2 ? v - up : v);
        const known = !!model.furniture(o.definition);
        const hue = known ? (o.locked ? 220 : 212) : 0;
        const sat = o.locked ? 8 : 45;

        this.face([base[6], base[7] - up, base[4], base[5] - up], up, `hsl(${hue}, ${sat}%, 38%)`);
        this.face([base[4], base[5] - up, base[2], base[3] - up], up, `hsl(${hue}, ${sat}%, 30%)`);
        tracePolygon(ctx, top);
        ctx.fillStyle = `hsl(${hue}, ${sat}%, ${offset ? 70 : 58}%)`;
        ctx.fill();

        if(selected)
        {
            tracePolygon(ctx, this.outline(model, o, offset?.dx ?? 0, offset?.dy ?? 0));
            ctx.strokeStyle = '#ffd84a';
            ctx.lineWidth = 2.5 / this._zoom;
            ctx.stroke();
        }

        this.label(o.class, top);
    }

    private label(text: string, pts: number[]): void
    {
        const ctx = this._ctx;
        const cx = (pts[0] + pts[4]) / 2;
        const cy = (pts[1] + pts[5]) / 2;

        ctx.font = `${Math.max(9, 11 / this._zoom)}px "Segoe UI", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 3 / this._zoom;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.strokeText(text, cx, cy - HALF_H / 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, cx, cy - HALF_H / 4);
    }

    private resize(): void
    {
        const parent = this._canvas.parentElement!;
        const dpr = window.devicePixelRatio || 1;

        this._canvas.width = Math.round(parent.clientWidth * dpr);
        this._canvas.height = Math.round(parent.clientHeight * dpr);
        this._canvas.style.width = `${parent.clientWidth}px`;
        this._canvas.style.height = `${parent.clientHeight}px`;
        if(!this._fitted) this.fit();
        this.draw();
    }

    private wheel(e: WheelEvent): void
    {
        e.preventDefault();

        const rect = this._canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const zoom = Math.min(3, Math.max(0.25, this._zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));

        this._ox = mx - (mx - this._ox) * zoom / this._zoom;
        this._oy = my - (my - this._oy) * zoom / this._zoom;
        this._zoom = zoom;
        this.draw();
    }

    private pointer(kind: PointerKind, e: PointerEvent): void
    {
        // Right or middle button pans; the left button belongs to the tools.
        if(kind === 'down' && e.button !== 0)
        {
            this._pan = {x: e.clientX - this._ox, y: e.clientY - this._oy};
            this._canvas.setPointerCapture(e.pointerId);

            return;
        }

        if(this._pan)
        {
            if(kind === 'up') this._pan = null;
            else
            {
                this._ox = e.clientX - this._pan.x;
                this._oy = e.clientY - this._pan.y;
                this.draw();
            }

            return;
        }

        if(kind === 'down') this._canvas.setPointerCapture(e.pointerId);

        this.onPointer(kind, this.pick(e.clientX, e.clientY), e);
    }
}
