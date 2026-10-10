import type {IMessageEvent} from '@ambreia/net/messages/IMessageEvent';
import type {IEncryption} from '@ambreia/net/encryption/IEncryption';
import type {IKeyExchange} from '@ambreia/net/handshake/IKeyExchange';
import {CryptoTools} from '@ambreia/net/encryption/CryptoTools';
import {RSA} from '@ambreia/net/encryption/RSA';
import type {SocketConnection} from '@ambreia/net/connection/SocketConnection';
import {Logger} from '@ambreia/common/utils/Logger';
import type {HabboCommunicationDemo} from './HabboCommunicationDemo';
import type {IHabboCommunicationManager} from '../IHabboCommunicationManager';
import {HabboCommunicationEvent} from '../enum/HabboCommunicationEvent';

// Events
import {
    AuthenticationOKMessageEvent,
    CompleteDiffieHandshakeMessageEvent,
    DisconnectReasonMessageEvent,
    GenericErrorMessageEvent,
    IdentityAccountsEvent,
    InitDiffieHandshakeMessageEvent,
    PingMessageEvent,
    UniqueMachineIdMessageEvent,
} from '@ambreia/protocol/incoming/handshake/index';

// Parsers
import type {
    CompleteDiffieHandshakeMessageParser,
    DisconnectReasonMessageParser,
    GenericErrorMessageParser,
    IdentityAccountsEventParser,
    InitDiffieHandshakeMessageParser,
} from '@ambreia/protocol/parser/handshake/index';

import {LoginFailedHotelClosedMessageEvent, MaintenanceStatusMessageEvent,} from '@ambreia/protocol/incoming/availability/index';

import type {
    LoginFailedHotelClosedMessageEventParser,
    MaintenanceStatusMessageEventParser,
} from '@ambreia/protocol/parser/availability/index';

import {ErrorReportEvent} from '@ambreia/protocol/incoming/error/index';
import type {ErrorReportEventParser} from '@ambreia/protocol/parser/error/index';

// Composers
import {
    ClientHelloMessageComposer,
    CompleteDiffieHandshakeMessageComposer,
    InfoRetrieveMessageComposer,
    InitDiffieHandshakeMessageComposer,
    PongMessageComposer,
} from '@ambreia/protocol/outgoing/handshake/index';

import {EventLogMessageComposer} from '@ambreia/protocol/outgoing/tracking/index';
import {GetFurnitureAliasesMessageComposer} from '@ambreia/protocol/outgoing/room/engine/index';

const log = Logger.getLogger('habbo.communication.demo.IncomingMessages');

/**
 * Handles incoming messages during connection/handshake
 *
 * Faithfully mirrors AS3: com.sulake.habbo.communication.demo.IncomingMessages
 *
 * Takes a reference to HabboCommunicationDemo and calls back to its methods
 * (loginOk, disconnected, handleErrorMessage, etc.) rather than emitting events.
 *
 * @see source_as_win63/habbo/communication/demo/IncomingMessages.as
 */
export class IncomingMessages
{
    /** How long the server has to complete the Diffie-Hellman exchange once the socket is open. */
    private static readonly HANDSHAKE_TIMEOUT_MS = 15000;

    private _demo: HabboCommunicationDemo;
    // AS3: sources/win63_version/habbo/communication/demo/class_1762.as::_communication
    private _communication: IHabboCommunicationManager;
    // AS3: sources/win63_version/habbo/communication/demo/class_1762.as::_messageEvents
    private _messageEvents: IMessageEvent[] = [];
    private _keyExchange: IKeyExchange | null = null;
    // AS3: sources/win63_version/habbo/communication/demo/class_1762.as::_privateKey
    private _privateKey: string = '';
    private _isHandshaking: boolean = false;
    private _wasDisconnected: boolean = false;
    /** The handshake deadline, armed when the socket opens and cleared when encryption is on. */
    private _handshakeTimer: ReturnType<typeof setTimeout> | null = null;
    // AS3: sources/win63_version/habbo/communication/demo/class_1762.as::_rsa
    private _rsa: RSA;

    private _boundOnConnected: () => void;
    private _boundOnDisconnected: () => void;

    constructor(demo: HabboCommunicationDemo, communication: IHabboCommunicationManager)
    {
        this._demo = demo;
        this._communication = communication;
        // The configured server key when there is one (a local emulator's development key).
        this._rsa = new RSA(demo.rsaModulus ?? undefined);

        const connection = this._communication.connection as SocketConnection;

        if(!connection)
        {
            throw new Error('Connection is required to initialize!');
        }

        this._boundOnConnected = this.onConnectionEstablished.bind(this);
        this._boundOnDisconnected = this.onConnectionDisconnected.bind(this);

        connection.on('connected', this._boundOnConnected);
        connection.on('disconnected', this._boundOnDisconnected);

        // Register message handlers - matches AS3 order
        this.addHabboConnectionMessageEvent(new LoginFailedHotelClosedMessageEvent(this.onLoginFailedHotelClosed.bind(this)));
        this.addHabboConnectionMessageEvent(new DisconnectReasonMessageEvent(this.onDisconnectReason.bind(this)));
        this.addHabboConnectionMessageEvent(new MaintenanceStatusMessageEvent(this.onMaintenance.bind(this)));
        this.addHabboConnectionMessageEvent(new GenericErrorMessageEvent(this.onGenericError.bind(this)));
        this.addHabboConnectionMessageEvent(new InitDiffieHandshakeMessageEvent(this.onInitDiffieHandshake.bind(this)));
        this.addHabboConnectionMessageEvent(new UniqueMachineIdMessageEvent(this.onUniqueMachineId.bind(this)));
        this.addHabboConnectionMessageEvent(new CompleteDiffieHandshakeMessageEvent(this.onCompleteDiffieHandshake.bind(this)));
        this.addHabboConnectionMessageEvent(new ErrorReportEvent(this.onErrorReport.bind(this)));
        this.addHabboConnectionMessageEvent(new IdentityAccountsEvent(this.onIdentityAccounts.bind(this)));
        this.addHabboConnectionMessageEvent(new PingMessageEvent(this.onPing.bind(this)));
        this.addHabboConnectionMessageEvent(new AuthenticationOKMessageEvent(this.onAuthenticationOK.bind(this)));
    }

    // AS3: .../src/com/sulake/habbo/game/IncomingMessages.as::dispose()
    dispose(): void
    {
        const connection = this._communication.connection as SocketConnection;

        if(connection)
        {
            connection.off('connected', this._boundOnConnected);
            connection.off('disconnected', this._boundOnDisconnected);
        }

        for(const event of this._messageEvents)
        {
            this._communication.removeMessageEvent(event);
        }

        this._messageEvents = [];
        this._keyExchange = null;
        this.clearHandshakeTimer();
    }

    private clearHandshakeTimer(): void
    {
        if(this._handshakeTimer === null) return;

        clearTimeout(this._handshakeTimer);
        this._handshakeTimer = null;
    }

    /**
     * The handshake cannot complete: a wrong RSA modulus (the decrypted prime is garbage and BigInt
     * throws), an invalid server key, or no answer in time. Without this the error died in the
     * message handler's catch and `waitForAuthentication()` waited forever on a silent screen.
     */
    // TS-only: AS3 had no failure path here; its handshake either completed or the socket closed.
    private failHandshake(connection: {close(): void} | null, error: Error): void
    {
        this.clearHandshakeTimer();

        if(!this._isHandshaking) return;

        log.error(`Handshake failed: ${error.message}`);
        this._isHandshaking = false;
        this._demo.dispatchLoginStepEvent(HabboCommunicationEvent.HANDSHAKE_FAIL);
        connection?.close();
    }

    /**
	 * @see source_as_win63/habbo/communication/demo/IncomingMessages.as addHabboConnectionMessageEvent()
	 */
    // AS3: sources/win63_version/habbo/communication/demo/class_1762.as::addHabboConnectionMessageEvent()
    private addHabboConnectionMessageEvent(event: IMessageEvent): void
    {
        this._communication.addMessageEvent(event);
        this._messageEvents.push(event);
    }

    /**
	 * @see source_as_win63/habbo/communication/demo/IncomingMessages.as onConnectionEstablished()
	 */
    // AS3: sources/win63_version/habbo/communication/demo/class_1762.as::onConnectionEstablished()
    private onConnectionEstablished(): void
    {
        const connection = this._communication.connection;

        if(!connection) return;

        this._demo.dispatchLoginStepEvent(HabboCommunicationEvent.ESTABLISHED);

        this._wasDisconnected = false;
        this._isHandshaking = true;

        this._demo.dispatchLoginStepEvent(HabboCommunicationEvent.HANDSHAKING);

        this.clearHandshakeTimer();
        this._handshakeTimer = setTimeout(
            () => this.failHandshake(connection, new Error(`no completed handshake after ${IncomingMessages.HANDSHAKE_TIMEOUT_MS} ms`)),
            IncomingMessages.HANDSHAKE_TIMEOUT_MS
        );

        connection.sendUnencrypted(new ClientHelloMessageComposer());
        connection.sendUnencrypted(new InitDiffieHandshakeMessageComposer());
    }

    /**
	 * @see source_as_win63/habbo/communication/demo/IncomingMessages.as onInitDiffieHandshake()
	 */
    // AS3: sources/win63_version/habbo/communication/demo/class_1762.as::onInitDiffieHandshake()
    private onInitDiffieHandshake(event: IMessageEvent): void
    {
        const connection = event.connection;

        if(!connection) return;

        if(!event) return;

        const parser = event.parser as InitDiffieHandshakeMessageParser;

        if(!parser) return;

        try
        {
            this.completeInitDiffieHandshake(connection, parser);
        }
        catch (error)
        {
            this.failHandshake(connection, error as Error);
        }
    }

    private completeInitDiffieHandshake(connection: NonNullable<IMessageEvent['connection']>, parser: InitDiffieHandshakeMessageParser): void
    {
        const primeDecimal = this._rsa.decryptString(parser.encryptedPrime);
        const generatorDecimal = this._rsa.decryptString(parser.encryptedGenerator);

        const primeHex = BigInt(primeDecimal).toString(16);
        const generatorHex = BigInt(generatorDecimal).toString(16);

        this._keyExchange = this._communication.createKeyExchange(primeHex, generatorHex);

        let bestPublicKey: string | null = null;
        let attempts = 10;

        while(attempts > 0)
        {
            const privateKey = this.generateRandomHexString(30);

            this._keyExchange.init(privateKey);

            const publicKey = this._keyExchange.getPublicKey(10);

            if(publicKey.length >= 64)
            {
                bestPublicKey = publicKey;

                this._privateKey = privateKey;

                break;
            }

            if(!bestPublicKey || publicKey.length > bestPublicKey.length)
            {
                bestPublicKey = publicKey;

                this._privateKey = privateKey;
            }

            attempts--;
        }

        if(bestPublicKey)
        {
            this._keyExchange.init(this._privateKey);
        }

        const encryptedPublicKey = this._rsa.encryptString(bestPublicKey || '');

        connection.sendUnencrypted(new CompleteDiffieHandshakeMessageComposer(encryptedPublicKey));
    }

    /**
	 * @see source_as_win63/habbo/communication/demo/IncomingMessages.as onCompleteDiffieHandshake()
	 */
    // AS3: sources/win63_version/habbo/communication/demo/class_1762.as::onCompleteDiffieHandshake()
    private onCompleteDiffieHandshake(event: IMessageEvent): void
    {
        const connection = event.connection;

        if(!connection || !this._keyExchange) return;

        const parser = event.parser as CompleteDiffieHandshakeMessageParser;

        if(!parser) return;

        try
        {
            this.completeDiffieHandshake(connection, parser);
        }
        catch (error)
        {
            this.failHandshake(connection, error as Error);
        }
    }

    private completeDiffieHandshake(connection: NonNullable<IMessageEvent['connection']>, parser: CompleteDiffieHandshakeMessageParser): void
    {
        if(!this._keyExchange) throw new Error('CompleteDiffieHandshake before InitDiffieHandshake');

        const serverPublicKey = this._rsa.decryptString(parser.encryptedPublicKey);

        this._keyExchange.generateSharedKey(serverPublicKey, 10);

        if(!this._keyExchange.isValidServerPublicKey()) throw new Error('Invalid server public key');

        const sharedKeyHex = this._keyExchange.getSharedKey(16).toUpperCase();
        const keyBytes = CryptoTools.hexStringToByteArray(sharedKeyHex);

        const clientToServer = this._communication.createEncryption();

        clientToServer.init(keyBytes);

        let serverToClient: IEncryption | null = null;

        if(parser.serverClientEncryption)
        {
            serverToClient = this._communication.createEncryption();
            serverToClient.init(CryptoTools.hexStringToByteArray(sharedKeyHex));
        }

        connection.setEncryption(clientToServer, serverToClient!);

        this.clearHandshakeTimer();
        this._isHandshaking = false;

        this._demo.dispatchLoginStepEvent(HabboCommunicationEvent.HANDSHAKED);

        log.info('Encryption enabled');

        // AS3: var_1660.sendConnectionParameters(connection)
        this._demo.sendConnectionParameters(connection);
    }

    // AS3: sources/win63_version/habbo/communication/demo/class_1762.as::onAuthenticationOK()
    private onAuthenticationOK(event: IMessageEvent): void
    {
        const connection = event.connection;

        if(!connection) return;

        this._demo.dispatchLoginStepEvent(HabboCommunicationEvent.AUTHENTICATED);

        connection.send(new InfoRetrieveMessageComposer());
        connection.send(new EventLogMessageComposer('Login', 'socket', 'client.auth_ok'));
        connection.send(new GetFurnitureAliasesMessageComposer());

        log.info('Authenticated');

        this._demo.loginOk();
    }

    /**
	 * @see source_as_win63/habbo/communication/demo/IncomingMessages.as onPing()
	 */
    // AS3: sources/win63_version/habbo/communication/demo/class_1762.as::onPing()
    private onPing(event: IMessageEvent): void
    {
        const connection = event.connection;

        if(!connection) return;

        connection.send(new PongMessageComposer());
    }

    /**
	 * @see source_as_win63/habbo/communication/demo/IncomingMessages.as onDisconnectReason()
	 */
    // AS3: sources/win63_version/habbo/communication/demo/class_1762.as::onDisconnectReason()
    private onDisconnectReason(event: IMessageEvent): void
    {
        if(this._isHandshaking)
        {
            this._demo.dispatchLoginStepEvent(HabboCommunicationEvent.HANDSHAKE_FAIL);
        }

        const parser = event.parser as DisconnectReasonMessageParser;

        if(!parser) return;

        log.warn(`Disconnected: reason=${parser.reason}`);

        this._demo.disconnected(parser.reason, parser.reasonText);

        this._isHandshaking = false;
        this._wasDisconnected = true;
    }

    /**
	 * @see source_as_win63/habbo/communication/demo/IncomingMessages.as onGenericError()
	 */
    // AS3: sources/win63_version/habbo/communication/demo/class_1762.as::onGenericError()
    private onGenericError(event: IMessageEvent): void
    {
        const parser = event.parser as GenericErrorMessageParser;

        if(!parser) return;

        switch(parser.errorCode)
        {
            case -3:
                log.error('Generic error: -3');
                break;
            case -400:
                log.error('Generic error: -400');
                break;
        }
    }

    /**
	 * @see source_as_win63/habbo/communication/demo/IncomingMessages.as onUniqueMachineId()
	 */
    // AS3: sources/win63_version/habbo/communication/demo/class_1762.as::onUniqueMachineId()
    private onUniqueMachineId(_event: IMessageEvent): void
    {
        // AS3: CommunicationUtils.writeSOLProperty("machineid", param1.machineID)
        // Machine ID stored by server, we persist locally
    }

    /**
	 * @see source_as_win63/habbo/communication/demo/IncomingMessages.as onLoginFailedHotelClosed()
	 */
    // AS3: sources/win63_version/habbo/communication/demo/class_1762.as::onLoginFailedHotelClosed()
    private onLoginFailedHotelClosed(event: IMessageEvent): void
    {
        const parser = (event as LoginFailedHotelClosedMessageEvent).getParser() as LoginFailedHotelClosedMessageEventParser;

        if(!parser) return;

        this._demo.handleLoginFailedHotelClosedMessage(parser.openHour, parser.openMinute);
    }

    /**
	 * @see source_as_win63/habbo/communication/demo/IncomingMessages.as onErrorReport()
	 */
    // AS3: sources/win63_version/habbo/communication/demo/class_1762.as::onErrorReport()
    private onErrorReport(event: IMessageEvent): void
    {
        const parser = (event as ErrorReportEvent).getParser() as ErrorReportEventParser;

        if(!parser) return;

        this._demo.handleErrorMessage(parser.errorCode, parser.messageId);
    }

    /**
	 * @see source_as_win63/habbo/communication/demo/IncomingMessages.as onMaintenance()
	 */
    // AS3: sources/win63_version/habbo/communication/demo/class_1762.as::onMaintenance()
    private onMaintenance(event: IMessageEvent): void
    {
        const parser = (event as MaintenanceStatusMessageEvent).getParser() as MaintenanceStatusMessageEventParser;

        if(!parser) return;

        log.warn(`Maintenance status: ${parser.minutesUntilMaintenance} minutes`);

        this._demo.disconnected(-2, `Maintenance in ${parser.minutesUntilMaintenance} minutes`);
    }

    /**
	 * @see source_as_win63/habbo/communication/demo/IncomingMessages.as onIdentityAccounts()
	 */
    // AS3: sources/win63_version/habbo/communication/demo/class_1762.as::onIdentityAccounts()
    private onIdentityAccounts(event: IMessageEvent): void
    {
        const parser = (event as IdentityAccountsEvent).getParser() as IdentityAccountsEventParser;

        if(!parser) return;

        // AS3: var_1660.onUserList(avatars) - populates login screen character list (VIEW)
        // We skip the UI callback but log the data
        log.trace(`Identity accounts received: ${parser.accounts.size} accounts`);
    }

    /**
	 * @see source_as_win63/habbo/communication/demo/IncomingMessages.as onConnectionDisconnected()
	 */
    // AS3: sources/win63_version/habbo/communication/demo/class_1762.as::onConnectionDisconnected()
    private onConnectionDisconnected(): void
    {
        this.clearHandshakeTimer();

        if(this._isHandshaking)
        {
            this._demo.dispatchLoginStepEvent(HabboCommunicationEvent.HANDSHAKE_FAIL);
        }

        if(!this._wasDisconnected)
        {
            this._demo.disconnected(-3, '');
        }
    }

    /**
	 * @see source_as_win63/habbo/communication/demo/IncomingMessages.as generateRandomHexString()
	 */
    // AS3: sources/win63_version/habbo/communication/demo/class_1762.as::generateRandomHexString()
    private generateRandomHexString(byteLength: number): string
    {
        // DEVIATION: AS3 drew the Diffie-Hellman private key from Math.random; a predictable key
        //   makes the RC4 key recoverable by anyone reading the plain-text handshake. WebCrypto.
        return CryptoTools.randomHexString(byteLength);
    }
}
