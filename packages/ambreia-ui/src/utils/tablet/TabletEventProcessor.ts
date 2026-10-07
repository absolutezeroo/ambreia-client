import {MouseEventProcessor} from '../MouseEventProcessor';
import type {EventProcessorState} from '../EventProcessorState';
import type {MouseEventQueue} from '../MouseEventQueue';

/**
 * Touch input processor.
 *
 * The 701 client ships this as a deliberate no-op: `process()` copies the state in,
 * opens and closes the queue without reading a single event, and copies the state back
 * out - so switching `WindowContext.inputMode` to `INPUT_MODE_TOUCH` drains input
 * rather than dispatching it. That is ported as-is; substituting the mouse processor
 * here would make touch mode behave like a client Sulake never shipped.
 *
 * Note AS3 does not carry `lastMouseDownTarget` / `lastClickAwayTarget` across, unlike
 * `MouseEventProcessor.process()` - those two are left untouched on the state object.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/tablet/TabletEventProcessor.as
 */
export class TabletEventProcessor extends MouseEventProcessor
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/tablet/TabletEventProcessor.as::process()
    public override process(state: EventProcessorState, queue: MouseEventQueue): void
    {
        if(queue.length === 0)
        {
            return;
        }

        const desktop = state.desktop;
        const hovered = state.hovered;
        const lastClickTarget = state.lastClickTarget;
        const renderer = state.renderer;
        const eventTrackers = state.eventTrackers;

        queue.begin();
        queue.end();

        state.desktop = desktop;
        state.hovered = hovered;
        state.lastClickTarget = lastClickTarget;
        state.renderer = renderer;
        state.eventTrackers = eventTrackers;
    }
}
