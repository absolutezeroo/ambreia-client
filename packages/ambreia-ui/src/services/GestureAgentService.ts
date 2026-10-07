import type {IGestureAgentService, GestureAgentCallback} from './IGestureAgentService';
import type {IWindow} from '../IWindow';
import {WindowEvent} from '../events/WindowEvent';

/**
 * Momentum agent for flick gestures.
 *
 * After a drag ends, `begin()` is handed the gesture's exit velocity and this
 * service keeps calling back with a velocity decayed by 0.75 every 40 ms until
 * both axes fall to 1 or less, at which point it stops itself. It is the piece
 * that makes a flung touch-scrolled list coast rather than stop dead.
 *
 * The port had only an inline no-op stub for this in `ServiceManager`; the AS3
 * class is real and `ServiceManager` constructs it.
 *
 * Field and parameter names are **derived**: they are obfuscated in the primary
 * tree (`_SafeStr_6789`, `_SafeStr_6784`, …) and in the 2016 tree too
 * (`_Str_5257`, `_Str_4979`, …), so no tree carries them. Only `window`,
 * `begin`, `end`, `operate`, `dispose` and `disposed` are recovered.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/GestureAgentService.as
 */
export class GestureAgentService implements IGestureAgentService
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/GestureAgentService.as::TIMER_INTERVAL
    // Derived name: AS3 passes the literal 40 to `new Timer(40, 0)` — 0 repeats,
    // i.e. until end() stops it.
    private static readonly TIMER_INTERVAL: number = 40;

    // AS3: the 0.75 factor applied to both axes on every tick.
    private static readonly DECAY: number = 0.75;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/GestureAgentService.as::_disposed
    private _disposed: boolean = false;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/GestureAgentService.as::_working
    private _working: boolean = false;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/GestureAgentService.as::_window
    private _window: IWindow | null = null;
    // AS3: the Timer field; a repeating interval id here.
    private _timer: ReturnType<typeof setInterval> | null = null;
    // AS3: set from begin()'s third argument and never read back — kept so the
    // signature and the stored state match the source. Derived name.
    private _gestureId: number = 0;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/GestureAgentService.as::_callback
    private _callback: GestureAgentCallback | null = null;
    // AS3: the decaying horizontal velocity. Derived name.
    private _velocityX: number = 0;
    // AS3: the decaying vertical velocity. Derived name.
    private _velocityY: number = 0;

    // TS-only: bound so add/removeEventListener see the same reference, which
    // AS3 got for free from method closures.
    private readonly _clientWindowDestroyedBound = (): void => this.clientWindowDestroyed();

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/GestureAgentService.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    /**
     * Starts coasting a window with the given exit velocity.
     *
     * @param window - The window the gesture applies to
     * @param callback - Called with the decayed velocity on every tick
     * @param gestureId - Opaque gesture identifier, stored as AS3 stores it
     * @param velocityX - Initial horizontal velocity
     * @param velocityY - Initial vertical velocity
     * @returns The window this agent was previously working on, if any
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/GestureAgentService.as::begin()
    public begin(
        window: IWindow | null,
        callback: GestureAgentCallback | null,
        gestureId: number,
        velocityX: number,
        velocityY: number
    ): IWindow | null
    {
        this._gestureId = gestureId;

        const previous = this._window;

        if(this._window !== null)
        {
            this.end(this._window);
        }

        if(window && !window.disposed)
        {
            this._window = window;
            this._window.addEventListener(WindowEvent.WE_DESTROYED, this._clientWindowDestroyedBound);
            this._callback = callback;
            this._working = true;
            this._velocityX = velocityX;
            this._velocityY = velocityY;

            this._timer = setInterval(() => this.operate(), GestureAgentService.TIMER_INTERVAL);
        }

        return previous;
    }

    /**
     * One decay tick: shrink both axes, stop once both are spent, otherwise
     * report the new velocity.
     *
     * AS3 stores the velocities in `int` fields, so each assignment truncates
     * toward zero — `Math.trunc` keeps the same integer steps and the same
     * stopping point rather than letting the values crawl as fractions.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/GestureAgentService.as::operate()
    protected operate(): void
    {
        this._velocityX = Math.trunc(this._velocityX * GestureAgentService.DECAY);
        this._velocityY = Math.trunc(this._velocityY * GestureAgentService.DECAY);

        if(Math.abs(this._velocityX) <= 1 && Math.abs(this._velocityY) <= 1)
        {
            this.end(this._window);
        }
        else if(this._callback !== null)
        {
            this._callback(this._velocityX, this._velocityY);
        }
    }

    /**
     * Stops the agent when `window` is the one it is working on.
     *
     * @param window - The window to stop coasting
     * @returns The window this agent was working on before the call
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/GestureAgentService.as::end()
    public end(window: IWindow | null): IWindow | null
    {
        const previous = this._window;

        if(this._timer !== null)
        {
            clearInterval(this._timer);
            this._timer = null;
        }

        if(this._working)
        {
            if(this._window === window)
            {
                if(this._window !== null && !this._window.disposed)
                {
                    this._window.removeEventListener(WindowEvent.WE_DESTROYED, this._clientWindowDestroyedBound);
                }

                this._window = null;
                this._working = false;
            }
        }

        return previous;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/GestureAgentService.as::clientWindowDestroyed()
    private clientWindowDestroyed(): void
    {
        this.end(this._window);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/GestureAgentService.as::dispose()
    public dispose(): void
    {
        if(!this._disposed)
        {
            this.end(this._window);
            this._callback = null;
            this._gestureId = 0;
            this._disposed = true;
        }
    }
}
