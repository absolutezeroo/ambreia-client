/**
 * The base of the session-data events.
 *
 * AS3's is a bare `flash.events.Event` subclass that adds nothing but its own type — its whole job
 * is to give `SessionDataToWidgetEvent` a base, and to let a listener test `is SessionDataEvent`.
 *
 * DEVIATION: there is no `flash.events.Event` here, so the three constructor arguments are carried
 *   as readonly fields instead of being handed to a super. `bubbles` and `cancelable` have no
 *   meaning against this port's `EventEmitter` and are kept because AS3's constructor takes them and
 *   `SessionDataToWidgetEvent` passes them through.
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/events/SessionDataEvent.as
 */
export class SessionDataEvent
{
    // AS3: .../src/com/sulake/habbo/session/events/SessionDataEvent.as::SessionDataEvent()
    constructor(
        public readonly type: string,
        public readonly bubbles: boolean = false,
        public readonly cancelable: boolean = false
    )
    {
    }
}
