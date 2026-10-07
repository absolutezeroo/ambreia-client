import type {IWindow} from '../IWindow';
import {WindowEvent} from './WindowEvent';

/**
 * A `WE_MESSAGE` window event carrying a free-form string payload.
 *
 * Nothing in the AS3 client dispatches or listens for this — the only
 * references outside the class itself are in `ICoreWindowFrameworkLib`, the
 * library manifest that exposes every class by name. It is ported because the
 * event package would otherwise be missing a member, not because a call site
 * needs it.
 *
 * Note AS3's own `toString()` reports this as `WindowLinkEvent`, a copy-paste
 * slip in the source; the port keeps the class's real name instead, since
 * reproducing the wrong label would only mislead a reader of the output.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/events/WindowMessage.as
 */
export class WindowMessage extends WindowEvent
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/events/WindowMessage.as::WINDOW_EVENT_MESSAGE
    public static readonly WINDOW_EVENT_MESSAGE: string = 'WE_MESSAGE';

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/events/WindowMessage.as::_pool
    // Named in caps because the lint rule requires it of a static readonly.
    private static readonly MESSAGE_POOL: WindowMessage[] = [];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/events/WindowMessage.as::message
    public message: string = '';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/events/WindowMessage.as::WindowMessage()
    constructor()
    {
        super();
        this._type = WindowMessage.WINDOW_EVENT_MESSAGE;
    }

    /**
     * Takes a message event from the pool, or makes one.
     *
     * @param message - The payload
     * @param window - The window the event targets
     * @param related - The related window, if any
     * @param cancelable - Whether a listener may prevent the operation
     * @returns A pooled, initialised event
     */
    // Renamed, like WindowMouseEvent.allocateMouse(): AS3 calls it `allocate` as WindowEvent does,
    // which TypeScript cannot do — a static in a subclass must stay assignable to the one it hides.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/events/WindowMessage.as::allocate()
    public static allocateMessage(
        message: string,
        window: IWindow | null,
        related: IWindow | null,
        cancelable: boolean = false
    ): WindowMessage
    {
        const event: WindowMessage = (WindowMessage.MESSAGE_POOL.length > 0)
            ? WindowMessage.MESSAGE_POOL.pop()!
            : new WindowMessage();

        event.message = message;
        event._window = window;
        event._related = related;
        event._cancelable = cancelable;
        event._recycled = false;
        event._poolRef = WindowMessage.MESSAGE_POOL;

        return event;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/events/WindowMessage.as::clone()
    public override clone(): WindowEvent
    {
        return WindowMessage.allocateMessage(this.message, this._window, this._related, this._cancelable);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/events/WindowMessage.as::toString()
    public override toString(): string
    {
        return `WindowMessage { type: ${this._type} message: ${this.message} cancelable: ${this._cancelable} window: ${this._window} }`;
    }
}
