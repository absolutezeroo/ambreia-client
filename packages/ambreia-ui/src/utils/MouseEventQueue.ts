import {GenericEventQueue} from './GenericEventQueue';

/**
 * One buffered pointer event.
 *
 * AS3 queues `flash.events.MouseEvent` objects straight from the stage. There
 * is no such class here, so the fields the processor actually reads are
 * captured into a plain record at enqueue time.
 */
// TS-only: stands in for flash.events.MouseEvent, which AS3 queued directly.
export interface IMouseEventEntry
{
    type: string;
    stageX: number;
    stageY: number;
    altKey: boolean;
    ctrlKey: boolean;
    shiftKey: boolean;
    buttonDown: boolean;
    delta: number;
}

/**
 * Queue of pending mouse events for batch processing.
 *
 * Everything about the traversal — `begin`/`next`/`remove`/`end`/`flush` — is
 * inherited from {@link GenericEventQueue}, as AS3 inherits it. What this class
 * adds is AS3's own addition: the last pointer position, which the processor
 * reads without walking the queue.
 *
 * In AS3 the queue subscribes to the Flash stage; here the client pushes DOM
 * events in through {@link enqueue}.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/MouseEventQueue.as
 */
export class MouseEventQueue extends GenericEventQueue<IMouseEventEntry>
{
    private _mouseX: number = 0;

    /**
	 * The current mouse position.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/MouseEventQueue.as::get mousePosition()
    public get mouseX(): number
    {
        return this._mouseX;
    }

    private _mouseY: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/MouseEventQueue.as::get mousePosition()
    public get mouseY(): number
    {
        return this._mouseY;
    }

    /**
	 * Enqueues a mouse event and records its position.
	 *
	 * @param event - The mouse event entry to enqueue
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/MouseEventQueue.as::mouseEventListener()
    public enqueue(event: IMouseEventEntry): void
    {
        this._mouseX = event.stageX;
        this._mouseY = event.stageY;

        // AS3 coalesces: a `mouseMove` arriving on top of a queued `mouseMove` REPLACES it
        // rather than queueing behind it. This is what bounds the queue — `end()` does not
        // clear it (neither here nor in AS3) and `process()` only `remove()`s an event whose
        // target is not the desktop, so without this every pointer sample taken between two
        // frames would survive into the next one and be walked again.
        if(event.type === 'mouseMove' || event.type === 'mousemove')
        {
            const last = this._eventArray[this._eventArray.length - 1];

            if(last && (last.type === 'mouseMove' || last.type === 'mousemove'))
            {
                this._eventArray[this._eventArray.length - 1] = event;

                return;
            }
        }

        this.eventListener(event);
    }

    /**
	 * Dequeues and returns the oldest event in the queue.
	 *
	 * @returns The oldest event, or null if empty
	 */
    // TS-only: AS3 drains the queue only through begin()/next()/remove(); this
    // head-pop is used by the port's own callers.
    public dequeue(): IMouseEventEntry | null
    {
        if(this._eventArray.length === 0)
        {
            return null;
        }

        return this._eventArray.shift()!;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/MouseEventQueue.as::dispose()
    public override dispose(): void
    {
        if(!this._disposed)
        {
            this._mouseX = 0;
            this._mouseY = 0;

            super.dispose();
        }
    }
}
