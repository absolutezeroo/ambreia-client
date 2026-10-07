import type {IWindow} from '../IWindow';
import {WindowEvent} from './WindowEvent';

/**
 * Window link event carrying a URL/link string.
 *
 * Dispatched when a link element within a window is activated.
 * Uses its own object pool separate from the base class.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/events/WindowLinkEvent.as
 */
export class WindowLinkEvent extends WindowEvent
{
    public static readonly WE_LINK: string = 'WE_LINK';

    private static readonly _linkPool: WindowLinkEvent[] = [];

    constructor()
    {
        super();

        this._type = WindowLinkEvent.WE_LINK;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/events/WindowLinkEvent.as::_link
    private _link: string = '';

    /** The link URL string. */
    // AS3: .../src/com/sulake/core/window/events/WindowLinkEvent.as::get link()
    public get link(): string
    {
        return this._link;
    }

    /**
	 * Allocates a WindowLinkEvent from the pool or creates a new one.
	 *
	 * @param link - The link URL string
	 * @param window - The target window
	 * @param related - The related window
	 * @returns A pooled or new WindowLinkEvent instance
	 */
    public static allocateLink(link: string, window: IWindow | null, related: IWindow | null): WindowLinkEvent
    {
        const event: WindowLinkEvent = (WindowLinkEvent._linkPool.length > 0)
            ? WindowLinkEvent._linkPool.pop()!
            : new WindowLinkEvent();

        event._link = link;
        event._window = window;
        event._related = related;
        event._recycled = false;
        event._poolRef = WindowLinkEvent._linkPool;

        return event;
    }

    /**
	 * Creates a clone of this link event via the pool.
	 */
    public override clone(): WindowEvent
    {
        return WindowLinkEvent.allocateLink(this._link, this._window, this._related);
    }

    /**
	 * Returns a string representation of this link event.
	 */
    public override toString(): string
    {
        return `WindowLinkEvent { type: ${this._type} link: ${this._link} cancelable: ${this._cancelable} window: ${this._window} }`;
    }
}
