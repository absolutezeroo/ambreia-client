import type {WindowEvent} from './WindowEvent';

/**
 * Listener entry with callback and priority for ordered dispatch.
 *
 * Callback shape is intentionally untyped beyond "callable" - like AS3's own
 * `Function` type, real listeners across the codebase are bound with anything
 * from zero args up to specific WindowEvent subclasses (WindowMouseEvent, etc.)
 * depending on the registered event type string, which a single concrete
 * signature can't express without breaking those narrower callers.
 */
export type WindowEventListener = (...args: any[]) => any;

interface IEventListenerEntry {
    listener: WindowEventListener;
    priority: number;
}

/**
 * Event dispatcher for window events with priority-based listener ordering.
 *
 * Manages event listeners per event type and dispatches {@link WindowEvent}
 * instances to registered callbacks in priority order (highest first).
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/events/WindowEventDispatcher.as
 */
export class WindowEventDispatcher 
{
    private _listeners: Map<string, IEventListenerEntry[]> = new Map();
    // AS3: .../src/com/sulake/core/window/events/WindowEventDispatcher.as::_disposed
    private _disposed: boolean = false;

    /** Whether this dispatcher has been disposed. */
    // AS3: .../src/com/sulake/core/window/events/WindowEventDispatcher.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    /**
     * The last dispatch error — always null.
     *
     * AS3 declares the backing `_SafeStr_6474:Error` and never writes it: the getter is the only
     * occurrence of the field in the class besides its declaration, so it reads null in Flash too.
     * Carried so the member is not silently missing, not because anything fills it.
     */
    // AS3: .../src/com/sulake/core/window/events/WindowEventDispatcher.as::get error()
    public get error(): Error | null
    {
        return null;
    }

    /**
     * Registers an event listener for the given event type.
     *
     * If the same callback is already registered for this type it is not
     * added again. Listeners are inserted in descending priority order
     * so higher-priority listeners fire first.
     *
     * @param type - The event type string
     * @param listener - The callback function
     * @param priority - Listener priority (higher fires first, default 0)
     */
    // AS3: .../src/com/sulake/core/window/events/WindowEventDispatcher.as::addEventListener()
    public addEventListener(type: string, listener: WindowEventListener, priority: number = 0): void
    {
        let entries = this._listeners.get(type);
        const entry: IEventListenerEntry = {listener, priority};

        if(!entries) 
        {
            entries = [entry];
            this._listeners.set(type, entries);
        }
        else 
        {
            for(const existing of entries) 
            {
                if(existing.listener === listener) 
                {
                    return;
                }
            }

            let inserted = false;

            for(let i = 0; i < entries.length; i++) 
            {
                if(priority > entries[i].priority) 
                {
                    entries.splice(i, 0, entry);
                    inserted = true;
                    break;
                }
            }

            if(!inserted) 
            {
                entries.push(entry);
            }
        }
    }

    /**
     * Removes a previously registered event listener.
     *
     * @param type - The event type string
     * @param listener - The callback function to remove
     */
    // AS3: .../src/com/sulake/core/window/events/WindowEventDispatcher.as::removeEventListener()
    public removeEventListener(type: string, listener: WindowEventListener): void
    {
        if(this._disposed) return;

        const entries = this._listeners.get(type);

        if(entries) 
        {
            for(let i = 0; i < entries.length; i++) 
            {
                if(entries[i].listener === listener) 
                {
                    entries.splice(i, 1);

                    if(entries.length === 0) 
                    {
                        this._listeners.delete(type);
                    }

                    return;
                }
            }
        }
    }

    /**
     * Dispatches a window event to all registered listeners of its type.
     *
     * Listeners are invoked in priority order. Returns `true` if the
     * event was not prevented, `false` otherwise.
     *
     * @param event - The window event to dispatch
     * @returns `true` if the event was not prevented
     */
    // AS3: .../src/com/sulake/core/window/events/WindowEventDispatcher.as::dispatchEvent()
    public dispatchEvent(event: WindowEvent): boolean 
    {
        if(this._disposed) return false;

        const entries = this._listeners.get(event.type);

        if(entries) 
        {
            const callbacks: WindowEventListener[] = [];

            for(const entry of entries) 
            {
                callbacks.push(entry.listener);
            }

            for(const callback of callbacks) 
            {
                callback(event);
            }
        }

        return !event.isDefaultPrevented();
    }

    /**
     * Returns whether any listener is registered for the given event type.
     *
     * @param type - The event type string
     * @returns `true` if at least one listener exists
     */
    // AS3: .../src/com/sulake/core/window/events/WindowEventDispatcher.as::hasEventListener()
    public hasEventListener(type: string): boolean 
    {
        if(this._disposed) return false;

        return this._listeners.has(type);
    }

    /**
     * Disposes this dispatcher, clearing all listener references.
     */
    // AS3: .../src/com/sulake/core/window/events/WindowEventDispatcher.as::dispose()
    public dispose(): void 
    {
        if(this._disposed) return;

        for(const [, entries] of this._listeners) 
        {
            for(const entry of entries) 
            {
                (entry as { listener: WindowEventListener | null }).listener = null;
            }
        }

        this._listeners.clear();
        this._disposed = true;
    }
}
