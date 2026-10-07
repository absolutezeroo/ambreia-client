import type {IHabboWindowManager} from '@habbo/window';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {WindowController} from '@ambreia/ui/WindowController';
import type {WindowMouseOperator} from '@ambreia/ui/services/WindowMouseOperator';
import {WindowMouseEvent} from '@ambreia/ui/events/WindowMouseEvent';
import {NativeWheelDelta} from '@ambreia/ui/utils/NativeWheelDelta';
import {Logger} from '@ambreia/common/utils/Logger';

const log = Logger.getLogger('glaze.canvas.CanvasSurface');

/**
 * CanvasSurface — the live window preview area.
 *
 * Owns a 2D `<canvas>` sized to its host container, runs the engine composite
 * loop (`WindowRenderer.render()` → `windowManager.compositeToBuffer()` →
 * `ctx.drawImage`), keeps the four desktop layers sized to the canvas, and
 * forwards DOM mouse events to the window tree via `findWindowAtPoint`.
 *
 * The mouse/render logic is lifted from vortex-client/src/App.ts (which does
 * the same thing full-screen); here it is scoped to a sub-region so the editor
 * chrome can surround it. When live forwarding is disabled (editor "pick" mode),
 * DOM events are ignored so an overlay can drive selection instead.
 */
export class CanvasSurface
{
    private readonly _windowManager: IHabboWindowManager;
    private readonly _host: HTMLElement;

    private _canvas: HTMLCanvasElement | null = null;
    private _ctx: CanvasRenderingContext2D | null = null;
    private _animFrameId: number = 0;
    private _compositeDirty: boolean = true;
    private _lastRenderVersion: number = -1;
    private _resizeObserver: ResizeObserver | null = null;
    private _disposed: boolean = false;
    private _forwardMouse: boolean = true;

    private _lastHoveredWindow: IWindow | null = null;
    private _mouseDownWindow: IWindow | null = null;
    private _docMoveHandler: ((e: MouseEvent) => void) | null = null;
    private _docUpHandler: ((e: MouseEvent) => void) | null = null;
    private _overlayPainter: ((ctx: CanvasRenderingContext2D, w: number, h: number) => void) | null = null;
    private _bgPainter: ((ctx: CanvasRenderingContext2D, w: number, h: number) => void) | null = null;
    private _coordMapper: ((x: number, y: number) => { x: number; y: number } | null) | null = null;
    private _onResized: (() => void) | null = null;

    private readonly _globalPosScratch = {x: 0, y: 0};

    public constructor(windowManager: IHabboWindowManager, host: HTMLElement)
    {
        this._windowManager = windowManager;
        this._host = host;
    }

    /** The backing canvas (null before mount / after dispose). */
    public get canvas(): HTMLCanvasElement | null
    {
        return this._canvas;
    }

    /**
     * When false, DOM mouse events are not forwarded to the window tree, letting
     * an overlay drive selection instead (editor "pick" mode). Defaults to true.
     */
    public setMouseForwarding(enabled: boolean): void
    {
        this._forwardMouse = enabled;
    }

    /** Converts a DOM mouse event to canvas-local coordinates. */
    public toCanvasCoords(e: MouseEvent): { x: number; y: number }
    {
        if(!this._canvas) return {x: 0, y: 0};

        const rect = this._canvas.getBoundingClientRect();

        return {x: e.clientX - rect.left, y: e.clientY - rect.top};
    }

    /** The canvas' bounding rect in viewport space (for overlay positioning). */
    public getCanvasRect(): DOMRect | null
    {
        return this._canvas?.getBoundingClientRect() ?? null;
    }

    /**
     * Installs the transform applied to forwarded mouse coordinates. The editor
     * uses it so that, while the edited layout is drawn magnified, a click lands
     * on the widget the user actually sees; returning null from the mapper drops
     * the event (the point maps outside the area the layout is drawn in).
     */
    public setCoordMapper(mapper: ((x: number, y: number) => { x: number; y: number } | null) | null): void
    {
        this._coordMapper = mapper;
    }

    /** The renderer's frame counter — a cheap "did anything redraw" signal. */
    public get renderVersion(): number
    {
        return this._windowManager.getWindowRenderer()?.renderVersion ?? 0;
    }

    /** Canvas-local coordinates with the forwarding transform applied. */
    private toEventCoords(e: MouseEvent): { x: number; y: number } | null
    {
        const raw = this.toCanvasCoords(e);

        return this._coordMapper ? this._coordMapper(raw.x, raw.y) : raw;
    }

    public mount(): void
    {
        if(this._canvas) return;

        const canvas = document.createElement('canvas');

        canvas.className = 'glz-canvas';
        canvas.style.cssText = 'position:absolute;inset:0;image-rendering:pixelated;';
        this._host.appendChild(canvas);

        this._canvas = canvas;
        this._ctx = canvas.getContext('2d');

        this.resize();

        this._resizeObserver = new ResizeObserver(() => this.resize());
        this._resizeObserver.observe(this._host);

        canvas.addEventListener('mousedown', this._onMouseDown);
        canvas.addEventListener('mousemove', this._onMouseMove);
        canvas.addEventListener('mouseup', this._onMouseUp);
        canvas.addEventListener('wheel', this._onWheel, {passive: true});
        canvas.addEventListener('contextmenu', this._onContextMenu);

        this.startRenderLoop();
    }

    /** Forces a composite on the next frame (e.g. after an external mutation). */
    public invalidate(): void
    {
        this._compositeDirty = true;
    }

    private resize(): void
    {
        if(!this._canvas) return;

        const w = Math.max(1, Math.floor(this._host.clientWidth));
        const h = Math.max(1, Math.floor(this._host.clientHeight));

        if(this._canvas.width === w && this._canvas.height === h) return;

        this._canvas.width = w;
        this._canvas.height = h;
        this._compositeDirty = true;

        for(let i = 0; i < 4; i++)
        {
            const desktop = this._windowManager.getDesktop(i);

            if(desktop)
            {
                desktop.width = w;
                desktop.height = h;
            }
        }

        // The chrome re-lays itself out from here rather than from `window.resize`,
        // so it never reads desktop dimensions this method has not written yet.
        this._onResized?.();
    }

    /** Called after every canvas resize, once the desktop layers have been sized. */
    public setResizeHandler(handler: (() => void) | null): void
    {
        this._onResized = handler;
    }

    private startRenderLoop(): void
    {
        const loop = (): void =>
        {
            if(this._disposed) return;

            this.renderFrame();

            this._animFrameId = requestAnimationFrame(loop);
        };

        this._animFrameId = requestAnimationFrame(loop);
    }

    private renderFrame(): void
    {
        if(!this._canvas || !this._ctx) return;

        const renderer = this._windowManager.getWindowRenderer();

        if(!renderer) return;

        // When an overlay painter is set (editor selection/handles), redraw every
        // frame so the overlay tracks changes; otherwise skip when nothing changed.
        if(!this._overlayPainter
            && !this._compositeDirty
            && !renderer.hasPendingUpdates()
            && renderer.renderVersion === this._lastRenderVersion)
        {
            return;
        }

        renderer.render();

        const w = this._canvas.width;
        const h = this._canvas.height;
        const buffer = this._windowManager.compositeToBuffer(w, h);

        if(!buffer) return;

        const ctx = this._ctx;

        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, w, h);
        this._bgPainter?.(ctx, w, h);
        ctx.drawImage(buffer, 0, 0);
        this._overlayPainter?.(ctx, w, h);
        this._compositeDirty = false;
        this._lastRenderVersion = renderer.renderVersion;
    }

    /** Registers a painter run after each composite (editor selection overlays). */
    public setOverlayPainter(painter: ((ctx: CanvasRenderingContext2D, w: number, h: number) => void) | null): void
    {
        this._overlayPainter = painter;
    }

    /** Registers a painter run before the window buffer is drawn (canvas background). */
    public setBackgroundPainter(painter: ((ctx: CanvasRenderingContext2D, w: number, h: number) => void) | null): void
    {
        this._bgPainter = painter;
    }

    private readonly _onMouseDown = (e: MouseEvent): void =>
    {
        if(!this._forwardMouse) return;

        e.preventDefault();

        const point = this.toEventCoords(e);

        if(!point) return;

        const {x, y} = point;
        const hit = this._windowManager.findWindowAtPoint(x, y);

        if(!hit) return;

        this._mouseDownWindow = hit;

        const serviceManager = this._windowManager.getServiceManager();

        if(serviceManager)
        {
            (serviceManager.getMouseDraggingService() as WindowMouseOperator).setMousePosition(x, y);
            (serviceManager.getMouseScalingService() as WindowMouseOperator).setMousePosition(x, y);
        }

        const globalPos = this._globalPosScratch;

        hit.getGlobalPosition(globalPos);

        const downEvent = WindowMouseEvent.allocateMouse(
            WindowMouseEvent.DOWN, hit, null,
            x - globalPos.x, y - globalPos.y, e.clientX, e.clientY,
            e.altKey, e.ctrlKey, e.shiftKey, true
        );
        (hit as WindowController).update(hit as WindowController, downEvent);
        downEvent.recycle();

        if(serviceManager)
        {
            const dragger = serviceManager.getMouseDraggingService() as WindowMouseOperator;
            const scaler = serviceManager.getMouseScalingService() as WindowMouseOperator;

            this._docMoveHandler = (ev: MouseEvent): void =>
            {
                const coords = this.toEventCoords(ev);

                if(!coords) return;

                dragger.handleMouseMove(coords.x, coords.y);
                scaler.handleMouseMove(coords.x, coords.y);
            };

            this._docUpHandler = (ev: MouseEvent): void =>
            {
                dragger.handleMouseUp();
                scaler.handleMouseUp();

                const upPoint = this.toEventCoords(ev);

                if(this._mouseDownWindow && !this._mouseDownWindow.disposed && upPoint)
                {
                    const {x: ux, y: uy} = upPoint;
                    const gp = this._globalPosScratch;

                    this._mouseDownWindow.getGlobalPosition(gp);

                    const upEvent = WindowMouseEvent.allocateMouse(
                        WindowMouseEvent.UP, this._mouseDownWindow, null,
                        ux - gp.x, uy - gp.y, ev.clientX, ev.clientY
                    );
                    (this._mouseDownWindow as WindowController).update(this._mouseDownWindow as WindowController, upEvent);
                    upEvent.recycle();

                    const clickHit = this._windowManager.findWindowAtPoint(ux, uy);

                    if(clickHit && !clickHit.disposed)
                    {
                        const cp = this._globalPosScratch;

                        clickHit.getGlobalPosition(cp);

                        const clickEvent = WindowMouseEvent.allocateMouse(
                            WindowMouseEvent.CLICK, clickHit, null,
                            ux - cp.x, uy - cp.y, ev.clientX, ev.clientY
                        );
                        (clickHit as WindowController).update(clickHit as WindowController, clickEvent);
                        clickEvent.recycle();
                    }
                }

                this._mouseDownWindow = null;

                document.removeEventListener('mousemove', this._docMoveHandler!);
                document.removeEventListener('mouseup', this._docUpHandler!);
                this._docMoveHandler = null;
                this._docUpHandler = null;
            };

            document.addEventListener('mousemove', this._docMoveHandler);
            document.addEventListener('mouseup', this._docUpHandler);
        }
    };

    private readonly _onMouseMove = (e: MouseEvent): void =>
    {
        if(!this._forwardMouse) return;

        const point = this.toEventCoords(e);

        if(!point) return;

        const {x, y} = point;
        const hit = this._windowManager.findWindowAtPoint(x, y);

        if(hit !== this._lastHoveredWindow)
        {
            if(this._lastHoveredWindow && !this._lastHoveredWindow.disposed)
            {
                const outEvent = WindowMouseEvent.allocateMouse(
                    WindowMouseEvent.OUT, this._lastHoveredWindow, hit,
                    0, 0, e.clientX, e.clientY
                );
                (this._lastHoveredWindow as WindowController).update(this._lastHoveredWindow as WindowController, outEvent);
                outEvent.recycle();
            }

            if(hit)
            {
                const globalPos = this._globalPosScratch;

                hit.getGlobalPosition(globalPos);

                const overEvent = WindowMouseEvent.allocateMouse(
                    WindowMouseEvent.OVER, hit, this._lastHoveredWindow,
                    x - globalPos.x, y - globalPos.y, e.clientX, e.clientY
                );
                (hit as WindowController).update(hit as WindowController, overEvent);
                overEvent.recycle();
            }

            this._lastHoveredWindow = hit;
        }

        if(hit)
        {
            const globalPos = this._globalPosScratch;

            hit.getGlobalPosition(globalPos);

            const moveEvent = WindowMouseEvent.allocateMouse(
                WindowMouseEvent.MOVE, hit, null,
                x - globalPos.x, y - globalPos.y, e.clientX, e.clientY
            );
            (hit as WindowController).update(hit as WindowController, moveEvent);
            moveEvent.recycle();
        }

        if(this._canvas)
        {
            this._canvas.style.cursor = (hit && hit.testParamFlag(1)) ? 'pointer' : 'default';
        }
    };

    private readonly _onMouseUp = (e: MouseEvent): void =>
    {
        if(!this._forwardMouse) return;
        if(this._docUpHandler) return;

        const point = this.toEventCoords(e);

        if(!point) return;

        const {x, y} = point;
        const hit = this._windowManager.findWindowAtPoint(x, y);

        if(!hit) return;

        const globalPos = this._globalPosScratch;

        hit.getGlobalPosition(globalPos);

        const upEvent = WindowMouseEvent.allocateMouse(
            WindowMouseEvent.UP, hit, null,
            x - globalPos.x, y - globalPos.y, e.clientX, e.clientY
        );
        (hit as WindowController).update(hit as WindowController, upEvent);
        upEvent.recycle();

        const clickEvent = WindowMouseEvent.allocateMouse(
            WindowMouseEvent.CLICK, hit, null,
            x - globalPos.x, y - globalPos.y, e.clientX, e.clientY
        );
        (hit as WindowController).update(hit as WindowController, clickEvent);
        clickEvent.recycle();
    };

    private readonly _onWheel = (e: WheelEvent): void =>
    {
        if(!this._forwardMouse) return;

        const point = this.toEventCoords(e);

        if(!point) return;

        const {x, y} = point;
        const hit = this._windowManager.findWindowAtPoint(x, y);

        if(!hit) return;

        let target: WindowController | null = hit as WindowController;

        while(target && !target.disposed)
        {
            const globalPos = this._globalPosScratch;

            target.getGlobalPosition(globalPos);

            // Flash line units, not DOM pixels - see NativeWheelDelta.
            const event = WindowMouseEvent.allocateMouse(
                WindowMouseEvent.WHEEL, target, null,
                x - globalPos.x, y - globalPos.y, e.clientX, e.clientY,
                e.altKey, e.ctrlKey, e.shiftKey, false,
                NativeWheelDelta.fromWheelEvent(e)
            );

            const handled = target.update(target, event);

            event.recycle();

            if(handled) break;

            target = target.parent as WindowController | null;
        }
    };

    private readonly _onContextMenu = (e: Event): void =>
    {
        e.preventDefault();
    };

    public dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;

        if(this._animFrameId)
        {
            cancelAnimationFrame(this._animFrameId);
            this._animFrameId = 0;
        }

        this._resizeObserver?.disconnect();
        this._resizeObserver = null;

        if(this._docMoveHandler) document.removeEventListener('mousemove', this._docMoveHandler);
        if(this._docUpHandler) document.removeEventListener('mouseup', this._docUpHandler);
        this._docMoveHandler = null;
        this._docUpHandler = null;

        if(this._canvas)
        {
            this._canvas.removeEventListener('mousedown', this._onMouseDown);
            this._canvas.removeEventListener('mousemove', this._onMouseMove);
            this._canvas.removeEventListener('mouseup', this._onMouseUp);
            this._canvas.removeEventListener('wheel', this._onWheel);
            this._canvas.removeEventListener('contextmenu', this._onContextMenu);
            this._canvas.remove();
        }

        this._canvas = null;
        this._ctx = null;
        this._lastHoveredWindow = null;
        this._mouseDownWindow = null;

        log.debug('CanvasSurface disposed');
    }
}
