import type {IUnknown} from '../IUnknown';

/**
 * Carried by `Component.unlock()`'s internal signal: which component just unlocked.
 *
 * AS3's `ComponentContext.unlockEventHandler()` reads `unknown` back off the event to find the
 * component whose dependencies have all resolved. This port's context closes over that component
 * instead, so nothing here reads the field — but the event is what AS3 dispatches, and emitting it
 * as the payload keeps the signal self-describing for any later listener that is not a closure.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/events/LockEvent.as
 */
export class LockEvent
{
    // AS3: .../src/com/sulake/core/runtime/events/LockEvent.as::unknown
    public unknown: IUnknown;

    // AS3: .../src/com/sulake/core/runtime/events/LockEvent.as::LockEvent()
    constructor(public readonly type: string, unknown: IUnknown)
    {
        this.unknown = unknown;
    }
}
