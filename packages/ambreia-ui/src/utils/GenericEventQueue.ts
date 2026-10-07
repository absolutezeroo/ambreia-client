import type {IEventQueue} from './IEventQueue';

/**
 * Buffers events dispatched between frames and lets a processor walk them once.
 *
 * AS3 subscribes `eventListener` to an `IEventDispatcher` and pushes whatever
 * arrives; this port has no Flash dispatcher, so subclasses collect entries
 * themselves — `MouseEventQueue.enqueue()` is the one implementation — and the
 * traversal below is shared.
 *
 * AS3 types the entries `flash.events.Event`; here the element type is a
 * parameter, so `MouseEventQueue` can hold its own richer entry record.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/GenericEventQueue.as
 */
export class GenericEventQueue<TEvent> implements IEventQueue<TEvent>
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/GenericEventQueue.as::_disposed
    protected _disposed: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/GenericEventQueue.as::_eventArray
    protected _eventArray: TEvent[] = [];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/GenericEventQueue.as::_index
    protected _index: number = 0;

    /**
     * False while a `begin()`…`end()` traversal is open.
     *
     * Derived name: AS3 calls it `_SafeStr_8048` and no tree recovers it. It
     * exists so that a `begin()` arriving while a traversal is still open
     * throws the stale contents away rather than walking them twice.
     */
    protected _traversalClosed: boolean = true;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/GenericEventQueue.as::get length()
    public get length(): number
    {
        return this._eventArray.length;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/GenericEventQueue.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    /**
     * Opens a traversal at the head of the queue.
     *
     * A `begin()` while the previous traversal is still open flushes first —
     * the processor never finished with those events, so they are stale.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/GenericEventQueue.as::begin()
    public begin(): void
    {
        if(!this._traversalClosed)
        {
            this.flush();
        }

        this._index = 0;
        this._traversalClosed = false;
    }

    /**
     * @returns The next queued event, or null once the queue is exhausted
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/GenericEventQueue.as::next()
    public next(): TEvent | null
    {
        if(this._index < this._eventArray.length)
        {
            return this._eventArray[this._index++];
        }

        return null;
    }

    /**
     * Drops the event `next()` just returned.
     *
     * The splice index is `_index - 1` unguarded, exactly as AS3 writes it: a
     * `remove()` before any `next()` therefore splices at -1 and drops the
     * *last* queued event. AS3's Vector and JavaScript's Array agree on that
     * reading, so the literal port keeps the same behaviour; no caller in the
     * port reaches that state.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/GenericEventQueue.as::remove()
    public remove(): void
    {
        this._eventArray.splice(this._index - 1, 1);

        if(this._index > 0)
        {
            this._index--;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/GenericEventQueue.as::end()
    public end(): void
    {
        this._index = 0;
        this._traversalClosed = true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/GenericEventQueue.as::flush()
    public flush(): void
    {
        this._eventArray.length = 0;
        this._index = 0;
    }

    /**
     * Appends an event to the queue.
     *
     * AS3 gets these from an `IEventDispatcher` subscription; here the caller
     * pushes, so the listener is a plain protected method.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/GenericEventQueue.as::eventListener()
    protected eventListener(event: TEvent): void
    {
        this._eventArray.push(event);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/GenericEventQueue.as::dispose()
    public dispose(): void
    {
        if(!this._disposed)
        {
            this._eventArray.length = 0;
            this._disposed = true;
        }
    }
}
