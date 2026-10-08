import type {EventEmitter} from 'eventemitter3';
import type {IConnection} from '@ambreia/net/connection/IConnection';
import type {IMessageEvent} from '@ambreia/net/messages/IMessageEvent';
import type {IEncryption} from '@ambreia/net/encryption/IEncryption';
import type {IKeyExchange} from '@ambreia/net/handshake/IKeyExchange';
import type {HabboCommunicationEventType} from './enum';
import type {HabboCommunicationManagerEvent} from './enum';
import type {IHabboWebApiListener} from './IHabboWebApiListener';
import type {IHabboWebApiSession} from './IHabboWebApiSession';

/**
 * Events emitted by HabboCommunicationManager
 */
export interface IHabboCommunicationManagerEvents
{
    [HabboCommunicationManagerEvent.LOGIN_STEP]: (step: HabboCommunicationEventType) => void;
    [HabboCommunicationManagerEvent.AUTHENTICATED]: () => void;
    [HabboCommunicationManagerEvent.CONNECTION_ERROR]: (error: Error) => void;
    [HabboCommunicationManagerEvent.DISCONNECTED]: (reason: number, reasonText: string) => void;
    /**
	 * No reason is carried: the dialog the player just dismissed is where AS3 shows it. See the
	 * constant for why this moment exists at all in a port with no `LoginFlow`.
	 */
    [HabboCommunicationManagerEvent.DISCONNECT_ACKNOWLEDGED]: () => void;
    [HabboCommunicationManagerEvent.ERROR]: (code: number, message: string) => void;
}

/**
 * Interface for Habbo-specific communication manager
 */
export interface IHabboCommunicationManager
{
    /**
	 * Event emitter for communication events
	 */
    readonly events: EventEmitter;
    /**
	 * Get the main Habbo connection
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/IHabboCommunicationManager.as::get connection()
    readonly connection: IConnection | null;

    /**
	 * AS3: get mode()
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/IHabboCommunicationManager.as::get mode()
    mode: number;

    /**
	 * AS3: get port()
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/IHabboCommunicationManager.as::get port()
    readonly port: number;

    /**
	 * AS3: set tcpNoDelay()
	 */
    set tcpNoDelay(value: boolean);

    /**
	 * Whether currently connected to server
	 */
    readonly isConnected: boolean;

    /**
	 * Get the SSO ticket for authentication
	 */
    readonly ssoTicket: string | null;

    /**
	 * Initialize connection to Habbo server
	 * @param type Connection type (e.g., 'habbo', 'debug')
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/IHabboCommunicationManager.as::initConnection()
    initConnection(type: string): void;

    /**
	 * AS3: renewSocket()
	 */
    renewSocket(): void;

    /**
	 * Add a message event handler
	 */
    addMessageEvent(event: IMessageEvent): IMessageEvent;

    /**
	 * AS3: addHabboConnectionMessageEvent()
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/IHabboCommunicationManager.as::addHabboConnectionMessageEvent()
    addHabboConnectionMessageEvent(event: IMessageEvent): IMessageEvent;

    /**
	 * Remove a message event handler
	 */
    removeMessageEvent(event: IMessageEvent): void;

    /**
	 * AS3: removeHabboConnectionMessageEvent()
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/IHabboCommunicationManager.as::removeHabboConnectionMessageEvent()
    removeHabboConnectionMessageEvent(event: IMessageEvent): void;

    /**
	 * Create a new encryption instance
	 */
    createEncryption(): IEncryption;

    /**
	 * AS3: initializeEncryption()
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/IHabboCommunicationManager.as::initializeEncryption()
    initializeEncryption(): IEncryption;

    /**
	 * Create a new key exchange instance
	 * @param prime The prime number (p)
	 * @param generator The generator (g)
	 */
    createKeyExchange(prime: string, generator: string): IKeyExchange;

    /**
	 * AS3: initializeKeyExchange()
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/IHabboCommunicationManager.as::initializeKeyExchange()
    initializeKeyExchange(prime: string, generator: string): IKeyExchange;

    /**
	 * AS3: setMessageQueueErrorDebugData()
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/IHabboCommunicationManager.as::setMessageQueueErrorDebugData()
    setMessageQueueErrorDebugData(): void;

    /**
	 * Disconnect from the server
	 */
    disconnect(): void;

    /**
	 * Register a global message listener
	 * Called for ALL incoming messages after parsing
	 * @returns Unsubscribe function
	 */
    onMessage(listener: (event: IMessageEvent) => void): () => void;

    /**
	 * AS3: updateHostParameters()
	 * Reads connection.info.host and connection.info.port from configuration
	 * and updates the internal host/port list.
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/IHabboCommunicationManager.as::updateHostParameters()
    updateHostParameters(): void;

    /**
	 * AS3: createHabboWebApiSession(listener, server)
	 * Creates a new HabboWebApiSession for HTTP API requests.
	 *
	 * @param listener - IHabboWebApiListener to receive API callbacks
	 * @param server - Base server URL (e.g., 'https://www.habbo.com')
	 * @returns The created IHabboWebApiSession
	 */
    createHabboWebApiSession(listener: IHabboWebApiListener, server: string): IHabboWebApiSession;

    /**
	 * AS3: getHabboWebApiSession()
	 * Returns the current HabboWebApiSession, or null if not created.
	 */
    getHabboWebApiSession(): IHabboWebApiSession | null;

    /**
	 * AS3: resetHabboWebApiSession()
	 */
    resetHabboWebApiSession(): void;
}
