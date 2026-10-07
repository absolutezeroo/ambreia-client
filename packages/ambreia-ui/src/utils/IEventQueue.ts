/**
 * Cursor-style queue an {@link IEventProcessor} drains.
 *
 * `begin()` opens a traversal, `next()` yields entries until it returns null,
 * `remove()` drops the entry just yielded, `end()` closes the traversal and
 * `flush()` empties the queue outright.
 *
 * AS3 types the entries as `flash.events.Event`; this port queues its own entry
 * records (`MouseEventQueue` holds `IMouseEventEntry`), so the element type is a
 * parameter here and `next()` is nullable — AS3 signals exhaustion with a null
 * `Event` return, which an untyped ActionScript signature did not have to say.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/IEventQueue.as
 */
export interface IEventQueue<TEvent>
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/IEventQueue.as::get length()
    readonly length: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/IEventQueue.as::begin()
    begin(): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/IEventQueue.as::next()
    next(): TEvent | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/IEventQueue.as::remove()
    remove(): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/IEventQueue.as::end()
    end(): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/IEventQueue.as::flush()
    flush(): void;
}
