import type {Container, Renderer} from 'pixi.js';
import type {IRoomInstance} from './IRoomInstance';
import type {IRoomRenderer} from './renderer/IRoomRenderer';
import {HabboRoomRenderer} from './scene/renderer/HabboRoomRenderer';
import type {RoomRenderingCanvas} from './scene/renderer/RoomRenderingCanvas';
import {RoomObjectVariableEnum} from './scene/object/RoomObjectVariableEnum';
import {applyDoorDisplacement} from './scene/RoomFloorBuilder';
import type {IRoomDoor} from './scene/RoomFloorBuilder';

/** A view of one room: what a host draws, points into and moves the camera of. */
export interface IIsoView
{
    /** For a PixiJS host (the client): add it to the stage. */
    readonly container: Container;
    resize(width: number, height: number): void;
    dispose(): void;
}

/** Canvas ids of the views of a room, as RoomEngine numbers its own. */
let nextCanvasId = 1;

/**
 * One rendering canvas of a room: RoomEngine.createRoomCanvas() without the mouse routing to the
 * game, which a view leaves to its host.
 */
export class IsoView implements IIsoView
{
    private readonly _renderer: IRoomRenderer;
    private readonly _canvas: RoomRenderingCanvas;
    private readonly _canvasId: number;
    private _disposed: boolean = false;

    private constructor(renderer: IRoomRenderer, canvas: RoomRenderingCanvas, canvasId: number)
    {
        this._renderer = renderer;
        this._canvas = canvas;
        this._canvasId = canvasId;
    }

    static create(room: IRoomInstance, door: IRoomDoor | null, width: number, height: number, scale: number, _pixi: Renderer | null): IsoView | null
    {
        let renderer = room.getRenderer() as IRoomRenderer | null;

        if(renderer === null)
        {
            renderer = new HabboRoomRenderer();
            renderer.roomObjectVariableAccurateZ = RoomObjectVariableEnum.OBJECT_ACCURATE_Z_VALUE;
            room.setRenderer(renderer);
        }

        const canvasId = nextCanvasId++;
        const canvas = renderer.createCanvas(canvasId, width, height, scale) as RoomRenderingCanvas | null;

        if(canvas === null) return null;

        applyDoorDisplacement(canvas.geometry, door);

        return new IsoView(renderer, canvas, canvasId);
    }

    get container(): Container
    {
        return this._canvas.container;
    }

    resize(width: number, height: number): void
    {
        this._canvas.initialize(width, height);
    }

    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this._renderer.disposeCanvas(this._canvasId);
    }
}
