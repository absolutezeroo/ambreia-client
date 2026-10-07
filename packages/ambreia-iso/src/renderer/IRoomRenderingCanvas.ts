/**
 * IRoomRenderingCanvas
 *
 * Based on AS3: com.sulake.room.renderer.IRoomRenderingCanvas
 *
 * Interface for a rendering canvas that displays room objects as sprites.
 * Handles rendering, mouse events, scaling, and viewport management.
 *
 * @see sources/win63_version/room/renderer/IRoomRenderingCanvas.as
 */
import type {Container, Renderer} from 'pixi.js';
import type {IRoomGeometry} from '../utils/IRoomGeometry';
import type {IRoomRenderingCanvasMouseListener} from './IRoomRenderingCanvasMouseListener';
import type {RoomObjectSpriteData} from '@ambreia/common/graphics/RoomObjectSpriteData';

export interface IRoomRenderingCanvas
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/IRoomRenderingCanvas.as::get width()
    readonly width: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/IRoomRenderingCanvas.as::get height()
    readonly height: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/IRoomRenderingCanvas.as::get screenOffsetX()
    screenOffsetX: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/IRoomRenderingCanvas.as::get screenOffsetY()
    screenOffsetY: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/IRoomRenderingCanvas.as::get scale()
    readonly scale: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/IRoomRenderingCanvas.as::get geometry()
    readonly geometry: IRoomGeometry;

    mouseListener: IRoomRenderingCanvasMouseListener | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/IRoomRenderingCanvas.as::useMask
    useMask: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/IRoomRenderingCanvas.as::fpsCounterEnabled
    fpsCounterEnabled: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/IRoomRenderingCanvas.as::initialize()
    initialize(width: number, height: number): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/IRoomRenderingCanvas.as::render()
    render(time: number, force?: boolean): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/IRoomRenderingCanvas.as::handleMouseEvent()
    handleMouseEvent(
        x: number,
        y: number,
        type: string,
        altKey: boolean,
        ctrlKey: boolean,
        shiftKey: boolean,
        buttonDown: boolean
    ): boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/IRoomRenderingCanvas.as::setScale()
    setScale(scale: number, point?: { x: number; y: number } | null, offset?: { x: number; y: number } | null): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/IRoomRenderingCanvas.as::getId()
    getId(): number;

    update(): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/IRoomRenderingCanvas.as::takeScreenShot()
    // AS3 signature takes no arguments (Flash's Stage/DisplayObject could be
    // rasterized directly). PixiJS extraction requires an explicit Renderer,
    // which this engine-side class doesn't own, so the caller must supply one.
    takeScreenShot(renderer: Renderer): HTMLCanvasElement;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/IRoomRenderingCanvas.as::skipSpriteVisibilityChecking()
    skipSpriteVisibilityChecking(): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/IRoomRenderingCanvas.as::resumeSpriteVisibilityChecking()
    resumeSpriteVisibilityChecking(): void;

    /**
	 * The container this canvas draws into — AS3's `displayObject`, a PixiJS Container here.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/IRoomRenderingCanvas.as::get displayObject()
    readonly container: Container;

    /**
	 * Latest measured round-trip to the server, stored for a debug overlay to print.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/IRoomRenderingCanvas.as::set pingMs()
    pingMs: number;

    /**
	 * Every drawn sprite as a flat payload record — the room-photo serialisation, not the draw
	 * order. `RoomObjectSpriteData` lives in `room/data/` exactly as AS3's does, so declaring it
	 * here inverts no layering.
	 */
    // AS3: .../src/com/sulake/room/renderer/IRoomRenderingCanvas.as::getSortableSpriteList()
    getSortableSpriteList(): RoomObjectSpriteData[];

    // DEVIATION: AS3 returns an untyped `Array` of its own `SortableSprite`s. Declaring that here
    //   would pull `SortableSprite` — the renderer's draw-order record, in
    //   `habbo/room/renderer/utils/` — into this generic `room/` interface, which is the inversion
    //   `.claude/rules/room.md` forbids. `RoomRenderingCanvas` declares it, and its one consumer
    //   holds the concrete canvas. Unlike its sibling above there is no `room/`-layer type to
    //   return: AS3's untyped Array is what hides that.
    // AS3: .../src/com/sulake/room/renderer/IRoomRenderingCanvas.as::getPlaneSortableSprites()

    dispose(): void;
}
