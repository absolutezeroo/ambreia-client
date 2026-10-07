import type {IWindow} from '../IWindow';

/**
 * Base window event with object pooling (allocate/recycle pattern).
 *
 * All window events derive from this class. Instances are pooled for
 * performance: use the static {@link allocate} factory instead of `new`,
 * and call {@link recycle} when done.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/events/WindowEvent.as
 */
export class WindowEvent
{
    public static readonly WE_DESTROY: string = 'WE_DESTROY';
    public static readonly WE_DESTROYED: string = 'WE_DESTROYED';
    public static readonly WE_OPEN: string = 'WE_OPEN';
    public static readonly WE_OPENED: string = 'WE_OPENED';
    public static readonly WE_CLOSE: string = 'WE_CLOSE';
    public static readonly WE_CLOSED: string = 'WE_CLOSED';
    public static readonly WE_FOCUS: string = 'WE_FOCUS';
    public static readonly WE_FOCUSED: string = 'WE_FOCUSED';
    public static readonly WE_UNFOCUS: string = 'WE_UNFOCUS';
    public static readonly WE_UNFOCUSED: string = 'WE_UNFOCUSED';
    public static readonly WE_ACTIVATE: string = 'WE_ACTIVATE';
    public static readonly WE_ACTIVATED: string = 'WE_ACTIVATED';
    public static readonly WE_DEACTIVATE: string = 'WE_DEACTIVATE';
    public static readonly WE_DEACTIVATED: string = 'WE_DEACTIVATED';
    public static readonly WE_SELECT: string = 'WE_SELECT';
    public static readonly WE_SELECTED: string = 'WE_SELECTED';
    public static readonly WE_UNSELECT: string = 'WE_UNSELECT';
    public static readonly WE_UNSELECTED: string = 'WE_UNSELECTED';
    public static readonly WE_LOCK: string = 'WE_LOCK';
    public static readonly WE_LOCKED: string = 'WE_LOCKED';
    public static readonly WE_UNLOCK: string = 'WE_UNLOCK';
    public static readonly WE_UNLOCKED: string = 'WE_UNLOCKED';
    public static readonly WE_ENABLE: string = 'WE_ENABLE';
    public static readonly WE_ENABLED: string = 'WE_ENABLED';
    public static readonly WE_DISABLE: string = 'WE_DISABLE';
    public static readonly WE_DISABLED: string = 'WE_DISABLED';
    public static readonly WE_RELOCATE: string = 'WE_RELOCATE';
    public static readonly WE_RELOCATED: string = 'WE_RELOCATED';
    public static readonly WE_RESIZE: string = 'WE_RESIZE';
    public static readonly WE_RESIZED: string = 'WE_RESIZED';
    public static readonly WE_MINIMIZE: string = 'WE_MINIMIZE';
    public static readonly WE_MINIMIZED: string = 'WE_MINIMIZED';
    public static readonly WE_MAXIMIZE: string = 'WE_MAXIMIZE';
    public static readonly WE_MAXIMIZED: string = 'WE_MAXIMIZED';
    public static readonly WE_RESTORE: string = 'WE_RESTORE';
    public static readonly WE_RESTORED: string = 'WE_RESTORED';
    public static readonly WE_CHILD_ADDED: string = 'WE_CHILD_ADDED';
    public static readonly WE_CHILD_REMOVED: string = 'WE_CHILD_REMOVED';
    public static readonly WE_CHILD_RELOCATED: string = 'WE_CHILD_RELOCATED';
    public static readonly WE_CHILD_RESIZED: string = 'WE_CHILD_RESIZED';
    public static readonly WE_CHILD_ACTIVATED: string = 'WE_CHILD_ACTIVATED';
    public static readonly WE_CHILD_VISIBILITY: string = 'WE_CHILD_VISIBILITY';
    public static readonly WE_PARENT_ADDED: string = 'WE_PARENT_ADDED';
    public static readonly WE_PARENT_REMOVED: string = 'WE_PARENT_REMOVED';
    public static readonly WE_PARENT_RELOCATED: string = 'WE_PARENT_RELOCATED';
    public static readonly WE_PARENT_RESIZED: string = 'WE_PARENT_RESIZED';
    public static readonly WE_PARENT_ACTIVATED: string = 'WE_PARENT_ACTIVATED';
    public static readonly WE_OK: string = 'WE_OK';
    public static readonly WE_CANCEL: string = 'WE_CANCEL';
    public static readonly WE_CHANGE: string = 'WE_CHANGE';
    public static readonly WE_SCROLL: string = 'WE_SCROLL';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/events/WindowEvent.as::UNKNOWN
    public static readonly UNKNOWN: string = '';

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/events/WindowEvent.as::_pool
    private static readonly _pool: WindowEvent[] = [];

    protected _prevented: boolean = false;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/events/WindowEvent.as::_recycled
    protected _recycled: boolean = false;
    protected _poolRef: WindowEvent[] = WindowEvent._pool;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/events/WindowEvent.as::_type
    protected _type: string = '';

    /** The event type identifier. */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/events/WindowEvent.as::get type()
    public get type(): string
    {
        return this._type;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/events/WindowEvent.as::_window
    protected _window: IWindow | null = null;

    /** The target window that dispatched this event. */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/events/WindowEvent.as::get window()
    public get window(): IWindow | null
    {
        return this._window;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/events/WindowEvent.as::_related
    protected _related: IWindow | null = null;

    /** The related window (parent, child, etc.). */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/events/WindowEvent.as::get related()
    public get related(): IWindow | null
    {
        return this._related;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/events/WindowEvent.as::_cancelable
    protected _cancelable: boolean = false;

    /** Whether this event supports cancellation. */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/events/WindowEvent.as::get cancelable()
    public get cancelable(): boolean
    {
        return this._cancelable;
    }

    /** The target window that dispatched this event. */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/events/WindowEvent.as::get target()
    public get target(): IWindow | null
    {
        return this._window;
    }

    /**
	 * Allocates a WindowEvent from the pool or creates a new one.
	 *
	 * @param type - The event type string
	 * @param window - The target window
	 * @param related - The related window (e.g. parent or child)
	 * @param cancelable - Whether the event can be cancelled
	 * @returns A pooled or new WindowEvent instance
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/events/WindowEvent.as::allocate()
    public static allocate(type: string, window: IWindow | null, related: IWindow | null, cancelable: boolean = false): WindowEvent
    {
        const event: WindowEvent = (WindowEvent._pool.length > 0)
            ? WindowEvent._pool.pop()!
            : new WindowEvent();

        event._type = type;
        event._window = window;
        event._related = related;
        event._cancelable = cancelable;
        event._recycled = false;
        event._poolRef = WindowEvent._pool;

        return event;
    }

    /**
	 * Returns this event to its object pool for reuse.
	 *
	 * @throws Error if the event has already been recycled
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/events/WindowEvent.as::recycle()
    public recycle(): void
    {
        if(this._recycled)
        {
            throw new Error('Event already recycled!');
        }

        this._window = null;
        this._related = null;
        this._recycled = true;
        this._prevented = false;
        this._poolRef.push(this);
    }

    /**
	 * Creates a clone of this event via the pool.
	 *
	 * @returns A new WindowEvent with the same properties
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/events/WindowEvent.as::clone()
    public clone(): WindowEvent
    {
        return WindowEvent.allocate(this._type, this._window, this._related, this._cancelable);
    }

    /**
	 * Prevents the default window operation.
	 * Alias for {@link preventWindowOperation}.
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/events/WindowEvent.as::preventDefault()
    public preventDefault(): void
    {
        this.preventWindowOperation();
    }

    /**
	 * Returns whether the default action has been prevented.
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/events/WindowEvent.as::isDefaultPrevented()
    public isDefaultPrevented(): boolean
    {
        return this._prevented;
    }

    /**
	 * Prevents the associated window operation if the event is cancelable.
	 *
	 * @throws Error if the event is not cancelable
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/events/WindowEvent.as::preventWindowOperation()
    public preventWindowOperation(): void
    {
        if(this._cancelable)
        {
            this._prevented = true;
        }
        else
        {
            throw new Error('Attempted to prevent window operation that is not cancelable!');
        }
    }

    /**
	 * Returns whether the window operation has been prevented.
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/events/WindowEvent.as::isWindowOperationPrevented()
    public isWindowOperationPrevented(): boolean
    {
        return this._prevented;
    }

    /**
	 * Stops propagation of this event.
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/events/WindowEvent.as::stopPropagation()
    public stopPropagation(): void
    {
        this._prevented = true;
    }

    /**
	 * Stops immediate propagation of this event.
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/events/WindowEvent.as::stopImmediatePropagation()
    public stopImmediatePropagation(): void
    {
        this._prevented = true;
    }

    /**
	 * Returns a string representation of this event.
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/events/WindowEvent.as::toString()
    public toString(): string
    {
        return `WindowEvent { type: ${this._type} cancelable: ${this._cancelable} window: ${this._window} }`;
    }
}
