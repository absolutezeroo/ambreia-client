/**
 * The names `HabboCommunicationManager` emits on its own `events` emitter.
 *
 * These are not `HabboCommunicationEvent` — that one carries the AS3 connection-lifecycle codes
 * (`HABBO_CONNECTION_EVENT_*`) that ride *inside* `LOGIN_STEP`. These are the port's own emitter
 * keys, which AS3 has no counterpart for: Flash dispatched typed `Event` subclasses on the
 * component, where this port uses one `EventEmitter` keyed by string.
 *
 * They exist as constants for the reason every event name in this port should: a literal at the
 * `emit` site and a literal at the `on` site drift apart in silence, and the listener simply never
 * runs. `IHabboCommunicationManagerEvents` keys off this object so the map and the call sites
 * cannot disagree.
 */
// TS-only: AS3 dispatches typed Flash events on the component instead of naming them.
export const HabboCommunicationManagerEvent = {
    /**
	 * A step of the connection lifecycle; the payload is a `HabboCommunicationEventType`.
	 */
    LOGIN_STEP: 'loginStep',

    /**
	 * The handshake completed and the player exists.
	 */
    AUTHENTICATED: 'authenticated',

    /**
	 * The socket failed to connect, or failed while connecting.
	 */
    CONNECTION_ERROR: 'connectionError',

    /**
	 * The server closed the session; carries the reason code and its localized text.
	 */
    DISCONNECTED: 'disconnected',

    /**
	 * The player closed the disconnect dialog, i.e. acknowledged that the session is over.
	 *
	 * AS3 reaches this moment only in the branch that has a live `LoginFlow`: `disconnected()` hands
	 * over to `onBufferedDisconnected()` → `showDisconnected()`, which puts the player back on the
	 * login screen. This port has no LoginFlow — `vortex-web` owns login — so the engine says the
	 * session is over and the client decides where "back to login" is.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/demo/_SafeCls_98.as::onBufferedDisconnected()
    DISCONNECT_ACKNOWLEDGED: 'disconnectAcknowledged',

    /**
	 * A server-sent error message; carries the code and its text.
	 */
    ERROR: 'error',
} as const;

export type HabboCommunicationManagerEventType =
    typeof HabboCommunicationManagerEvent[keyof typeof HabboCommunicationManagerEvent];
