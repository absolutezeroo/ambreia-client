import type {Container, Renderer} from 'pixi.js';
import type {IRoomInstance} from './IRoomInstance';
import type {IRoomObject} from './object/IRoomObject';
import type {IRoomRenderer} from './renderer/IRoomRenderer';
import type {IRoomGeometry} from './utils/IRoomGeometry';
import type {IRoomRenderingCanvasMouseListener} from './renderer/IRoomRenderingCanvasMouseListener';
import type {RoomSpriteMouseEvent} from './events/RoomSpriteMouseEvent';
import {Vector3d} from './utils/Vector3d';
import {HabboRoomRenderer} from './scene/renderer/HabboRoomRenderer';
import type {RoomRenderingCanvas} from './scene/renderer/RoomRenderingCanvas';
import type {RoomLighting} from './scene/renderer/RoomLighting';
import {RoomObjectVariableEnum} from './scene/object/RoomObjectVariableEnum';
import {RoomObjectCategoryEnum} from './scene/object/RoomObjectCategoryEnum';
import {applyDoorDisplacement} from './scene/RoomFloorBuilder';
import type {IRoomDoor} from './scene/RoomFloorBuilder';

/** What is under a point of the view: the topmost item, and the tile below it. */
export interface IIsoPick
{
    tile: {x: number; y: number} | null;
    itemId: string | number | null;
}

/** A view of one room: what a host draws, points into and moves the camera of. */
export interface IIsoView
{
    /** For a PixiJS host (the client): add it to the stage. */
    readonly container: Container;
    /** For a host without PixiJS (the map editor): draws the view and returns its canvas. */
    render(): HTMLCanvasElement;
    /** View pixels → the topmost item by sprite alpha (the renderer's own hit walk), and the tile under the point. */
    pick(x: number, y: number): IIsoPick;
    /** A room position (tiles, height in tiles) → view pixels, for the host's overlays. */
    tileToView(x: number, y: number, z: number): {x: number; y: number};
    /** Camera: pan in view pixels, zoom around the view's centre (1 = the geometry's own scale). */
    panX: number;
    panY: number;
    scale: number;
    resize(width: number, height: number): void;
    /** The room's light over this view (RoomLighting); null: lit by day. */
    lighting: RoomLighting | null;
    dispose(): void;
}

/** The parts of a loaded room a view reads: its floor (for picking tiles) and its item ids. */
export interface IIsoViewRoom
{
    readonly instance: IRoomInstance;
    readonly door: IRoomDoor | null;
    readonly width: number;
    readonly length: number;
    /** Height of a tile, in tiles; a hole counts as 0 (the editor points at holes too). */
    heightAt(x: number, y: number): number;
    /** True where the floor is raised above the room's lowest (RoomRenderingCanvas.raisedFloorAt). */
    raisedAt(x: number, y: number): boolean;
    /** The editor's id of an internal object id, or null. */
    itemIdOf(id: number): string | number | null;
}

/** Canvas ids of the views of a room, as RoomEngine numbers its own. */
let nextCanvasId = 1;

/**
 * One rendering canvas of a room: RoomEngine.createRoomCanvas() without the mouse routing to the
 * game. Its mouse listener is itself, used only by pick().
 */
export class IsoView implements IIsoView, IRoomRenderingCanvasMouseListener
{
    private readonly _room: IIsoViewRoom;
    private readonly _renderer: IRoomRenderer;
    private readonly _canvas: RoomRenderingCanvas;
    private readonly _canvasId: number;
    private readonly _pixi: () => Renderer | null;
    private _width: number;
    private _height: number;
    private _picked: IRoomObject | null = null;
    private _picking: boolean = false;
    private _disposed: boolean = false;

    private constructor(room: IIsoViewRoom, renderer: IRoomRenderer, canvas: RoomRenderingCanvas, canvasId: number, width: number, height: number, pixi: () => Renderer | null)
    {
        this._room = room;
        this._renderer = renderer;
        this._canvas = canvas;
        this._canvasId = canvasId;
        this._width = width;
        this._height = height;
        this._pixi = pixi;
    }

    static create(room: IIsoViewRoom, width: number, height: number, scale: number, pixi: () => Renderer | null): IsoView | null
    {
        let renderer = room.instance.getRenderer() as IRoomRenderer | null;

        if(renderer === null)
        {
            renderer = new HabboRoomRenderer();
            renderer.roomObjectVariableAccurateZ = RoomObjectVariableEnum.OBJECT_ACCURATE_Z_VALUE;
            room.instance.setRenderer(renderer);
        }

        const canvasId = nextCanvasId++;
        const canvas = renderer.createCanvas(canvasId, width, height, scale) as RoomRenderingCanvas | null;

        if(canvas === null) return null;

        applyDoorDisplacement(canvas.geometry, room.door);
        canvas.raisedFloorAt = (x: number, y: number): boolean => room.raisedAt(x, y);
        canvas.pixiRenderer = pixi;

        const view = new IsoView(room, renderer, canvas, canvasId, width, height, pixi);

        canvas.mouseListener = view;

        return view;
    }

    get container(): Container
    {
        return this._canvas.container;
    }

    get panX(): number
    {
        return this._canvas.screenOffsetX;
    }

    set panX(value: number)
    {
        this._canvas.screenOffsetX = value;
    }

    get panY(): number
    {
        return this._canvas.screenOffsetY;
    }

    set panY(value: number)
    {
        this._canvas.screenOffsetY = value;
    }

    get scale(): number
    {
        return this._canvas.scale;
    }

    set scale(value: number)
    {
        this._canvas.setScale(value);
    }

    render(): HTMLCanvasElement
    {
        const pixi = this._pixi();

        if(pixi === null) throw new Error('IsoView.render() needs a PixiJS renderer: pass `renderer` to IsoStage.create()');

        if(pixi.width !== this._width || pixi.height !== this._height) pixi.resize(this._width, this._height);

        pixi.render({container: this._canvas.container, clear: true});

        return pixi.canvas as HTMLCanvasElement;
    }

    /**
     * The canvas's own placement of a room position (`avatarNearViewport()`'s arithmetic): the
     * geometry's screen point, centred in the view, zoomed, then panned.
     */
    tileToView(x: number, y: number, z: number): {x: number; y: number}
    {
        const point = this._canvas.geometry.getScreenPoint(new Vector3d(x, y, z));

        if(point === null) return {x: Number.NaN, y: Number.NaN};

        return {
            x: (point.x + Math.floor(this._width / 2)) * this._canvas.scale + this._canvas.screenOffsetX,
            y: (point.y + Math.floor(this._height / 2)) * this._canvas.scale + this._canvas.screenOffsetY
        };
    }

    pick(x: number, y: number): IIsoPick
    {
        this._picked = null;
        this._picking = true;

        try
        {
            this._canvas.handleMouseEvent(x, y, 'click');
        }
        finally
        {
            this._picking = false;
        }

        const item = this._picked as IRoomObject | null;
        const itemId = item === null ? null : this._room.itemIdOf(item.getId());

        return {tile: this.tileAt(x, y), itemId};
    }

    /** The renderer's hit walk goes top to bottom: the first furni or wall item met is the topmost. */
    processRoomCanvasMouseEvent(event: RoomSpriteMouseEvent, object: IRoomObject, _geometry: IRoomGeometry): void
    {
        // The walk also rolls out what the previous point was over: only what is hit now counts.
        if(!this._picking || this._picked !== null || event.type === 'rollOut') return;

        const id = object.getId();
        const instance = this._room.instance;

        if(instance.getObject(id, RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE) === object
            || instance.getObject(id, RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL) === object)
        {
            this._picked = object;
        }
    }

    get lighting(): RoomLighting | null
    {
        return this._canvas.lighting;
    }

    set lighting(value: RoomLighting | null)
    {
        this._canvas.lighting = value;
    }

    resize(width: number, height: number): void
    {
        this._width = width;
        this._height = height;
        this._canvas.initialize(width, height);
    }

    /**
     * The tile whose diamond holds the point, the front-most when heights overlap (front = larger
     * x + y, drawn last). The planes' own hit data would also answer, but only where a plane is
     * drawn; the editor points at holes and blocked tiles too.
     */
    // ponytail: scans every tile (64 × 64 at most) per call; a cell index if picking runs per frame on big rooms.
    private tileAt(x: number, y: number): {x: number; y: number} | null
    {
        let best: {x: number; y: number} | null = null;

        for(let ty = 0; ty < this._room.length; ty++)
        {
            for(let tx = 0; tx < this._room.width; tx++)
            {
                const z = this._room.heightAt(tx, ty);

                if(this.insideTile(x, y, tx, ty, z) && (best === null || tx + ty >= best.x + best.y)) best = {x: tx, y: ty};
            }
        }

        return best;
    }

    private insideTile(px: number, py: number, tx: number, ty: number, z: number): boolean
    {
        const a = this.tileToView(tx - 0.5, ty - 0.5, z);
        const b = this.tileToView(tx + 0.5, ty - 0.5, z);
        const c = this.tileToView(tx + 0.5, ty + 0.5, z);
        const d = this.tileToView(tx - 0.5, ty + 0.5, z);

        return insideTriangle(px, py, a, b, c) || insideTriangle(px, py, a, c, d);
    }

    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this._canvas.mouseListener = null;
        this._renderer.disposeCanvas(this._canvasId);
    }
}

function insideTriangle(px: number, py: number, a: {x: number; y: number}, b: {x: number; y: number}, c: {x: number; y: number}): boolean
{
    const side = (p: {x: number; y: number}, q: {x: number; y: number}): number => (q.x - p.x) * (py - p.y) - (q.y - p.y) * (px - p.x);
    const d1 = side(a, b);
    const d2 = side(b, c);
    const d3 = side(c, a);

    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}
