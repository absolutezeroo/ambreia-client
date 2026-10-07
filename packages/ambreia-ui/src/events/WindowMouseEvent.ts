import type {IWindow} from '../IWindow';
import {WindowEvent} from './WindowEvent';

/**
 * Window mouse event with coordinate and modifier key data.
 *
 * Extends {@link WindowEvent} with mouse-specific fields such as
 * local/stage coordinates, modifier keys, button state, and scroll delta.
 * Uses its own object pool separate from the base class.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/events/WindowMouseEvent.as
 */
export class WindowMouseEvent extends WindowEvent
{
    // AS3: .../src/com/sulake/core/window/events/WindowMouseEvent.as::CLICK
    public static readonly CLICK: string = 'WME_CLICK';
    // AS3: .../src/com/sulake/core/window/events/WindowMouseEvent.as::DOUBLE_CLICK
    public static readonly DOUBLE_CLICK: string = `WME_DOUBLE_CLICK`;
    // AS3: .../src/com/sulake/core/window/events/WindowMouseEvent.as::DOWN
    public static readonly DOWN: string = 'WME_DOWN';
    // AS3: .../src/com/sulake/core/window/events/WindowMouseEvent.as::MIDDLE_CLICK
    public static readonly MIDDLE_CLICK: string = 'WME_MIDDLE_CLICK';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/events/WindowMouseEvent.as::MIDDLE_DOWN
    public static readonly MIDDLE_DOWN: string = 'WME_MIDDLE_DOWN';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/events/WindowMouseEvent.as::MIDDLE_UP
    public static readonly MIDDLE_UP: string = 'WME_MIDDLE_UP';
    // AS3: .../src/com/sulake/core/window/events/WindowMouseEvent.as::MOVE
    public static readonly MOVE: string = 'WME_MOVE';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/events/WindowMouseEvent.as::OUT
    public static readonly OUT: string = 'WME_OUT';
    // AS3: .../src/com/sulake/core/window/events/WindowMouseEvent.as::OVER
    public static readonly OVER: string = 'WME_OVER';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/events/WindowMouseEvent.as::UP
    public static readonly UP: string = 'WME_UP';
    // AS3: .../src/com/sulake/core/window/events/WindowMouseEvent.as::UP_OUTSIDE
    public static readonly UP_OUTSIDE: string = 'WME_UP_OUTSIDE';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/events/WindowMouseEvent.as::WHEEL
    public static readonly WHEEL: string = 'WME_WHEEL';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/events/WindowMouseEvent.as::WHEEL_HORIZONTAL
    public static readonly WHEEL_HORIZONTAL: string = 'WME_WHEEL_HORIZONTAL';
    // AS3: .../src/com/sulake/core/window/events/WindowMouseEvent.as::RIGHT_CLICK
    public static readonly RIGHT_CLICK: string = 'WME_RIGHT_CLICK';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/events/WindowMouseEvent.as::RIGHT_DOWN
    public static readonly RIGHT_DOWN: string = 'WME_RIGHT_DOWN';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/events/WindowMouseEvent.as::RIGHT_UP
    public static readonly RIGHT_UP: string = 'WME_RIGHT_UP';
    // AS3: .../src/com/sulake/core/window/events/WindowMouseEvent.as::ROLL_OUT
    public static readonly ROLL_OUT: string = 'WME_ROLL_OUT';
    // AS3: .../src/com/sulake/core/window/events/WindowMouseEvent.as::ROLL_OVER
    public static readonly ROLL_OVER: string = 'WME_ROLL_OVER';
    // AS3: .../src/com/sulake/core/window/events/WindowMouseEvent.as::HOVERING
    public static readonly HOVERING: string = 'WME_HOVERING';
    // AS3: .../src/com/sulake/core/window/events/WindowMouseEvent.as::CLICK_AWAY
    public static readonly CLICK_AWAY: string = 'WME_CLICK_AWAY';

    private static readonly _mousePool: WindowMouseEvent[] = [];

    // AS3: .../src/com/sulake/core/window/events/WindowMouseEvent.as::delta
    public delta: number = 0;
    // AS3: .../src/com/sulake/core/window/events/WindowMouseEvent.as::localX
    public localX: number = 0;
    // AS3: .../src/com/sulake/core/window/events/WindowMouseEvent.as::localY
    public localY: number = 0;
    // AS3: .../src/com/sulake/core/window/events/WindowMouseEvent.as::stageX
    public stageX: number = 0;
    // AS3: .../src/com/sulake/core/window/events/WindowMouseEvent.as::stageY
    public stageY: number = 0;
    // AS3: .../src/com/sulake/core/window/events/WindowMouseEvent.as::altKey
    public altKey: boolean = false;
    // AS3: .../src/com/sulake/core/window/events/WindowMouseEvent.as::ctrlKey
    public ctrlKey: boolean = false;
    // AS3: .../src/com/sulake/core/window/events/WindowMouseEvent.as::shiftKey
    public shiftKey: boolean = false;
    // AS3: .../src/com/sulake/core/window/events/WindowMouseEvent.as::buttonDown
    public buttonDown: boolean = false;

    /**
	 * Allocates a WindowMouseEvent from the pool or creates a new one.
	 *
	 * @param type - The event type string
	 * @param window - The target window
	 * @param related - The related window
	 * @param localX - X coordinate relative to the target window
	 * @param localY - Y coordinate relative to the target window
	 * @param stageX - X coordinate relative to the stage
	 * @param stageY - Y coordinate relative to the stage
	 * @param altKey - Whether the Alt key is pressed
	 * @param ctrlKey - Whether the Ctrl key is pressed
	 * @param shiftKey - Whether the Shift key is pressed
	 * @param buttonDown - Whether the mouse button is pressed
	 * @param delta - Scroll wheel delta
	 * @returns A pooled or new WindowMouseEvent instance
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/events/WindowMouseEvent.as::allocate()
    // Renamed: AS3 calls it `allocate` like WindowEvent's, which TypeScript cannot
    // do — a static in a subclass must stay assignable to the one it hides, and
    // this signature takes nine more parameters.
    public static allocateMouse(
        type: string,
        window: IWindow | null,
        related: IWindow | null,
        localX: number = 0,
        localY: number = 0,
        stageX: number = 0,
        stageY: number = 0,
        altKey: boolean = false,
        ctrlKey: boolean = false,
        shiftKey: boolean = false,
        buttonDown: boolean = false,
        delta: number = 0
    ): WindowMouseEvent
    {
        const event: WindowMouseEvent = (WindowMouseEvent._mousePool.length > 0)
            ? WindowMouseEvent._mousePool.pop()!
            : new WindowMouseEvent();

        event._type = type;
        event._window = window;
        event._related = related;
        event._cancelable = true;
        event._recycled = false;
        event._poolRef = WindowMouseEvent._mousePool;
        event.localX = localX;
        event.localY = localY;
        event.stageX = stageX;
        event.stageY = stageY;
        event.altKey = altKey;
        event.ctrlKey = ctrlKey;
        event.shiftKey = shiftKey;
        event.buttonDown = buttonDown;
        event.delta = delta;

        return event;
    }

    /**
	 * Creates a clone of this mouse event via the pool.
	 */
    public override clone(): WindowEvent
    {
        return WindowMouseEvent.allocateMouse(
            this._type, this._window, this._related,
            this.localX, this.localY, this.stageX, this.stageY,
            this.altKey, this.ctrlKey, this.shiftKey, this.buttonDown,
            this.delta
        );
    }

    /**
	 * Returns a string representation of this mouse event.
	 */
    public override toString(): string
    {
        return `WindowMouseEvent { type: ${this._type} cancelable: ${this._cancelable} window: ${this._window} localX: ${this.localX} localY: ${this.localY} }`;
    }
}
