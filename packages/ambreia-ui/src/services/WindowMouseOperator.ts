import {WindowEvent} from '../events/WindowEvent';
import type {IWindow} from '../IWindow';
import type {WindowController} from '../WindowController';

/**
 * Base class for mouse-driven window operations (drag and scale).
 *
 * In AS3 this listened to ENTER_FRAME + stage.mouseX/Y via a
 * DisplayObject reference. In the web port, the client-side renderer
 * forwards mousemove/mouseup through {@link handleMouseMove} and
 * {@link handleMouseUp}.
 *
 * @see sources/win63_version/core/window/services/WindowMouseOperator.as
 */
export class WindowMouseOperator
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/WindowMouseOperator.as::_window
    protected _window: WindowController | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/WindowMouseOperator.as::_working
    protected _active: boolean = false;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/WindowMouseOperator.as::_offset
    protected _offset: { x: number; y: number } = {x: 0, y: 0};
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/WindowMouseOperator.as::_mouse
    protected _mouse: { x: number; y: number } = {x: 0, y: 0};
    protected _relativePos: { x: number; y: number } = {x: 0, y: 0};
    protected _flags: number = 0;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/WindowMouseOperator.as::_disposed
    private _disposed: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/WindowMouseOperator.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    /**
	 * Set the current mouse position (canvas-local coordinates).
	 *
	 * Must be called before dispatching a DOWN event so that
	 * {@link begin} can compute the correct offset.
	 *
	 * @param x - Canvas-local X
	 * @param y - Canvas-local Y
	 */
    public setMousePosition(x: number, y: number): void
    {
        this._mouse.x = x;
        this._mouse.y = y;
    }

    /**
	 * Begin a mouse operation on a window.
	 *
	 * @param window - The window to operate on
	 * @param flags - Operation flags (e.g. scaling direction)
	 * @returns The previously operated window, or null
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/WindowMouseOperator.as::begin()
    public begin(window: IWindow, flags: number = 0): IWindow | null
    {
        this._flags = flags;

        const previous: IWindow | null = this._window;

        if(this._window !== null)
        {
            this.end(this._window);
        }

        if(window && !window.disposed)
        {
            this._window = window as WindowController;
            this.getMousePositionRelativeTo(window, this._mouse, this._offset);
            // A window can be closed mid-drag — a dialog dismissed by a server message, a widget
            // disposed by the room changing. AS3 listens for it and ends the operation
            // (`WindowMouseOperator.as` l.74 and l.140-143); without it the operator keeps
            // dragging a disposed window by a reference nothing will clear.
            this._window.addEventListener(WindowEvent.WE_DESTROYED, this.clientWindowDestroyed);
            this._active = true;
        }

        return previous;
    }

    /** Ends the operation on the window that has just gone away. */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/WindowMouseOperator.as::clientWindowDestroyed()
    private clientWindowDestroyed = (): void =>
    {
        if(this._window !== null) this.end(this._window);
    };

    /**
	 * End the mouse operation on a window.
	 *
	 * @param window - The window to stop operating on
	 * @returns The previously operated window, or null
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/WindowMouseOperator.as::end()
    public end(window: IWindow): IWindow | null
    {
        const previous: IWindow | null = this._window;

        if(this._active)
        {
            if(this._window === window)
            {
                this._window.removeEventListener(WindowEvent.WE_DESTROYED, this.clientWindowDestroyed);
                this._window = null;
                this._active = false;
            }
        }

        return previous;
    }

    /**
	 * Perform the mouse operation at the given coordinates.
	 *
	 * Override in subclasses for drag or scale behavior.
	 *
	 * @param x - Current mouse X (stage coordinates)
	 * @param y - Current mouse Y (stage coordinates)
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/WindowMouseOperator.as::operate()
    public operate(x: number, y: number): void
    {
        this._mouse.x = x;
        this._mouse.y = y;
        this.getMousePositionRelativeTo(this._window!, this._mouse, this._relativePos);
        this._window!.offset(this._relativePos.x - this._offset.x, this._relativePos.y - this._offset.y);
    }

    /**
	 * Called by the client renderer on document mousemove.
	 *
	 * @param x - Current mouse X (clientX)
	 * @param y - Current mouse Y (clientY)
	 */
    // AS3's handler() is one listener for mouseDown/mouseUp/enterFrame registered on the
    // DisplayObject passed to the constructor; its enterFrame branch polls stage.mouseX/Y
    // each frame and calls operate() on a change - this port has no per-frame Flash event
    // loop to poll from, so the client renderer calls this method directly off the DOM
    // mousemove event instead, with the same "position changed -> operate()" body.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/WindowMouseOperator.as::handler()
    public handleMouseMove(x: number, y: number): void
    {
        if(!this._active || !this._window || this._window.disposed) return;

        if(x !== this._mouse.x || y !== this._mouse.y)
        {
            this.operate(x, y);
            this._mouse.x = x;
            this._mouse.y = y;
        }
    }

    /**
	 * Called by the client renderer on document mouseup.
	 */
    // The other half of AS3's handler() - its mouseUp branch just calls end(_window).
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/WindowMouseOperator.as::handler()
    public handleMouseUp(): void
    {
        if(this._active && this._window)
        {
            this.end(this._window);
        }
    }

    /**
	 * Dispose the operator.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/WindowMouseOperator.as::dispose()
    public dispose(): void
    {
        this.end(this._window!);
        this._window = null;
        this._disposed = true;
    }

    /**
	 * Calculate the mouse position relative to a window.
	 *
	 * @param window - The reference window
	 * @param mousePos - The absolute mouse position
	 * @param out - The output relative position
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/WindowMouseOperator.as::getMousePositionRelativeTo()
    protected getMousePositionRelativeTo(window: IWindow, mousePos: { x: number; y: number }, out: {
        x: number;
        y: number
    }): void
    {
        window.getGlobalPosition(out);
        out.x = mousePos.x - out.x;
        out.y = mousePos.y - out.y;
    }
}
