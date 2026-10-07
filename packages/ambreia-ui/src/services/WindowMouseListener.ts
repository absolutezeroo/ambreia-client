import type {IMouseListenerService} from './IMouseListenerService';
import type {IWindow} from '../IWindow';
import {MouseListenerType} from '../enum/MouseListenerType';
import {WindowMouseOperator} from './WindowMouseOperator';

/**
 * Mouse listener service.
 *
 * Extends WindowMouseOperator to filter mouse events by type and
 * area limit. Windows can subscribe to specific event types and
 * restrict events to inside or outside their bounds.
 *
 * Area limit values come from {@link MouseListenerType}: `EVENT_INSIDE_STAGE`
 * takes everything, `EVENTS_INSIDE_WINDOW` only what hit-tests inside the
 * window, `EVENTS_OUTSIDE_WINDOW` only what hit-tests outside it.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/WindowMouseListener.as
 */
export class WindowMouseListener extends WindowMouseOperator implements IMouseListenerService
{
    private _eventTypes: string[] = [];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/WindowMouseListener.as::get eventTypes()
    get eventTypes(): string[]
    {
        return this._eventTypes;
    }

    private _areaLimit: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/WindowMouseListener.as::get areaLimit()
    get areaLimit(): number
    {
        return this._areaLimit;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/WindowMouseListener.as::set areaLimit()
    set areaLimit(value: number)
    {
        this._areaLimit = value;
    }

    /**
	 * End the mouse listener operation.
	 * Clears all subscribed event types.
	 *
	 * @param window - The window to stop listening on
	 * @returns The previously tracked window
	 */
    public override end(window: IWindow): IWindow | null
    {
        while(this._eventTypes.length > 0)
        {
            this._eventTypes.pop();
        }

        return super.end(window);
    }

    /**
	 * Check if a mouse event passes the area limit filter.
	 *
	 * Ports the `areaLimit`/hit-test half of AS3 `handler()` — the other half (matching
	 * `param1.type` against `_eventTypes`, then calling `_window.update(null, event)`)
	 * has no caller here: this method itself is not invoked anywhere in the engine or
	 * client. `WindowController.ts`'s mousedown case still calls
	 * `getMouseListenerService().begin(this)` / pushes `WindowMouseEvent.UP` into
	 * `eventTypes` / sets `areaLimit = 3`, exactly as AS3 does, but nothing reads those
	 * back — because the behaviour those calls exist for (guarantee the mousedown window
	 * gets its UP event even when the pointer is released elsewhere) is instead provided
	 * by `vortex-client/src/App.ts`'s document-level `_docUpHandler`, which delivers
	 * `WindowMouseEvent.UP` straight to `_mouseDownWindow` unconditionally on mouseup.
	 * That is a coarser rule than AS3's (no areaLimit distinction: AS3 only forces
	 * delivery when the release is OUTSIDE the window, since an inside release is
	 * already delivered through the ordinary hit-test dispatch), but it reaches every
	 * case AS3's handler() exists for, which is why this predicate was written but never
	 * wired up.
	 *
	 * @param stageX - Stage X coordinate of the event
	 * @param stageY - Stage Y coordinate of the event
	 * @returns true if the event should be processed
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/WindowMouseListener.as::handler()
    public passesAreaFilter(stageX: number, stageY: number): boolean
    {
        if(!this._active || !this._window || this._window.disposed) return false;

        if(this._areaLimit === MouseListenerType.EVENT_INSIDE_STAGE) return true;

        const isInside = this._window.hitTestGlobalPoint({x: stageX, y: stageY});

        if(this._areaLimit === MouseListenerType.EVENTS_INSIDE_WINDOW && !isInside) return false;

        if(this._areaLimit === MouseListenerType.EVENTS_OUTSIDE_WINDOW && isInside) return false;

        return true;
    }

    /**
	 * No-op: the listener does not move anything.
	 */
    public override operate(_x: number, _y: number): void
    {
        // No-op — WindowMouseListener does not move or resize
    }
}
