import type {IWindow} from '@ambreia/ui/IWindow';
import type {WindowManager} from '@ambreia/ui/kit/WindowManager';
import type {WindowMouseOperator} from '@ambreia/ui/services/WindowMouseOperator';
import {WindowContext} from '@ambreia/ui/WindowContext';

type ViewPointer = 'down' | 'move' | 'up';

/**
 * The page's one canvas: every frame it updates the window manager and draws its composite;
 * every DOM pointer event goes to the window system's own queue, the way the client feeds it
 * (App.ts `enqueueMouse`), so focus, scrolling, dragging and click-away behave as in the game.
 *
 * A press that lands on the view window (and on no window above it) also belongs to the view:
 * it gets the press and every move until the release, in coordinates local to that window.
 */
export class WindowCanvasHost
{
    onViewPointer: (kind: ViewPointer, x: number, y: number, e: MouseEvent) => void = () => undefined;
    onViewWheel: (deltaY: number, x: number, y: number) => void = () => undefined;
    /** Called once per frame before compositing: the place to redraw what windows display. */
    onFrame: (deltaMs: number) => void = () => undefined;

    readonly canvas = document.createElement('canvas');

    private readonly _ctx: CanvasRenderingContext2D;
    private _view: IWindow | null = null;
    private _viewCapture = false;
    private _last = performance.now();
    private _frame = 0;

    constructor(private readonly _root: HTMLElement, private readonly _manager: WindowManager)
    {
        this._ctx = this.canvas.getContext('2d')!;
        this.canvas.className = 'window-canvas';
        // First canvas of the document: text fields place their caret against it.
        _root.prepend(this.canvas);

        new ResizeObserver(() => this.resize()).observe(_root);
        this.resize();

        this.canvas.addEventListener('mousedown', this.down);
        this.canvas.addEventListener('mousemove', this.move);
        this.canvas.addEventListener('mouseup', e => this.enqueue('mouseUp', e));
        this.canvas.addEventListener('click', e => this.enqueue('click', e));
        this.canvas.addEventListener('dblclick', e => this.enqueue('doubleClick', e));
        this.canvas.addEventListener('wheel', this.wheel, {passive: false});
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());

        this._frame = requestAnimationFrame(this.tick);
    }

    /** The window whose area is the view (the iso host). */
    setView(view: IWindow | null): void
    {
        this._view = view;
    }

    /** The view window's size, for the view to size its own canvas. */
    get viewSize(): {width: number; height: number}
    {
        return {width: this._view?.width ?? 0, height: this._view?.height ?? 0};
    }

    dispose(): void
    {
        cancelAnimationFrame(this._frame);
        this.canvas.remove();
    }

    private readonly tick = (now: number): void =>
    {
        const delta = now - this._last;

        this._last = now;
        this.onFrame(delta);
        this._manager.update(delta);

        const buffer = this._manager.compositeToBuffer(this.canvas.width, this.canvas.height);

        if(buffer)
        {
            this._ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this._ctx.drawImage(buffer, 0, 0);
        }

        this._frame = requestAnimationFrame(this.tick);
    };

    private resize(): void
    {
        // 1:1 CSS pixels on purpose: the text fields' caret alignment depends on it.
        const width = Math.max(1, this._root.clientWidth);
        const height = Math.max(1, this._root.clientHeight);

        this.canvas.width = width;
        this.canvas.height = height;

        for(let layer = 0; layer < 4; layer++)
        {
            const desktop = this._manager.getDesktop(layer);

            if(desktop)
            {
                desktop.width = width;
                desktop.height = height;
            }
        }
    }

    private coords(e: MouseEvent): {x: number; y: number}
    {
        const rect = this.canvas.getBoundingClientRect();

        return {x: e.clientX - rect.left, y: e.clientY - rect.top};
    }

    private enqueue(type: string, e: MouseEvent, delta = 0): void
    {
        const {x, y} = this.coords(e);

        WindowContext.inputEventQueue?.enqueue({
            type,
            stageX: x,
            stageY: y,
            altKey: e.altKey,
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey,
            buttonDown: (e.buttons & 1) !== 0,
            delta
        });
    }

    /** The point in the view's own coordinates when the window under it is the view, else null. */
    private viewPoint(x: number, y: number): {x: number; y: number} | null
    {
        const view = this._view;

        if(!view || this._manager.findWindowAtPoint(x, y) !== view) return null;

        const origin = {x: 0, y: 0};

        view.getGlobalPosition(origin);

        return {x: x - origin.x, y: y - origin.y};
    }

    private local(e: MouseEvent): {x: number; y: number}
    {
        const {x, y} = this.coords(e);
        const origin = {x: 0, y: 0};

        this._view?.getGlobalPosition(origin);

        return {x: x - origin.x, y: y - origin.y};
    }

    private readonly down = (e: MouseEvent): void =>
    {
        // Without it the browser blurs the hidden input a text field has just focused.
        e.preventDefault();
        this.enqueue('mouseDown', e);

        const {x, y} = this.coords(e);
        const services = this._manager.getServiceManager();
        const dragger = (services?.getMouseDraggingService() ?? null) as WindowMouseOperator | null;
        const scaler = (services?.getMouseScalingService() ?? null) as WindowMouseOperator | null;

        dragger?.setMousePosition(x, y);
        scaler?.setMousePosition(x, y);

        const inView = this.viewPoint(x, y);

        if(inView)
        {
            this._viewCapture = true;
            this.onViewPointer('down', inView.x, inView.y, e);
        }

        // Moves and the release are followed on the document: a drag goes on off the canvas.
        const docMove = (ev: MouseEvent) =>
        {
            const p = this.coords(ev);

            dragger?.handleMouseMove(p.x, p.y);
            scaler?.handleMouseMove(p.x, p.y);
            if(this._viewCapture)
            {
                const l = this.local(ev);

                this.onViewPointer('move', l.x, l.y, ev);
            }
        };
        const docUp = (ev: MouseEvent) =>
        {
            dragger?.handleMouseUp();
            scaler?.handleMouseUp();
            if(ev.target !== this.canvas) this.enqueue('mouseUp', ev);
            if(this._viewCapture)
            {
                const l = this.local(ev);

                this._viewCapture = false;
                this.onViewPointer('up', l.x, l.y, ev);
            }
            document.removeEventListener('mousemove', docMove);
            document.removeEventListener('mouseup', docUp);
        };

        document.addEventListener('mousemove', docMove);
        document.addEventListener('mouseup', docUp);
    };

    private readonly move = (e: MouseEvent): void =>
    {
        this.enqueue('mouseMove', e);

        if(this._viewCapture) return;

        const {x, y} = this.coords(e);
        const inView = this.viewPoint(x, y);

        // Hover in the view (no button): the view tracks the cell under the pointer.
        if(inView) this.onViewPointer('move', inView.x, inView.y, e);
    };

    private readonly wheel = (e: WheelEvent): void =>
    {
        const {x, y} = this.coords(e);
        const inView = this.viewPoint(x, y);

        if(inView)
        {
            e.preventDefault();
            this.onViewWheel(e.deltaY, inView.x, inView.y);

            return;
        }

        this.enqueue('mouseWheel', e, -Math.sign(e.deltaY) * 3);
    };
}
