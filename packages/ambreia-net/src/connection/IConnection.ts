import type {IMessageDataWrapper} from '../messages/IMessageDataWrapper';
import type {IDisposable} from '@ambreia/common/IDisposable';
import type {IEncryption} from '../encryption/IEncryption';
import type {IMessageComposer} from '../messages/IMessageComposer';
import type {IMessageEvent} from '../messages/IMessageEvent';
import type {IMessageConfiguration} from '../messages/IMessageConfiguration';
import type {IPacketTap} from './IPacketTap';

/**
 * Interface for network connections
 *
 * Based on AS3: com.sulake.core.communication.connection.IConnection
 */
export interface IConnection extends IDisposable
{
    /**
	 * Whether the connection is currently established
	 */
    // AS3: .../src/com/sulake/core/communication/connection/IConnection.as::get connected()
    readonly connected: boolean;
    /**
	 * Connection timeout in milliseconds
	 */
    timeout: number;

    /**
	 * Initialize and connect to host
	 * @param host Server hostname or IP
	 * @param port Server port (0 for WebSocket default)
	 * @param tcpNoDelay AS3 socket TCP_NODELAY flag; ignored by WebSocket transport
	 * @returns True if connection attempt started
	 */
    // AS3: .../src/com/sulake/core/communication/connection/IConnection.as::init()
    init(host: string, port?: number, tcpNoDelay?: boolean): boolean;

    /**
	 * Recreate the underlying socket transport.
	 *
	 * AS3: IConnection.createSocket()
	 */
    // AS3: .../src/com/sulake/core/communication/connection/IConnection.as::createSocket()
    createSocket(): void;

    /**
	 * Add a legacy connection event listener.
	 *
	 * AS3: IConnection.addListener()
	 */
    // AS3: .../src/com/sulake/core/communication/connection/IConnection.as::addListener()
    addListener(type: string, listener: (...args: unknown[]) => void): void;

    /**
	 * Send an encrypted message
	 * @param composer The message to send
	 * @returns True if message was sent
	 */
    // AS3: .../src/com/sulake/core/communication/connection/IConnection.as::send()
    send(composer: IMessageComposer<unknown[]>): boolean;

    /**
	 * Send an unencrypted message
	 * @param composer The message to send
	 * @returns True if message was sent
	 */
    // AS3: .../src/com/sulake/core/communication/connection/IConnection.as::sendUnencrypted()
    sendUnencrypted(composer: IMessageComposer<unknown[]>): boolean;

    /**
	 * Set encryption for both directions
	 * @param clientToServer Encryption for outgoing messages
	 * @param serverToClient Encryption for incoming messages
	 */
    // AS3: .../src/com/sulake/core/communication/connection/IConnection.as::setEncryption()
    setEncryption(clientToServer: IEncryption, serverToClient: IEncryption): void;

    /**
	 * Mark the connection as authenticated.
	 *
	 * AS3: IConnection.isAuthenticated()
	 */
    // AS3: .../src/com/sulake/core/communication/connection/IConnection.as::isAuthenticated()
    isAuthenticated(): void;

    /**
	 * Mark the connection as configured and flush queued messages.
	 *
	 * AS3: IConnection.isConfigured()
	 */
    // AS3: .../src/com/sulake/core/communication/connection/IConnection.as::isConfigured()
    isConfigured(): void;

    /**
	 * Get the server-to-client encryption
	 */
    // AS3: .../src/com/sulake/core/communication/connection/IConnection.as::getServerToClientEncryption()
    getServerToClientEncryption(): IEncryption | null;

    /**
	 * Get the client-to-server encryption
	 */
    getClientToServerEncryption(): IEncryption | null;

    /**
	 * Register message classes from configuration
	 */
    // AS3: .../src/com/sulake/core/communication/connection/IConnection.as::registerMessageClasses()
    registerMessageClasses(config: IMessageConfiguration): void;

    /**
	 * Add a message event handler
	 */
    // AS3: .../src/com/sulake/core/communication/connection/IConnection.as::addMessageEvent()
    addMessageEvent(event: IMessageEvent): void;

    /**
	 * Remove a message event handler
	 */
    // AS3: .../src/com/sulake/core/communication/connection/IConnection.as::removeMessageEvent()
    removeMessageEvent(event: IMessageEvent): void;

    /**
	 * Process received data (call from update loop)
	 */
    // AS3: .../src/com/sulake/core/communication/connection/IConnection.as::processReceivedData()
    processReceivedData(): void;

    /**
	 * Close the connection
	 */
    // AS3: .../src/com/sulake/core/communication/connection/IConnection.as::close()
    close(): void;

    /**
	 * Subscribe to messageEvent
	 */
    on(event: 'messageEvent', listener: (event: IMessageEvent) => void): this;

    /**
	 * Unsubscribe from messageEvent
	 */
    off(event: 'messageEvent', listener: (event: IMessageEvent) => void): this;

    // TS-only: the packet inspector's hook (spec §8); null removes it.
    setPacketTap(tap: IPacketTap | null): void;

    // TS-only: hands a message to the handlers as if the server had sent it, without touching the cipher.
    injectIncoming(messageId: number, values: unknown[]): void;

    /**
     * TS-only, the new network style (spec §6, `style/MessageMap`): `handler` receives every
     * incoming message of `header`, before the inherited events, and the call returns the
     * unsubscription. Throws when an inherited event class or another handler already serves the
     * header: two readers of one message is a bug, not a feature.
     */
    handleIncoming(header: number, name: string, handler: (wrapper: IMessageDataWrapper) => void): () => void;

    /** TS-only, the new network style: sends `values` under `header`, like send() does a composer's. */
    sendValues(header: number, name: string, values: unknown[]): boolean;
}
