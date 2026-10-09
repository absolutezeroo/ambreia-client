import type {ZoneDecorObject, ZoneFloor, ZoneTile} from '@ambreia/map-editor-core/zone/Zone.generated';
import {MAX_SIZE, rotatedFootprint, tileAt} from '@ambreia/map-editor-core/zone/zoneGeometry';
import type {IFurnitureSprite} from './IFurnitureSprite';
import type {IsoBackdrop} from './IsoBackdrop';
import type {IPick} from './IPick';
import type {IViewModel} from './IViewModel';
import {HALF_H, HALF_W, inPolygon, project, rhombus, STEP, surfaceOutline, tracePolygon, traceSurface} from './isoMath';
import {WorldOverlayPainter} from './WorldOverlayPainter';

type PointerKind = 'down' | 'move' | 'up';

/** Habbo's default wall: a little over three and a half floor levels above the floor. */
const WALL_HEIGHT = 3.6 * STEP;

/**
 * The editor's isometric view: the room as the game draws it (@ambreia/iso, see IsoBackdrop) with
 * the editor's marks over it -- selection, door, spawns, world layers. Without iso (no asset
 * server, a zone it refuses) the view draws the room itself: tiles with their heights, the walls,
 * and each furni as vortex-imager draws it, or as a box of its footprint while the image loads.
 */
export class IsoView
{
    onPointer: (kind: PointerKind, pick: IPick, e: MouseEvent) => void = () => undefined;
    /** The camera moved or zoomed: the mini-map and the zoom readout follow. */
    onViewChange: () => void = () => undefined;

    private readonly _ctx: CanvasRenderingContext2D;
    private readonly _world: WorldOverlayPainter;
    private _model: IViewModel | null = null;
    private _zoom = 1;
    private _ox = 0;
    private _oy = 0;
    private _pan: {x: number; y: number} | null = null;
    private _fitted = false;
    private _width = 1;
    private _height = 1;
    /** This frame's room comes from the backdrop: draw only the editor's marks over it. */
    private _real = false;
    /** The highest tile this frame (at least 1), the top of the grid's violet scale. */
    private _topLevel = 1;
    // nearestFirst()'s order, for a floor of _nearestWidth × _nearest.length / _nearestWidth.
    private _nearest: number[] = [];
    private _nearestWidth = 0;

    /** The room as the game draws it; null until it loads, and when it cannot. */
    backdrop: IsoBackdrop | null = null;

    /**
     * The view draws into its own canvas, which is not in the page: the window system shows it in
     * the owner's viewport (a display object wrapper) and the host forwards the pointer, in the
     * view's own coordinates.
     */
    readonly canvas = document.createElement('canvas');

    constructor()
    {
        this._ctx = this.canvas.getContext('2d')!;
        this._world = new WorldOverlayPainter(this._ctx);
    }

    /** The size of the window that shows the view. */
    setSize(width: number, height: number): void
    {
        if(width === this._width && height === this._height) return;

        this._width = Math.max(1, Math.round(width));
        this._height = Math.max(1, Math.round(height));
        this.canvas.width = this._width;
        this.canvas.height = this._height;
        if(!this._fitted) this.fit();
        this.draw();
        this.onViewChange();
    }

    get zoom(): number
    {
        return this._zoom;
    }

    /** The visible part of the world, in world pixels (the projection's own units). */
    get viewport(): {x: number; y: number; width: number; height: number}
    {
        return {x: -this._ox / this._zoom, y: -this._oy / this._zoom, width: this._width / this._zoom, height: this._height / this._zoom};
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
        const stage = {clientWidth: this._width, clientHeight: this._height};

        if(!this._model || this._width <= 1) return;

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
        const stage = {clientWidth: this._width, clientHeight: this._height};

        this._ox = stage.clientWidth / 2 - wx * this._zoom;
        this._oy = stage.clientHeight / 2 - wy * this._zoom;
        this.draw();
        this.onViewChange();
    }

    /** Zooms around the stage centre. */
    setZoom(zoom: number): void
    {
        const stage = {clientWidth: this._width, clientHeight: this._height};

        this.zoomAt(zoom, stage.clientWidth / 2, stage.clientHeight / 2);
    }

    /** What lies under (x, y), in the view's own coordinates. */
    pick(x: number, y: number): IPick
    {
        const model = this._model;

        if(!model) return {cell: null, objectId: null};

        const px = (x - this._ox) / this._zoom;
        const py = (y - this._oy) / this._zoom;
        const floor = model.doc.floor;
        let cell: IPick['cell'] = null;

        // Nearest first (larger x + y): a raised tile's top is its cell, but its sides are a wall,
        // as iso draws them down to the floors in front: pointing at one picks nothing, neither the
        // block nor what it hides (the level cut, Page Down, reaches that).
        let wall = false;

        for(const i of this.nearestFirst(floor))
        {
            const t = floor.tiles[i];

            if(t.hole || !this.shown(model, t)) continue;

            const x = i % floor.width;
            const y = Math.floor(i / floor.width);
            const top = rhombus(x, y, 1, 1, t.height ?? 0);

            if(inPolygon(px, py, top))
            {
                cell = {x, y};
                break;
            }

            if(this.onSide(model, x, y, top, px, py))
            {
                wall = true;
                break;
            }
        }

        if(wall) return {cell: null, objectId: this.realRoom(model) && model.layers.isVisible('decor') ? this.backdrop!.pick(x, y) : null};

        // A hole has no floor to click, but the floor tools still need its cell.
        for(let i = floor.tiles.length - 1; i >= 0 && !cell; i--)
        {
            const x = i % floor.width;
            const y = Math.floor(i / floor.width);

            if(inPolygon(px, py, rhombus(x, y, 1, 1, 0))) cell = {x, y};
        }

        // Past the far edges: the cell a floor tool would grow the floor to (project() inverted at 0).
        if(!cell)
        {
            const x = Math.floor((px / HALF_W + py / HALF_H) / 2);
            const y = Math.floor((py / HALF_H - px / HALF_W) / 2);

            if(x >= 0 && y >= 0 && x < MAX_SIZE && y < MAX_SIZE) cell = {x, y};
        }

        let objectId: string | null = null;

        if(model.layers.isVisible('decor') && this.realRoom(model))
        {
            objectId = this.backdrop!.pick(x, y);
        }
        else if(model.layers.isVisible('decor'))
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
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = '#10131a';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const model = this._model;

        if(!model) return;

        this._real = false;

        if(this.realRoom(model))
        {
            // The game's own cursor on a bare hover; a furni being placed is drawn by the room, with
            // the editor's outline.
            const hover = model.hover;
            const ghost = model.ghost && hover && model.layers.isVisible('decor') ? model.ghost : null;

            // The game's cursor is a flat sprite: on a stair tile drawHover() draws one that steps.
            this.backdrop!.setCursor(ghost || (hover && this.stepped(hover.x, hover.y)) ? null : hover);
            this.backdrop!.setGhost(ghost && hover && {
                definition: ghost.definition,
                class: ghost.class,
                x: hover.x,
                y: hover.y,
                z: tileAt(model.doc.floor, hover.x, hover.y)?.height ?? 0,
                rotation: 0
            });

            const room = this.backdrop!.render(this._width, this._height, this._zoom, this._ox, this._oy);

            if(room)
            {
                ctx.drawImage(room, 0, 0);
                this._real = true;
            }
        }

        ctx.setTransform(this._zoom, 0, 0, this._zoom, this._ox, this._oy);
        ctx.imageSmoothingEnabled = false;

        const floor = model.doc.floor;

        if(model.options.walls && !this._real) this.drawWalls(floor);

        if(model.layers.isVisible('floor'))
        {
            this._topLevel = Math.max(1, ...floor.tiles.map(t => (t.hole ? 0 : t.height ?? 0)));
            floor.tiles.forEach((t, i) => this.drawTile(model, i % floor.width, Math.floor(i / floor.width), t, i));

            for(const c of model.stroke) this.overlay(c.x, c.y, tileAt(floor, c.x, c.y)?.height ?? 0, 'rgba(90, 220, 140, 0.45)', '#5adc8c');
        }

        if(model.layers.isVisible('floor'))
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

        if(model.layers.isVisible('decor'))
        {
            for(const w of model.doc.wallDecor ?? [])
            {
                this.overlay(w.x, w.y, tileAt(floor, w.x, w.y)?.height ?? 0, 'rgba(180, 120, 255, 0.5)', '#c9a0ff');
            }
        }

        this._world.draw(model, this._zoom);
        this.drawHover(model);
    }

    /** The floor's tile indices, nearest first (larger x + y); kept while the size is the same. */
    private nearestFirst(floor: ZoneFloor): number[]
    {
        if(this._nearest.length !== floor.tiles.length || this._nearestWidth !== floor.width)
        {
            this._nearestWidth = floor.width;
            this._nearest = floor.tiles.map((_, i) => i).sort((a, b) =>
                (b % floor.width + Math.floor(b / floor.width)) - (a % floor.width + Math.floor(a / floor.width)));
        }

        return this._nearest;
    }

    /** True when (px, py) is on a side iso draws for tile (x, y), down to its front floors. */
    private onSide(model: IViewModel, x: number, y: number, top: number[], px: number, py: number): boolean
    {
        const floor = model.doc.floor;
        const h = tileAt(floor, x, y)?.height ?? 0;
        const below = (bx: number, by: number): number =>
        {
            const n = tileAt(floor, bx, by);

            return n && !n.hole && this.shown(model, n) ? Math.min(h, n.height ?? 0) : 0;
        };
        const side = (a: number, b: number, depth: number): number[] =>
            [top[a], top[a + 1], top[b], top[b + 1], top[b], top[b + 1] + depth, top[a], top[a + 1] + depth];
        const left = (h - below(x, y + 1)) * STEP;
        const right = (h - below(x + 1, y)) * STEP;

        return (left > 0 && inPolygon(px, py, side(6, 4, left))) || (right > 0 && inPolygon(px, py, side(4, 2, right)));
    }

    /** False for a tile off the level shown (IViewOptions.level). */
    private shown(model: IViewModel, t: ZoneTile): boolean
    {
        return model.options.level === null || (t.height ?? 0) === model.options.level;
    }

    /** Tile (x, y)'s floor as the room draws it when it is not flat (a stair quarter ramp), else null. */
    private stepped(x: number, y: number): number[] | null
    {
        const surface = this.backdrop?.tileSurface(x, y) ?? null;

        return surface && surface.some(h => h !== surface[0]) ? surface : null;
    }

    /** The backdrop draws the room when it is loaded and the furni view is on (Affichage). */
    private realRoom(model: IViewModel): boolean
    {
        return !!this.backdrop?.ready && model.options.sprites;
    }

    private drawHover(model: IViewModel): void
    {
        const hover = model.hover;
        const floor = model.doc.floor;

        if(!hover) return;

        const tile = tileAt(floor, hover.x, hover.y);
        const h = tile?.height ?? 0;

        if(!model.ghost)
        {
            // The game's cursor only stands on flat floor: a stair tile gets one in its colours that
            // follows the quarters, the void and holes the editor's outline.
            const surface = this._real ? this.stepped(hover.x, hover.y) : null;

            if(surface)
            {
                traceSurface(this._ctx, hover.x, hover.y, surface);
                this._ctx.fillStyle = 'rgb(209, 177, 46)';
                this._ctx.fill('nonzero');
                tracePolygon(this._ctx, surfaceOutline(hover.x, hover.y, surface));
                this._ctx.strokeStyle = 'rgb(255, 216, 74)';
                this._ctx.lineWidth = 2 / this._zoom;
                this._ctx.stroke();
            }
            else if(!this._real || !tile || tile.hole) this.overlay(hover.x, hover.y, h, null, '#ffffff');

            return;
        }

        // With the room drawn by iso the ghost is one of its furni (IsoBackdrop.setGhost).
        if(!this._real)
        {
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
        }

        const {width, length} = rotatedFootprint(model.ghost, 0);

        tracePolygon(this._ctx, rhombus(hover.x, hover.y, width, length, h));
        this._ctx.strokeStyle = '#7fd0ff';
        this._ctx.lineWidth = 2 / this._zoom;
        this._ctx.stroke();
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

        if(!this.shown(model, t)) return;
        const top = rhombus(x, y, 1, 1, h);

        if(this._real)
        {
            if(model.options.grid && !t.hole)
            {
                // Over the floor as drawn, so it follows the stair quarters. The higher the tile (against
                // the map's highest), the more violet its top and lines: the ground stays as it is.
                const surface = this.backdrop!.tileSurface(x, y);
                const level = h / this._topLevel;

                if(level > 0)
                {
                    if(surface) traceSurface(ctx, x, y, surface);
                    else tracePolygon(ctx, top);
                    ctx.fillStyle = `rgba(150, 70, 255, ${0.15 + 0.35 * level})`;
                    ctx.fill('nonzero');
                }

                tracePolygon(ctx, surface ? surfaceOutline(x, y, surface) : top);
                ctx.strokeStyle = `rgba(${255 - 85 * level}, ${255 - 165 * level}, 255, ${0.18 + 0.47 * level})`;
                ctx.lineWidth = 1 / this._zoom;
                ctx.stroke();
            }
            if(model.options.heights && !t.hole) this.heightLabel(top, h);
        }
        else if(t.hole)
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

            if(model.options.heights) this.heightLabel(top, h);
        }

        if(model.selectedCells.has(i)) this.overlay(x, y, h, 'rgba(120, 180, 255, 0.45)', '#7fb4ff');
    }

    private heightLabel(top: number[], h: number): void
    {
        const ctx = this._ctx;

        ctx.font = '10px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = this._real ? 'rgba(255, 255, 255, 0.85)' : 'rgba(60, 40, 10, 0.75)';
        ctx.fillText(String(h), top[0], top[1] + HALF_H);
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

        if(this._real)
        {
            // The room draws the furni where it stands; a dragged one shows where it would land.
            if(offset && sprite)
            {
                ctx.globalAlpha = 0.75;
                this.drawSprite(sprite, o.x, o.y, o.z ?? 0, dx, dy);
                ctx.globalAlpha = 1;
            }
            if(o.locked) this.label('🔒', base, '#ffffff');

            return;
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

    /** The wheel over the view zooms around the pointer. */
    wheel(deltaY: number, x: number, y: number): void
    {
        this.zoomAt(this._zoom * (deltaY < 0 ? 1.15 : 1 / 1.15), x, y);
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

    /** A pointer event from the host, in the view's coordinates. Right or middle button pans. */
    pointer(kind: PointerKind, x: number, y: number, e: MouseEvent): void
    {
        if(kind === 'down' && e.button !== 0)
        {
            this._pan = {x: x - this._ox, y: y - this._oy};

            return;
        }

        if(this._pan)
        {
            if(kind === 'up') this._pan = null;
            else
            {
                this._ox = x - this._pan.x;
                this._oy = y - this._pan.y;
                this.draw();
                this.onViewChange();
            }

            return;
        }

        this.onPointer(kind, this.pick(x, y), e);
    }
}
