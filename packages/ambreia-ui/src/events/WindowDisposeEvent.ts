import type {IWindow} from '../IWindow';
import {WindowEvent} from './WindowEvent';

/**
 * Window dispose event dispatched when a window is being disposed.
 *
 * Uses its own object pool separate from the base class.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/events/WindowDisposeEvent.as
 */
export class WindowDisposeEvent extends WindowEvent 
{
    public static readonly WE_DISPOSED: string = 'WINDOW_DISPOSE_EVENT';

    private static readonly _disposePool: WindowDisposeEvent[] = [];

    constructor() 
    {
        super();

        this._type = WindowDisposeEvent.WE_DISPOSED;
    }

    /**
     * Allocates a WindowDisposeEvent from the pool or creates a new one.
     *
     * @param window - The window being disposed
     * @returns A pooled or new WindowDisposeEvent instance
     */
    public static allocateDispose(window: IWindow | null): WindowDisposeEvent 
    {
        const event: WindowDisposeEvent = (WindowDisposeEvent._disposePool.length > 0)
            ? WindowDisposeEvent._disposePool.pop()!
            : new WindowDisposeEvent();

        event._window = window;
        event._recycled = false;
        event._poolRef = WindowDisposeEvent._disposePool;

        return event;
    }

    /**
     * Creates a clone of this dispose event via the pool.
     */
    public override clone(): WindowEvent 
    {
        return WindowDisposeEvent.allocateDispose(this._window);
    }

    /**
     * Returns a string representation of this dispose event.
     */
    public override toString(): string 
    {
        return `WindowDisposeEvent { type: ${this._type} window: ${this._window} }`;
    }
}
