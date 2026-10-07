import type {IWindow} from '../IWindow';
import type {IInputEventTracker} from '../IInputEventTracker';
import type {IWindowRenderer} from '../graphics/IWindowRenderer';
import type {IInteractiveWindow} from '../components/IInteractiveWindow';
import type {IDesktopWindow} from '../components/IDesktopWindow';
import type {EventProcessorState} from './EventProcessorState';
import type {IMouseEventEntry} from './MouseEventQueue';
import {RegionController} from '../components/RegionController';
import type {WindowController} from '../WindowController';
import {WindowParam} from '../enum/WindowParam';
import {WindowMouseEvent} from '../events/WindowMouseEvent';
import {MouseCursorControl} from './MouseCursorControl';
import type {MouseEventQueue} from './MouseEventQueue';

/**
 * Processes mouse events for the window system.
 *
 * Implements the AS3-style queue processing pipeline used by WindowContext:
 * gather hit candidates from desktop, route events through window hierarchy,
 * update hover/click state, notify input trackers, and resolve cursor type.
 *
 * @see sources/win63_version/core/window/utils/MouseEventProcessor.as
 */
export class MouseEventProcessor
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/MouseEventProcessor.as::_mouseCursorTypes
    private static _cursorByState: number[] = [2, 0, 2, 2, 2, 0, 2];
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/MouseEventProcessor.as::_mouseCursorStates
    private static _stateFlags: number[] = [1, 2, 4, 64, 8, 16, 32];
    private static _mousePoint: { x: number; y: number } = {x: 0, y: 0};
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/MouseEventProcessor.as::GLOBAL_POINT
    private static _globalPoint: { x: number; y: number } = {x: 0, y: 0};

    private _focused: WindowController | null = null;
    private _lastClickTarget: WindowController | null = null;
    private _lastMouseDownTarget: WindowController | null = null;
    private _clickAwayTarget: WindowController | null = null;
    private _renderer: IWindowRenderer | null = null;
    private _desktop: IDesktopWindow | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/MouseEventProcessor.as::_eventTrackers
    private _eventTrackers: IInputEventTracker[] = [];
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/MouseEventProcessor.as::_disposed
    private _disposed: boolean = false;
    private _absMouseX: number = -1;
    private _absMouseY: number = -1;

    public get focused(): IWindow | null
    {
        return this._focused;
    }

    public set focused(value: IWindow | null)
    {
        this._focused = value as WindowController | null;
    }

    public get lastClickTarget(): IWindow | null
    {
        return this._lastClickTarget;
    }

    public set lastClickTarget(value: IWindow | null)
    {
        this._lastClickTarget = value as WindowController | null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/MouseEventProcessor.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/MouseEventProcessor.as::setMouseCursorByState()
    public static setMouseCursorByState(stateFlag: number, cursorType: number): void
    {
        const index = MouseEventProcessor._stateFlags.indexOf(stateFlag);

        if(index > -1)
        {
            MouseEventProcessor._cursorByState[index] = cursorType;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/MouseEventProcessor.as::getMouseCursorByState()
    public static getMouseCursorByState(state: number): number
    {
        let i = MouseEventProcessor._stateFlags.length;

        while(i-- > 0)
        {
            if((state & MouseEventProcessor._stateFlags[i]) > 0)
            {
                return MouseEventProcessor._cursorByState[i];
            }
        }

        return 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/MouseEventProcessor.as::process()
    public process(state: EventProcessorState, queue: MouseEventQueue): void
    {
        if(queue.length === 0)
        {
            return;
        }

        this._desktop = state.desktop as IDesktopWindow | null;

        if(!this._desktop)
        {
            return;
        }

        this._focused = (state.hovered as WindowController | null) ?? (this._desktop as unknown as WindowController);

        if(this._focused && this._focused.disposed)
        {
            this._focused = this._desktop as unknown as WindowController;
        }

        this._lastClickTarget = state.lastClickTarget as WindowController | null;
        this._lastMouseDownTarget = state.lastMouseDownTarget as WindowController | null;
        this._clickAwayTarget = state.lastClickAwayTarget as WindowController | null;
        this._renderer = state.renderer;
        this._eventTrackers = state.eventTrackers;

        const desktop = this._desktop as unknown as WindowController;
        const windowsUnderPoint: IWindow[] = [];
        let cursorType = 0;

        queue.begin();
        this._absMouseX = -1;
        this._absMouseY = -1;

        let entry: IMouseEventEntry | null;

        while((entry = queue.next()) !== null)
        {
            const eventType = this.normalizeMouseEventType(entry.type);

            if((entry.stageX !== this._absMouseX) || (entry.stageY !== this._absMouseY))
            {
                this._absMouseX = entry.stageX;
                this._absMouseY = entry.stageY;
                MouseEventProcessor._mousePoint.x = entry.stageX;
                MouseEventProcessor._mousePoint.y = entry.stageY;
                windowsUnderPoint.length = 0;
                this._desktop.groupParameterFilteredChildrenUnderPoint(
                    MouseEventProcessor._mousePoint,
                    windowsUnderPoint,
                    WindowParam.INPUT_EVENT_PROCESSOR
                );
            }

            let windowCount = windowsUnderPoint.length;

            if(windowCount === 0)
            {
                switch(eventType)
                {
                    case 'mouseMove':
                        if(this._focused !== desktop && this._focused && !this._focused.disposed)
                        {
                            this._focused.getGlobalPosition(MouseEventProcessor._globalPoint);

                            const outEvent = WindowMouseEvent.allocateMouse(
                                WindowMouseEvent.OUT,
                                this._focused,
                                null,
                                entry.stageX - MouseEventProcessor._globalPoint.x,
                                entry.stageY - MouseEventProcessor._globalPoint.y,
                                entry.stageX,
                                entry.stageY,
                                entry.altKey,
                                entry.ctrlKey,
                                entry.shiftKey,
                                entry.buttonDown,
                                entry.delta
                            );

                            this._focused.update(this._focused, outEvent);
                            outEvent.recycle();
                            this._focused = desktop;
                        }
                        break;
                    case 'mouseDown':
                    {
                        const activeWindow = this._desktop.getActiveWindow();

                        if(activeWindow)
                        {
                            activeWindow.deactivate();
                        }
                        break;
                    }
                }
            }

            if((eventType === 'mouseUp') && this._lastMouseDownTarget && !this.containsWindow(windowsUnderPoint, this._lastMouseDownTarget))
            {
                windowsUnderPoint.push(this._lastMouseDownTarget);
                windowCount++;
            }

            while(--windowCount > -1)
            {
                const target = this.passMouseEvent(windowsUnderPoint[windowCount] as WindowController, entry);

                if(target && target.visible)
                {
                    if(eventType === 'mouseMove' && target !== this._focused)
                    {
                        if(this._focused && !this._focused.disposed)
                        {
                            this._focused.getGlobalPosition(MouseEventProcessor._globalPoint);

                            const outEvent = WindowMouseEvent.allocateMouse(
                                WindowMouseEvent.OUT,
                                this._focused,
                                target,
                                entry.stageX - MouseEventProcessor._globalPoint.x,
                                entry.stageY - MouseEventProcessor._globalPoint.y,
                                entry.stageX,
                                entry.stageY,
                                entry.altKey,
                                entry.ctrlKey,
                                entry.shiftKey,
                                entry.buttonDown,
                                entry.delta
                            );

                            this._focused.update(this._focused, outEvent);
                            outEvent.recycle();
                        }

                        if(!target.disposed)
                        {
                            target.getGlobalPosition(MouseEventProcessor._globalPoint);

                            const overEvent = WindowMouseEvent.allocateMouse(
                                WindowMouseEvent.OVER,
                                target,
                                null,
                                entry.stageX - MouseEventProcessor._globalPoint.x,
                                entry.stageY - MouseEventProcessor._globalPoint.y,
                                entry.stageX,
                                entry.stageY,
                                entry.altKey,
                                entry.ctrlKey,
                                entry.shiftKey,
                                entry.buttonDown,
                                entry.delta
                            );

                            target.update(target, overEvent);
                            overEvent.recycle();
                        }

                        if(!target.disposed)
                        {
                            this._focused = target;
                        }
                    }

                    if(eventType === 'mouseDown')
                    {
                        if(this._clickAwayTarget && !this._clickAwayTarget.disposed && target !== this._clickAwayTarget)
                        {
                            const clickAwayEvent = WindowMouseEvent.allocateMouse(
                                WindowMouseEvent.CLICK_AWAY,
                                this._clickAwayTarget,
                                target,
                                Number.NaN,
                                Number.NaN,
                                entry.stageX,
                                entry.stageY,
                                entry.altKey,
                                entry.ctrlKey,
                                entry.shiftKey,
                                entry.buttonDown,
                                entry.delta
                            );

                            this._clickAwayTarget.update(this._clickAwayTarget, clickAwayEvent);
                            clickAwayEvent.recycle();
                        }

                        this._clickAwayTarget = target;
                    }

                    // AS3 guards the IInputProcessorRoot walk up the parent chain with
                    // `while(_loc6_ && ...)` while `_loc6_` is still the `false` it was
                    // initialised to two statements earlier and is only ever assigned
                    // inside that same loop - so the walk never runs
                    // (MouseEventProcessor.as::process(), lines 230/272-285). It is not
                    // ported: `ItemListController` is the only IInputProcessorRoot, and it
                    // already receives these events through the ordinary
                    // `passMouseEvent()` bubbling into its own `update()`. Reviving the
                    // walk dispatched into `process()` a second time, on events a child
                    // had already handled.
                    if(this._focused && this.isInteractiveWindow(this._focused))
                    {
                        try
                        {
                            if(this._focused.interactiveCursorDisabled)
                            {
                                cursorType = 0;
                            }
                            else if((cursorType = this._focused.getMouseCursorByState(this._focused.state)) === 0)
                            {
                                cursorType = MouseEventProcessor.getMouseCursorByState(this._focused.state);
                            }
                        }
                        catch (_)
                        {
                            cursorType = 0;
                        }
                    }

                    if(target !== desktop)
                    {
                        queue.remove();
                    }

                    break;
                }
            }
        }

        queue.end();
        MouseCursorControl.type = cursorType;
        state.desktop = this._desktop;
        state.hovered = this._focused;
        state.lastClickTarget = this._lastClickTarget;
        state.lastMouseDownTarget = this._lastMouseDownTarget;
        state.lastClickAwayTarget = this._clickAwayTarget;
        state.renderer = this._renderer;
        state.eventTrackers = this._eventTrackers;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/MouseEventProcessor.as::passMouseEvent()
    private passMouseEvent(window: WindowController, entry: IMouseEventEntry, fromParent: boolean = false): WindowController | null
    {
        if(window.disposed)
        {
            return null;
        }

        const eventType = this.normalizeMouseEventType(entry.type);

        if(window.testStateFlag(32) && (eventType === 'mouseMove') && (window instanceof RegionController))
        {
            return window;
        }

        if(window.testStateFlag(32))
        {
            return null;
        }

        let skipIntersectionValidation = false;

        MouseEventProcessor._mousePoint.x = entry.stageX;
        MouseEventProcessor._mousePoint.y = entry.stageY;
        window.convertPointFromGlobalToLocalSpace(MouseEventProcessor._mousePoint);

        if(eventType === 'mouseUp')
        {
            if(this._lastMouseDownTarget === null)
            {
                this._lastClickTarget = null;
                return null;
            }

            if(window !== this._lastMouseDownTarget)
            {
                if(this._lastMouseDownTarget && !this._lastMouseDownTarget.disposed)
                {
                    const upEvent = this.convertMouseEventType(entry, this._lastMouseDownTarget, window, 'mouseUp');

                    this._lastMouseDownTarget.update(this._lastMouseDownTarget, upEvent);
                    upEvent.recycle();
                    this._lastClickTarget = null;

                    if(window.disposed)
                    {
                        return null;
                    }
                }
            }
            else
            {
                skipIntersectionValidation = !this.isInWindowBounds(window, MouseEventProcessor._mousePoint);
            }

            this._lastMouseDownTarget = null;
        }

        if(!skipIntersectionValidation)
        {
            if(window.ignoreMouseEvents)
            {
                return null;
            }

            const drawBuffer = this._renderer ? this._renderer.getDrawBufferForRenderable(window) : null;

            if(!this.validateLocalPointIntersection(window, MouseEventProcessor._mousePoint, drawBuffer))
            {
                return null;
            }
        }

        if(window.testParamFlag(WindowParam.ROUTE_INPUT_EVENTS_TO_PARENT) && window.parent !== null)
        {
            return this.passMouseEvent(window.parent as WindowController, entry);
        }

        if(!fromParent)
        {
            switch(eventType)
            {
                case 'mouseDown':
                    this._lastClickTarget = window;
                    this._lastMouseDownTarget = window;
                    break;
                case 'click':
                case 'doubleClick':
                    if(this._lastClickTarget !== window)
                    {
                        this._lastClickTarget = null;
                        return null;
                    }

                    this._lastClickTarget = null;
                    break;
            }
        }

        let handled = false;

        if(eventType === 'doubleClick')
        {
            handled = this.dispatchMouseEvent(window, entry, 'click') || handled;
        }

        handled = this.dispatchMouseEvent(window, entry, eventType) || handled;

        if(!handled && !fromParent && window.parent)
        {
            return this.passMouseEvent(window.parent as WindowController, entry);
        }

        return window;
    }

    private dispatchMouseEvent(window: WindowController, entry: IMouseEventEntry, eventType: string): boolean
    {
        const windowEvent = this.convertMouseEventType(entry, window, null, eventType);
        const handled = window.update(window, windowEvent);

        for(let i = 0; i < this._eventTrackers.length; i++)
        {
            this._eventTrackers[i].eventReceived(windowEvent, window);
        }

        windowEvent.recycle();

        return handled;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/MouseEventProcessor.as::convertMouseEventType()
    private convertMouseEventType(
        entry: IMouseEventEntry,
        target: IWindow,
        related: IWindow | null,
        overrideType: string | null = null
    ): WindowMouseEvent
    {
        const sourceType = this.normalizeMouseEventType(overrideType ?? entry.type);

        MouseEventProcessor._mousePoint.x = entry.stageX;
        MouseEventProcessor._mousePoint.y = entry.stageY;
        target.convertPointFromGlobalToLocalSpace(MouseEventProcessor._mousePoint);

        let type: string;

        switch(sourceType)
        {
            case 'mouseMove':
                type = WindowMouseEvent.MOVE;
                break;
            case 'mouseOver':
                type = WindowMouseEvent.OVER;
                break;
            case 'mouseOut':
                type = WindowMouseEvent.OUT;
                break;
            case 'rollOut':
                type = WindowMouseEvent.ROLL_OUT;
                break;
            case 'rollOver':
                type = WindowMouseEvent.ROLL_OVER;
                break;
            case 'click':
                type = WindowMouseEvent.CLICK;
                break;
            case 'doubleClick':
                type = WindowMouseEvent.DOUBLE_CLICK;
                break;
            case 'mouseDown':
                type = WindowMouseEvent.DOWN;
                break;
            case 'mouseUp':
                type = this.isInWindowBounds(target as WindowController, MouseEventProcessor._mousePoint)
                    ? WindowMouseEvent.UP
                    : WindowMouseEvent.UP_OUTSIDE;
                break;
            case 'mouseWheel':
                type = WindowMouseEvent.WHEEL;
                break;
            case 'mouseWheelHorizontal':
                type = WindowMouseEvent.WHEEL_HORIZONTAL;
                break;
            default:
                type = '';
        }

        return WindowMouseEvent.allocateMouse(
            type,
            target,
            related,
            MouseEventProcessor._mousePoint.x,
            MouseEventProcessor._mousePoint.y,
            entry.stageX,
            entry.stageY,
            entry.altKey,
            entry.ctrlKey,
            entry.shiftKey,
            entry.buttonDown,
            entry.delta
        );
    }

    private validateLocalPointIntersection(
        window: WindowController,
        point: { x: number; y: number },
        drawBuffer: unknown
    ): boolean
    {
        const validator = window as unknown as {
            validateLocalPointIntersection?: (point: { x: number; y: number }, drawBuffer: unknown) => boolean;
        };

        if(typeof validator.validateLocalPointIntersection === 'function')
        {
            return validator.validateLocalPointIntersection(point, drawBuffer);
        }

        return this.isInWindowBounds(window, point);
    }

    private isInWindowBounds(window: WindowController, point: { x: number; y: number }): boolean
    {
        const boundsChecker = window as unknown as {
            isInWindowBounds?: (point: { x: number; y: number }) => boolean;
        };

        if(typeof boundsChecker.isInWindowBounds === 'function')
        {
            return boundsChecker.isInWindowBounds(point);
        }

        return point.x > -1 && point.y > -1 && point.x < window.width && point.y < window.height;
    }

    private containsWindow(list: IWindow[], target: IWindow): boolean
    {
        for(let i = 0; i < list.length; i++)
        {
            if(list[i] === target)
            {
                return true;
            }
        }

        return false;
    }

    private isInteractiveWindow(window: IWindow): window is IInteractiveWindow
    {
        const interactiveWindow = window as unknown as IInteractiveWindow;

        return typeof interactiveWindow.getMouseCursorByState === 'function'
			&& typeof interactiveWindow.interactiveCursorDisabled === 'boolean';
    }

    private normalizeMouseEventType(type: string): string
    {
        switch(type)
        {
            case 'mousemove':
            case 'mouseMove':
                return 'mouseMove';
            case 'mouseover':
            case 'mouseOver':
                return 'mouseOver';
            case 'mouseout':
            case 'mouseOut':
                return 'mouseOut';
            case 'rollover':
            case 'rollOver':
                return 'rollOver';
            case 'rollout':
            case 'rollOut':
                return 'rollOut';
            case 'mousedown':
            case 'mouseDown':
                return 'mouseDown';
            case 'mouseup':
            case 'mouseUp':
                return 'mouseUp';
            case 'dblclick':
            case 'doubleClick':
                return 'doubleClick';
            case 'wheel':
            case 'mouseWheel':
                return 'mouseWheel';
            // AS3 receives a distinct Flash `mouseWheelHorizontal` stage event
            // (MouseEventQueue.as:22). The DOM folds both axes into one `wheel` event, so
            // the queue tags horizontal ones with this synthetic type when |deltaX| wins.
            case 'wheelHorizontal':
            case 'mouseWheelHorizontal':
                return 'mouseWheelHorizontal';
            default:
                return type;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/MouseEventProcessor.as::dispose()
    public dispose(): void
    {
        if(!this._disposed)
        {
            this._disposed = true;
            this._focused = null;
            this._lastClickTarget = null;
            this._lastMouseDownTarget = null;
            this._clickAwayTarget = null;
            this._renderer = null;
            this._desktop = null;
            this._eventTrackers = [];
        }
    }
}
