/**
 * Habbo Communication Event Constants
 *
 * Based on AS3: com.sulake.habbo.communication.enum.HabboCommunicationEvent
 *
 * These events are dispatched during the connection lifecycle:
 * INIT -> ESTABLISHED -> HANDSHAKING -> HANDSHAKED -> AUTHENTICATED
 *
 * Or on failure:
 * INIT -> ESTABLISHED -> HANDSHAKING -> HANDSHAKE_FAIL
 */
export const HabboCommunicationEvent = {
    /**
	 * Connection initialization started
	 */
    INIT: 'HABBO_CONNECTION_EVENT_INIT',

    /**
	 * Socket connection established
	 */
    ESTABLISHED: 'HABBO_CONNECTION_EVENT_ESTABLISHED',

    /**
	 * Encryption handshake in progress
	 */
    HANDSHAKING: 'HABBO_CONNECTION_EVENT_HANDSHAKING',

    /**
	 * Encryption handshake completed successfully
	 */
    HANDSHAKED: 'HABBO_CONNECTION_EVENT_HANDSHAKED',

    /**
	 * Encryption handshake failed
	 */
    HANDSHAKE_FAIL: 'HABBO_CONNECTION_EVENT_HANDSHAKE_FAIL',

    /**
	 * User successfully authenticated with the server
	 */
    AUTHENTICATED: 'HABBO_CONNECTION_EVENT_AUTHENTICATED',

    /**
	 * Registration event
	 */
    REGISTER: 'HABBO_CONNECTION_EVENT_REGISTER',

    /**
	 * Pocket session created (mobile/pocket API)
	 */
    POCKET_SESSION_CREATED: 'HABBO_POCKET_SESSION_CREATED',
} as const;

export type HabboCommunicationEventType = typeof HabboCommunicationEvent[keyof typeof HabboCommunicationEvent];
