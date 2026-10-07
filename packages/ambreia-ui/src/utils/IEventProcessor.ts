import type {EventProcessorState} from './EventProcessorState';
import type {IEventQueue} from './IEventQueue';

/**
 * Drains one {@link IEventQueue} against the shared {@link EventProcessorState}.
 *
 * `MouseEventProcessor` and `TabletEventProcessor` are the two implementations.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/IEventProcessor.as
 */
export interface IEventProcessor<TEvent>
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/IEventProcessor.as::process()
    process(state: EventProcessorState, queue: IEventQueue<TEvent>): void;
}
