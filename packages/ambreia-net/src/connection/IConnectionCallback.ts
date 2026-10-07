import type {IMessageDataWrapper} from '../messages/IMessageDataWrapper';

/**
 * Callback interface for connection events
 */
export interface IConnectionCallback
{
    /**
	 * Called when connection is initializing
	 */
    connectionInit?(host: string, port: number): void;

    /**
	 * Called when connection is established
	 */
    connectionOpened?(): void;

    /**
	 * Called when connection is closed.
	 *
	 * The close code is the only thing distinguishing a peer that shut down cleanly
	 * (1000/1001 — server stopped, maintenance) from a transport that simply died
	 * (1006 — backgrounded tab, sleeping machine, dropped route). It is gone the moment
	 * the socket's own handler returns, so it is passed on rather than re-derived.
	 */
    connectionClosed?(code?: number, wasClean?: boolean): void;

    /**
	 * Called when connection fails
	 */
    connectionError?(error: Error): void;

    /**
	 * Called when a message is received
	 * @param messageId The message ID
	 */
    messageReceived?(messageId: string): void;

    /**
	 * Called when a message is sent
	 * @param messageId The message ID
	 */
    messageSent?(messageId: string): void;

    /**
	 * Called when a message fails to parse
	 */
    messageParseError?(message: IMessageDataWrapper): void;
}
