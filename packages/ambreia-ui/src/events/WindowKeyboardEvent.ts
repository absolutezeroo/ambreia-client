import type {IWindow} from '../IWindow';
import {WindowEvent} from './WindowEvent';

/**
 * Window keyboard event with key code and modifier data.
 *
 * Extends {@link WindowEvent} with keyboard-specific fields. In the AS3
 * original this wraps a native `flash.events.KeyboardEvent`; the TypeScript
 * port stores the fields directly instead.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/events/WindowKeyboardEvent.as
 */
export class WindowKeyboardEvent extends WindowEvent 
{
    public static readonly KEY_UP: string = 'WKE_KEY_UP';
    public static readonly KEY_DOWN: string = 'WKE_KEY_DOWN';
    private static readonly _keyboardPool: WindowKeyboardEvent[] = [];

    private _keyCode: number = 0;

    /** The key code of the pressed key. */
    // AS3: .../src/com/sulake/core/window/events/WindowKeyboardEvent.as::get keyCode()
    public get keyCode(): number 
    {
        return this._keyCode;
    }

    private _charCode: number = 0;

    /** The character code of the pressed key. */
    // AS3: .../src/com/sulake/core/window/events/WindowKeyboardEvent.as::get charCode()
    public get charCode(): number 
    {
        return this._charCode;
    }

    private _altKey: boolean = false;

    /** Whether the Alt key is pressed. */
    // AS3: .../src/com/sulake/core/window/events/WindowKeyboardEvent.as::get altKey()
    public get altKey(): boolean 
    {
        return this._altKey;
    }

    private _ctrlKey: boolean = false;

    /** Whether the Ctrl key is pressed. */
    // AS3: .../src/com/sulake/core/window/events/WindowKeyboardEvent.as::get ctrlKey()
    public get ctrlKey(): boolean 
    {
        return this._ctrlKey;
    }

    private _shiftKey: boolean = false;

    /** Whether the Shift key is pressed. */
    // AS3: .../src/com/sulake/core/window/events/WindowKeyboardEvent.as::get shiftKey()
    public get shiftKey(): boolean 
    {
        return this._shiftKey;
    }

    private _keyLocation: number = 0;

    /** The key location (standard, left, right, numpad). */
    // AS3: .../src/com/sulake/core/window/events/WindowKeyboardEvent.as::get keyLocation()
    public get keyLocation(): number 
    {
        return this._keyLocation;
    }

    /**
     * Allocates a WindowKeyboardEvent from the pool or creates a new one.
     *
     * @param type - The event type string
     * @param keyCode - The key code
     * @param charCode - The character code
     * @param window - The target window
     * @param related - The related window
     * @param altKey - Whether the Alt key is pressed
     * @param ctrlKey - Whether the Ctrl key is pressed
     * @param shiftKey - Whether the Shift key is pressed
     * @param keyLocation - The key location (standard, left, right, numpad)
     * @param cancelable - Whether the event can be cancelled
     * @returns A pooled or new WindowKeyboardEvent instance
     */
    public static allocateKeyboard(
        type: string,
        keyCode: number,
        charCode: number,
        window: IWindow | null,
        related: IWindow | null,
        altKey: boolean = false,
        ctrlKey: boolean = false,
        shiftKey: boolean = false,
        keyLocation: number = 0,
        cancelable: boolean = false
    ): WindowKeyboardEvent 
    {
        const event: WindowKeyboardEvent = (WindowKeyboardEvent._keyboardPool.length > 0)
            ? WindowKeyboardEvent._keyboardPool.pop()!
            : new WindowKeyboardEvent();

        event._type = type;
        event._window = window;
        event._related = related;
        event._recycled = false;
        event._cancelable = cancelable;
        event._poolRef = WindowKeyboardEvent._keyboardPool;
        event._keyCode = keyCode;
        event._charCode = charCode;
        event._altKey = altKey;
        event._ctrlKey = ctrlKey;
        event._shiftKey = shiftKey;
        event._keyLocation = keyLocation;

        return event;
    }

    /**
     * Creates a clone of this keyboard event via the pool.
     */
    public override clone(): WindowEvent 
    {
        return WindowKeyboardEvent.allocateKeyboard(
            this._type, this._keyCode, this._charCode,
            this._window, this._related,
            this._altKey, this._ctrlKey, this._shiftKey,
            this._keyLocation, this._cancelable
        );
    }

    /**
     * Returns a string representation of this keyboard event.
     */
    public override toString(): string 
    {
        return `WindowKeyboardEvent { type: ${this._type} cancelable: ${this._cancelable} window: ${this._window} charCode: ${this._charCode} }`;
    }
}
