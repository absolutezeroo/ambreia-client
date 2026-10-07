import {MouseEventQueue} from '../MouseEventQueue';

/**
 * Queue of pending touch events for batch processing.
 *
 * AS3 derives this from `GenericEventQueue`, the shared base `MouseEventQueue`
 * also extends. That base now exists here too, but this class still extends
 * `MouseEventQueue` rather than it: `WindowContext.inputEventQueue` holds
 * whichever queue the current input mode built, and `DesktopController` reads
 * `mouseX`/`mouseY` off it in either mode. Those two live on `MouseEventQueue`,
 * so dropping to the common base would mean duplicating them here — churn on
 * the input hot path for no behavioural difference. AS3 avoids the question
 * because it types that field `IEventQueue` and reads the pointer position
 * from the Flash stage instead.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/tablet/TabletEventQueue.as
 */
export class TabletEventQueue extends MouseEventQueue
{
    private readonly _touchPosition: { x: number; y: number } = {x: 0, y: 0};

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/tablet/TabletEventQueue.as::get touchPosition()
    public get touchPosition(): { x: number; y: number }
    {
        return this._touchPosition;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/tablet/TabletEventQueue.as::dispose()
    public override dispose(): void
    {
        if(this._disposed) return;

        super.dispose();
    }
}
