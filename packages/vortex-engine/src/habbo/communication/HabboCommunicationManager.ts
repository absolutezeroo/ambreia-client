import {Component, ComponentDependency, type IContext} from '@core/runtime';
import {ArcFour} from '@habbo/communication/encryption/ArcFour';
import {DiffieHellman} from '@habbo/communication/encryption/DiffieHellman';
import {Logger} from '@core/utils/Logger';
import {HabboMessages} from './HabboMessages';
import type { HabboCommunicationEventType} from './enum/HabboCommunicationEvent';
import {HabboCommunicationEvent} from './enum/HabboCommunicationEvent';
import {HabboCommunicationManagerEvent} from './enum/HabboCommunicationManagerEvent';
import type {IHabboCommunicationManager} from './IHabboCommunicationManager';
import type {ICoreCommunicationManager} from '@core/communication/ICoreCommunicationManager';
import type {IConnection} from '@core/communication/connection/IConnection';
import type {IConnectionCallback} from '@core/communication/connection/IConnectionCallback';
import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import type {IMessageConfiguration} from '@core/communication/messages/IMessageConfiguration';
import type {IEncryption} from '@core/communication/encryption/IEncryption';
import type {IKeyExchange} from '@core/communication/handshake/IKeyExchange';
import type {IMessageDataWrapper} from '@core/communication/messages/IMessageDataWrapper';
import type {IConnectionActions} from './IConnectionActions';
import type {IHabboWebApiListener} from './IHabboWebApiListener';
import type {IHabboWebApiSession} from './IHabboWebApiSession';
import {HabboWebApiSession} from './HabboWebApiSession';
import {IID_CoreCommunicationManager} from "@iid/IIDCoreCommunicationManager";
import {ErrorReportStorage} from '@core/utils/ErrorReportStorage';
import {HabboErrorVariableEnum} from '@habbo/tracking/HabboErrorVariableEnum';

const log = Logger.getLogger('habbo.communication.HabboCommunicationManager');

export interface IHabboConnectionConfig
{
    host: string;
    ports: number[];
    ssoTicket?: string;
}

/**
 * Habbo Communication Manager
 *
 * Based on AS3: com.sulake.habbo.communication.HabboCommunicationManager
 *
 * Uses Component.events as the central event dispatcher for communication-related
 * events like AUTHENTICATED, HANDSHAKED, etc.
 */
export class HabboCommunicationManager extends Component implements IHabboCommunicationManager, IConnectionCallback
{
    private _messageConfig: IMessageConfiguration;
    private _config: IHabboConnectionConfig | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/HabboCommunicationManager.as::_portIndex
    private _portIndex: number = -1;
    private _connectionAttempt: number = 1;
    private _maxConnectionAttempts: number = 2;
    private _pendingMessageEvents: IMessageEvent[] = [];
    // AS3: .../src/com/sulake/habbo/communication/HabboCommunicationManager.as::_mode
    private _mode: number = 0;
    private _tcpNoDelay: boolean = true;
    private _suggestedLoginActions: unknown[] = [];
    private _messageQueue: string = '';

    constructor(context: IContext)
    {
        super(context);
        this._messageConfig = new HabboMessages();
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/HabboCommunicationManager.as::_connection
    private _connection: IConnection | null = null;

    // AS3: .../src/com/sulake/habbo/communication/HabboCommunicationManager.as::get connection()
    get connection(): IConnection | null
    {
        return this._connection;
    }

    private _ssoTicket: string | null = null;

    get ssoTicket(): string | null
    {
        return this._ssoTicket;
    }

    set ssoTicket(value: string | null)
    {
        this._ssoTicket = value;
    }

    get isConnected(): boolean
    {
        return this._connection?.connected ?? false;
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboCommunicationManager.as::get mode()
    get mode(): number
    {
        return 0;
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboCommunicationManager.as::set mode()
    set mode(value: number)
    {
        this._mode = value;
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboCommunicationManager.as::get port()
    get port(): number
    {
        if(!this._config || this._portIndex < 0 || this._portIndex >= this._config.ports.length)
        {
            return 0;
        }

        return this._config.ports[this._portIndex];
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboCommunicationManager.as::get suggestedLoginActions()
    get suggestedLoginActions(): unknown[]
    {
        return this._suggestedLoginActions;
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboCommunicationManager.as::set suggestedLoginActions()
    set suggestedLoginActions(value: unknown[])
    {
        this._suggestedLoginActions = value;
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboCommunicationManager.as::set tcpNoDelay()
    set tcpNoDelay(value: boolean)
    {
        this._tcpNoDelay = value;
    }

    get messages(): IMessageConfiguration
    {
        return this._messageConfig;
    }

    protected override get dependencies(): Array<ComponentDependency<any>>
    {
        return [
            new ComponentDependency(
                IID_CoreCommunicationManager,
                (manager: ICoreCommunicationManager | null) =>
                {
                    this._communicationManager = manager;
                },
                true
            ),
        ];
    }

    private _communicationManager: ICoreCommunicationManager | null = null;

    private get communicationManager(): ICoreCommunicationManager
    {
        if(!this._communicationManager)
        {
            throw new Error('CommunicationManager not available');
        }

        return this._communicationManager;
    }

    private _connectionActions: IConnectionActions | null = null;

    private get connectionActions(): IConnectionActions
    {
        if(!this._connectionActions)
        {
            throw new Error('Connection actions not set. Call setConnectionActions() first.');
        }

        return this._connectionActions;
    }

    /**
	 * Set connection actions for state updates
	 * Called by Vortex after module registration
	 */
    setConnectionActions(actions: IConnectionActions): void
    {
        this._connectionActions = actions;
    }

    configure(config: IHabboConnectionConfig): void
    {
        this._config = config;
        this._ssoTicket = config.ssoTicket || null;
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboCommunicationManager.as::initConnection()
    initConnection(type: string): void
    {
        if(type !== 'habbo')
        {
            log.warn(`Unknown connection type: ${type}`);

            return;
        }

        if(!this._config)
        {
            throw new Error('Connection not configured. Call configure() first.');
        }

        this.createConnection();

        this._portIndex = -1;
        this._connectionAttempt = 1;
        this.tryNextPort();
    }

    addMessageEvent(event: IMessageEvent): IMessageEvent
    {
        if(this._connection)
        {
            this._connection.addMessageEvent(event);
        }
        else
        {
            // Buffer events until connection is established
            this._pendingMessageEvents.push(event);
        }
        return event;
    }

    removeMessageEvent(event: IMessageEvent): void
    {
        if(this._connection)
        {
            this._connection.removeMessageEvent(event);
        }
        else
        {
            // Remove from pending events if not yet registered
            const index = this._pendingMessageEvents.indexOf(event);
            if(index !== -1)
            {
                this._pendingMessageEvents.splice(index, 1);
            }
        }
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboCommunicationManager.as::renewSocket()
    renewSocket(): void
    {
        this._connectionAttempt = 1;
        this._portIndex = -1;
        this._connection?.createSocket();
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboCommunicationManager.as::addHabboConnectionMessageEvent()
    addHabboConnectionMessageEvent(event: IMessageEvent): IMessageEvent
    {
        return this.addMessageEvent(event);
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboCommunicationManager.as::removeHabboConnectionMessageEvent()
    removeHabboConnectionMessageEvent(event: IMessageEvent): void
    {
        this.removeMessageEvent(event);
    }

    createEncryption(): IEncryption
    {
        return new ArcFour();
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboCommunicationManager.as::initializeEncryption()
    initializeEncryption(): IEncryption
    {
        return this.createEncryption();
    }

    createKeyExchange(prime: string, generator: string): IKeyExchange
    {
        return new DiffieHellman(prime, generator);
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboCommunicationManager.as::initializeKeyExchange()
    initializeKeyExchange(prime: string, generator: string): IKeyExchange
    {
        return this.createKeyExchange(prime, generator);
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboCommunicationManager.as::disconnect()
    disconnect(): void
    {
        this._connection?.close();
    }

    onMessage(listener: (event: IMessageEvent) => void): () => void
    {
        if(!this._connection)
        {
            // Buffer listener until connection is ready
            const bufferedListener = listener;
            const checkConnection = () =>
            {
                if(this._connection)
                {
                    this._connection.on('messageEvent', bufferedListener);
                }
            };
            // Check on next tick in case connection is created soon
            setTimeout(checkConnection, 0);
            return () =>
            {
                this._connection?.off('messageEvent', bufferedListener);
            };
        }

        this._connection.on('messageEvent', listener);
        return () =>
        {
            this._connection?.off('messageEvent', listener);
        };
    }

    private _webApiSession: HabboWebApiSession | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/HabboCommunicationManager.as::_host
    private _host: string = '';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/HabboCommunicationManager.as::_ports
    private _ports: number[] = [];

    /**
	 * AS3: updateHostParameters()
	 * Reads connection.info.host and connection.info.port from configuration
	 * and updates the internal host/port list.
	 *
	 * The AS3 body looks nothing like this and yet does exactly this: it rebuilds the two property
	 * names at runtime from arrays of character codes (`[65162,65162,65158,65155]` and friends,
	 * through `getKeyValue()`) so that `connection.info.host` appears nowhere in the SWF. It is
	 * anti-tamper, not behaviour — the key looked up is the same string — and reproducing it in a
	 * readable port would hide the one thing this method is about. Hence the plaintext keys, and
	 * hence `member-body-diff.mjs` reporting eight "missing" numbers here that are the obfuscation
	 * payload itself.
	 */
    // AS3: .../src/com/sulake/habbo/communication/HabboCommunicationManager.as::updateHostParameters()
    updateHostParameters(): void
    {
        const configuration = this.context.configuration;

        if(!configuration)
        {
            return;
        }

        const host = configuration.getProperty('connection.info.host');

        if(!host)
        {
            log.error('connection.info.host not set');

            return;
        }

        const portStr = configuration.getProperty('connection.info.port');

        if(!portStr)
        {
            log.error('connection.info.port not set');

            return;
        }

        this._ports = portStr.split(',').map(p => parseInt(p.trim(), 10));
        this._host = host;
    }

    /**
	 * AS3: createHabboWebApiSession(listener, server)
	 * Creates a new HabboWebApiSession for HTTP API requests.
	 */
    // AS3: .../src/com/sulake/habbo/communication/HabboCommunicationManager.as::createHabboWebApiSession()
    createHabboWebApiSession(listener: IHabboWebApiListener, server: string): IHabboWebApiSession
    {
        if(this._webApiSession)
        {
            this.resetHabboWebApiSession();
        }

        const session = new HabboWebApiSession(server);

        session.addListener(listener);

        this._webApiSession = session;
        this.events.emit(HabboCommunicationEvent.POCKET_SESSION_CREATED);

        return session;
    }

    /**
	 * AS3: getHabboWebApiSession()
	 * Returns the current HabboWebApiSession, or null if not created.
	 */
    // AS3: .../src/com/sulake/habbo/communication/HabboCommunicationManager.as::getHabboWebApiSession()
    getHabboWebApiSession(): IHabboWebApiSession | null
    {
        return this._webApiSession;
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboCommunicationManager.as::resetHabboWebApiSession()
    resetHabboWebApiSession(): void
    {
        if(!this._webApiSession)
        {
            return;
        }

        this._webApiSession.dispose();
        this._webApiSession = null;
    }

    // IConnectionCallback
    // AS3: .../src/com/sulake/habbo/communication/HabboCommunicationManager.as::connectionInit()
    connectionInit(host: string, port: number): void
    {
        log.info(`Connecting to ${host}:${port}...`);

        this._connectionActions?.setConnecting();
    }

    connectionOpened(): void
    {
        log.info('Connected to server');

        this._connectionActions?.setConnected();
    }

    /**
	 * Only a *clean* close means the session is over.
	 *
	 * 1000/1001 is the peer closing deliberately — the server stopped, or went into
	 * maintenance. 1006 is no close frame at all: the transport died under us, which is
	 * what a tab Chrome froze in the background looks like, and what a flaky route looks
	 * like. Logging the player out on that would undo the background-tab work (see
	 * SocketConnection's own note on the close code) and throw them back to the login
	 * screen every time they came back to the tab.
	 *
	 * AS3 has no equivalent decision because Flash sockets do not have close codes: it
	 * reacts to the server's own disconnect *message* instead
	 * (`_SafeCls_98.disconnected()` → `loginFlow.showDisconnected()`), which only exists
	 * when the server had a chance to send it.
	 */
    connectionClosed(code?: number, wasClean?: boolean): void
    {
        const closedByPeer = code === 1000 || code === 1001;

        log.info(`Connection closed (code=${code ?? 'n/a'}, clean=${wasClean ?? 'n/a'})`);

        if(!closedByPeer)
        {
            log.debug('Close was not peer-initiated; keeping the session alive');

            return;
        }

        this._connectionActions?.setDisconnected();
    }

    connectionError(error: Error): void
    {
        log.error(`Connection error: ${error.message}`);
        // Only set error state if we've exhausted all retry attempts
        if(this._connectionAttempt >= this._maxConnectionAttempts &&
			this._portIndex >= (this._config?.ports.length ?? 0) - 1)
        {
            this._connectionActions?.setError(error.message);
            this.events.emit(HabboCommunicationManagerEvent.CONNECTION_ERROR, error);
        }
        this.tryNextPort();
    }

    /**
	 * `setParameter`, not `addDebugData`: the two are different halves of a crash report, and all
	 * three of these went into the wrong one. A parameter is a named slot the report carries —
	 * which is what `HabboErrorVariableEnum` declares these keys for, and why nothing was ever
	 * written under them — while debug data is an appended list. AS3 puts the times and the
	 * offending payload in the slots and only the message QUEUE in the list.
	 */
    // AS3: .../src/com/sulake/habbo/communication/HabboCommunicationManager.as::messageReceived()
    messageReceived(messageId: string): void
    {
        ErrorReportStorage.setParameter(
            HabboErrorVariableEnum.ERROR_VARIABLE_RECEIVED_MESSAGE_TIME, String(Date.now()));
        this.appendMessageQueue('R', messageId);
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboCommunicationManager.as::messageSent()
    messageSent(messageId: string): void
    {
        ErrorReportStorage.setParameter(
            HabboErrorVariableEnum.ERROR_VARIABLE_SENT_MESSAGE_TIME, String(Date.now()));
        this.appendMessageQueue('S', messageId);
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboCommunicationManager.as::messageParseError()
    messageParseError(message: IMessageDataWrapper): void
    {
        ErrorReportStorage.setParameter(
            HabboErrorVariableEnum.ERROR_VARIABLE_SENT_MESSAGE_DATA, String(message));
        this.setMessageQueueErrorDebugData();
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboCommunicationManager.as::setMessageQueueErrorDebugData()
    setMessageQueueErrorDebugData(): void
    {
        ErrorReportStorage.addDebugData('MESSAGE_QUEUE', this._messageQueue);
    }

    protected override initComponent(): void
    {
        log.debug('HabboCommunicationManager initialized');

        this.createConnection();

        // Forward loginStep events
        this.events.on(HabboCommunicationManagerEvent.LOGIN_STEP, (step: HabboCommunicationEventType) =>
        {
            this._connectionActions?.setLoginStep(step);

            if(step === HabboCommunicationEvent.AUTHENTICATED)
            {
                this._connection?.isAuthenticated();
                this._connectionActions?.setAuthenticated();
                this.events.emit(HabboCommunicationManagerEvent.AUTHENTICATED);
            }
        });
    }

    private createConnection(): void
    {
        if(this._connection)
        {
            return;
        }

        this._connection = this.communicationManager.createConnection(this);
        this._connection.registerMessageClasses(this._messageConfig);

        if(this._pendingMessageEvents.length > 0)
        {
            log.debug(`Flushing ${this._pendingMessageEvents.length} pending message events`);

            for(const event of this._pendingMessageEvents)
            {
                this._connection.addMessageEvent(event);
            }

            this._pendingMessageEvents = [];
        }
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboCommunicationManager.as::tryNextPort()
    private tryNextPort(): void
    {
        if(!this._connection || !this._config) return;

        if(this._connection.connected) return;

        this._portIndex++;

        if(this._portIndex >= this._config.ports.length)
        {
            this._connectionAttempt++;

            if(this._connectionAttempt > this._maxConnectionAttempts)
            {
                log.error('Failed to connect after all attempts');

                return;
            }

            this._portIndex = 0;
        }

        const port = this._config.ports[this._portIndex];

        this._connection.timeout = this._connectionAttempt * 10000;
        this._connection.init(this._config.host, port, this._tcpNoDelay);
    }

    private appendMessageQueue(direction: string, messageId: string): void
    {
        if(this._messageQueue.length > 0)
        {
            this._messageQueue += `,${direction}:${messageId}`;
        }
        else
        {
            this._messageQueue = `${direction}:${messageId}`;
        }

        if(this._messageQueue.length > 150)
        {
            this._messageQueue = this._messageQueue.substring(this._messageQueue.length - 150);
        }
    }
}
