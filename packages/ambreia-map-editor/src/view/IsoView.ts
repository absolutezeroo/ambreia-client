import type {ZoneDecorObject, ZoneFloor, ZoneTile} from '@ambreia/map-editor-core/zone/Zone.generated';
import {rotatedFootprint, tileAt} from '@ambreia/map-editor-core/zone/zoneGeometry';
import type {IFurnitureSprite} from './IFurnitureSprite';
import type {IPick} from './IPick';
import type {IViewModel} from './IViewModel';
import {HALF_H, inPolygon, project, rhombus, STEP, tracePolygon} from './isoMath';

type PointerKind = 'down' | 'move' | 'up';

/** Habbo's default wall: a little over three and a half floor levels above the floor. */
const WALL_HEIGHT = 3.6 * STEP;

/**
 * The editor's isometric view: tiles with their heights, the walls, player spawns, the door, and
 * each furni as the room draws it (vortex-imager), or as a box of its footprint while the image
 * loads. @ambreia/iso replaces the floor and walls with the room's own when J4 lands.
 */
export class IsoView
{
    onPointer: (kind: PointerKind, pick: IPick, e: PointerEvent) => void = () => undefined;
    /** The camera moved or zoomed: the mini-map and the zoom readout follow. */
    onViewChange: () => void = () => undefined;

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

    get zoom(): number
    {
        return this._zoom;
    }

    /** The visible part of the world, in world pixels (the projection's own units). */
    get viewport(): {x: number; y: number; width: number; height: number}
    {
        const stage = this._canvas.parentElement!;

        return {x: -this._ox / this._zoom, y: -this._oy / this._zoom, width: stage.clientWidth / this._zoom, height: stage.clientHeight / this._zoom};
    }

    setModel(model: IViewModel): void
    {
        this._model = model;
        if(!this._fitted) this.fit();
        this.draw();
    }

    /** Centres the floor in the stage. */
    fit(): void
    {
        // The stage, not the canvas: the canvas has no size of its own until the first resize.
        const stage = this._canvas.parentElement!;

        if(!this._model || !stage.clientWidth) return;

        const {width, length} = this._model.doc.floor;
        const [cx, cy] = project(width / 2, length / 2, 0);
        const span = width + length;

        this._zoom = Math.min(1.5, Math.max(0.25, Math.min(stage.clientWidth / (span * 36), stage.clientHeight / (span * 20 + WALL_HEIGHT))));
        this._ox = stage.clientWidth / 2 - cx * this._zoom;
        this._oy = stage.clientHeight / 2 - (cy - WALL_HEIGHT / 3) * this._zoom;
        this._fitted = true;
        this.onViewChange();
    }

    centerOn(x: number, y: number): void
    {
        const [sx, sy] = project(x + 0.5, y + 0.5, 0);

        this.centerOnWorld(sx, sy);
    }

    centerOnWorld(wx: number, wy: number): void
    {
        const stage = this._canvas.parentElement!;

        this._ox = stage.clientWidth / 2 - wx * this._zoom;
        this._oy = stage.clientHeight / 2 - wy * this._zoom;
        this.draw();
        this.onViewChange();
    }

    /** Zooms around the stage centre. */
    setZoom(zoom: number): void
    {
        const stage = this._canvas.parentElement!;

        this.zoomAt(zoom, stage.clientWidth / 2, stage.clientHeight / 2);
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

            if(!floor.tiles[i].hole && inPolygon(px, py, rhombus(x, y, 1, 1, floor.tiles[i].height ?? 0))) cell = {x, y};
        }

        // A hole has no floor to click, but the floor tools still need its cell.
        for(let i = floor.tiles.length - 1; i >= 0 && !cell; i--)
        {
            const x = i % floor.width;
            const y = Math.floor(i / floor.width);

            if(inPolygon(px, py, rhombus(x, y, 1, 1, 0))) cell = {x, y};
        }

        let objectId: string | null = null;

        if(model.layers.isVisible('decor'))
        {
            for(const o of this.sortedDecor(model).reverse())
            {
                if(this.hits(model, o, px, py))
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
        ctx.fillStyle = '#10131a';
        ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);

        const model = this._model;

        if(!model) return;

        ctx.setTransform(dpr * this._zoom, 0, 0, dpr * this._zoom, dpr * this._ox, dpr * this._oy);
        ctx.imageSmoothingEnabled = false;

        const floor = model.doc.floor;

        if(model.options.walls) this.drawWalls(floor);

        if(model.layers.isVisible('floor'))
        {
            floor.tiles.forEach((t, i) => this.drawTile(model, i % floor.width, Math.floor(i / floor.width), t, i));
        }

        if(model.layers.isVisible('door'))
        {
            const {x = 0, y = 0} = floor.door;

            this.overlay(x, y, tileAt(floor, x, y)?.height ?? 0, 'rgba(255, 196, 0, 0.55)', '#ffd84a');

            for(const e of model.doc.entries ?? [])
            {
                if(e.kind !== 'arrival') continue;

                const {x: ex = 0, y: ey = 0} = e.cell;

                this.overlay(ex, ey, tileAt(floor, ex, ey)?.height ?? 0, 'rgba(230, 60, 60, 0.6)', '#ff6b6b');
                this.label('spawn', rhombus(ex, ey, 1, 1, tileAt(floor, ex, ey)?.height ?? 0), '#ffd0d0');
            }
        }

        if(model.layers.isVisible('decor'))
        {
            for(const o of this.sortedDecor(model)) this.drawObject(model, o);
        }

        if(model.layers.isVisible('wallDecor'))
        {
            for(const w of model.doc.wallDecor ?? [])
            {
                this.overlay(w.x, w.y, tileAt(floor, w.x, w.y)?.height ?? 0, 'rgba(180, 120, 255, 0.5)', '#c9a0ff');
            }
        }

        this.drawHover(model);
    }

    private drawHover(model: IViewModel): void
    {
        const hover = model.hover;
        const floor = model.doc.floor;

        if(!hover) return;

        const h = tileAt(floor, hover.x, hover.y)?.height ?? 0;

        if(!model.ghost)
        {
            this.overlay(hover.x, hover.y, h, null, '#ffffff');

            return;
        }

        const sprite = model.options.sprites ? model.sprites.get(model.ghost.class, 0, 0) : null;

        this._ctx.globalAlpha = 0.6;
        if(sprite) this.drawSprite(sprite, hover.x, hover.y, h, 0, 0);
        else
        {
            tracePolygon(this._ctx, rhombus(hover.x, hover.y, model.ghost.width, model.ghost.length, h));
            this._ctx.fillStyle = 'rgba(120, 200, 255, 0.5)';
            this._ctx.fill();
        }
        this._ctx.globalAlpha = 1;
        this.overlay(hover.x, hover.y, h, null, '#7fd0ff');
    }

    /**
     * The back walls: a panel along every edge whose neighbour behind is missing and has nothing
     * further back either, the way a Habbo room is walled. The door's edge stays open.
     */
    private drawWalls(floor: ZoneFloor): void
    {
        const solid = (x: number, y: number) => !!tileAt(floor, x, y) && !tileAt(floor, x, y)!.hole;
        const {x: dx = 0, y: dy = 0} = floor.door;

        for(let y = 0; y < floor.length; y++)
        {
            for(let x = 0; x < floor.width; x++)
            {
                if(!solid(x, y)) continue;

                const h = tileAt(floor, x, y)!.height ?? 0;
                let open = true;

                for(let bx = x - 1; bx >= 0 && open; bx--) open = !solid(bx, y);
                if(open && !(x === dx && y === dy)) this.wall(project(x, y, h), project(x, y + 1, h), '#8d8a99', '#6f6c7a');

                open = true;
                for(let by = y - 1; by >= 0 && open; by--) open = !solid(x, by);
                if(open && !(x === dx && y === dy)) this.wall(project(x, y, h), project(x + 1, y, h), '#a8a5b4', '#87849a');
            }
        }
    }

    private wall(a: [number, number], b: [number, number], face: string, edge: string): void
    {
        const ctx = this._ctx;

        tracePolygon(ctx, [a[0], a[1], b[0], b[1], b[0], b[1] - WALL_HEIGHT, a[0], a[1] - WALL_HEIGHT]);
        ctx.fillStyle = face;
        ctx.fill();
        ctx.strokeStyle = edge;
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    private drawTile(model: IViewModel, x: number, y: number, t: ZoneTile, i: number): void
    {
        const ctx = this._ctx;
        const h = t.height ?? 0;
        const top = rhombus(x, y, 1, 1, h);

        if(t.hole)
        {
            tracePolygon(ctx, rhombus(x, y, 1, 1, 0));
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        else
        {
            const floor = model.doc.floor;
            const front = (nx: number, ny: number) =>
            {
                const n = tileAt(floor, nx, ny);

                return n && !n.hole ? n.height ?? 0 : -0.25;
            };

            // Left face down to the front-left neighbour, right face down to the front-right one.
            const left = h - front(x, y + 1);
            const right = h - front(x + 1, y);

            if(left > 0) this.face([top[6], top[7], top[4], top[5]], left * STEP, '#9c8a68');
            if(right > 0) this.face([top[4], top[5], top[2], top[3]], right * STEP, '#7c6c50');

            const light = Math.max(52, 80 - h * 2);

            tracePolygon(ctx, top);
            ctx.fillStyle = t.walkable === false ? `hsl(6, 40%, ${light - 18}%)` : `hsl(38, 30%, ${light}%)`;
            ctx.fill();

            if(model.options.grid)
            {
                ctx.strokeStyle = 'rgba(60, 45, 20, 0.28)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            if(model.options.heights)
            {
                ctx.font = '10px "Segoe UI", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = 'rgba(60, 40, 10, 0.75)';
                ctx.fillText(String(h), top[0], top[1] + HALF_H);
            }
        }

        if(model.selectedCells.has(i)) this.overlay(x, y, h, 'rgba(120, 180, 255, 0.45)', '#7fb4ff');
        if(model.strokeCells.has(i)) this.overlay(x, y, h, 'rgba(90, 220, 140, 0.45)', null);
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

    private sprite(model: IViewModel, o: ZoneDecorObject): IFurnitureSprite | null
    {
        return model.options.sprites ? model.sprites.get(o.class, o.rotation ?? 0, o.state ?? 0) : null;
    }

    /** Box height in pixels: the stack height when it has one, a token box otherwise. */
    private boxHeight(model: IViewModel, o: ZoneDecorObject): number
    {
        const stack = model.furniture(o.definition)?.stackHeight ?? 0;

        return Math.max(10, Math.min(4, stack) * STEP);
    }

    /** Silhouette of the box: base left, bottom, right, then top right, top, top left. */
    private outline(model: IViewModel, o: ZoneDecorObject, dx: number, dy: number): number[]
    {
        const {width, length} = this.footprint(model, o);
        const b = rhombus(o.x + dx, o.y + dy, width, length, o.z ?? 0);
        const up = this.boxHeight(model, o);

        return [b[6], b[7], b[4], b[5], b[2], b[3], b[2], b[3] - up, b[0], b[1] - up, b[6], b[7] - up];
    }

    private hits(model: IViewModel, o: ZoneDecorObject, px: number, py: number): boolean
    {
        const sprite = this.sprite(model, o);

        if(!sprite) return inPolygon(px, py, this.outline(model, o, 0, 0));

        const [cx, cy] = project(o.x + 0.5, o.y + 0.5, o.z ?? 0);
        const ix = Math.floor(px - (cx - sprite.anchorX));
        const iy = Math.floor(py - (cy - sprite.anchorY));
        const {width, height} = sprite.image;

        return ix >= 0 && iy >= 0 && ix < width && iy < height && sprite.alpha[iy * width + ix] > 40;
    }

    private drawSprite(sprite: IFurnitureSprite, x: number, y: number, z: number, dx: number, dy: number): void
    {
        const [cx, cy] = project(x + dx + 0.5, y + dy + 0.5, z);

        this._ctx.drawImage(sprite.image, Math.round(cx - sprite.anchorX), Math.round(cy - sprite.anchorY));
    }

    private drawObject(model: IViewModel, o: ZoneDecorObject): void
    {
        const ctx = this._ctx;
        const selected = model.selectedIds.has(o.id);
        const offset = selected ? model.dragOffset : null;
        const dx = offset?.dx ?? 0;
        const dy = offset?.dy ?? 0;
        const {width, length} = this.footprint(model, o);
        const base = rhombus(o.x + dx, o.y + dy, width, length, o.z ?? 0);
        const sprite = this.sprite(model, o);

        if(selected)
        {
            tracePolygon(ctx, base);
            ctx.fillStyle = 'rgba(80, 170, 255, 0.35)';
            ctx.fill();
            ctx.strokeStyle = '#4fb0ff';
            ctx.lineWidth = 2 / this._zoom;
            ctx.stroke();
        }

        if(sprite)
        {
            if(offset) ctx.globalAlpha = 0.75;
            this.drawSprite(sprite, o.x, o.y, o.z ?? 0, dx, dy);
            ctx.globalAlpha = 1;
            if(o.locked) this.label('🔒', base, '#ffffff');

            return;
        }

        const up = this.boxHeight(model, o);
        const top = base.map((v, i) => i % 2 ? v - up : v);
        const known = !!model.furniture(o.definition);
        const hue = known ? 212 : 0;
        const sat = o.locked ? 8 : 45;

        this.face([base[6], base[7] - up, base[4], base[5] - up], up, `hsl(${hue}, ${sat}%, 38%)`);
        this.face([base[4], base[5] - up, base[2], base[3] - up], up, `hsl(${hue}, ${sat}%, 30%)`);
        tracePolygon(ctx, top);
        ctx.fillStyle = `hsl(${hue}, ${sat}%, ${offset ? 70 : 58}%)`;
        ctx.fill();

        if(selected)
        {
            tracePolygon(ctx, this.outline(model, o, dx, dy));
            ctx.strokeStyle = '#ffd84a';
            ctx.lineWidth = 2.5 / this._zoom;
            ctx.stroke();
        }

        this.label(o.class, top, '#ffffff');
    }

    private label(text: string, pts: number[], color: string): void
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
        ctx.fillStyle = color;
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
        this.onViewChange();
    }

    private wheel(e: WheelEvent): void
    {
        e.preventDefault();

        const rect = this._canvas.getBoundingClientRect();

        this.zoomAt(this._zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX - rect.left, e.clientY - rect.top);
    }

    private zoomAt(target: number, mx: number, my: number): void
    {
        const zoom = Math.min(3, Math.max(0.25, target));

        this._ox = mx - (mx - this._ox) * zoom / this._zoom;
        this._oy = my - (my - this._oy) * zoom / this._zoom;
        this._zoom = zoom;
        this.draw();
        this.onViewChange();
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
                this.onViewChange();
            }

            return;
        }

        if(kind === 'down') this._canvas.setPointerCapture(e.pointerId);

        this.onPointer(kind, this.pick(e.clientX, e.clientY), e);
    }
}
