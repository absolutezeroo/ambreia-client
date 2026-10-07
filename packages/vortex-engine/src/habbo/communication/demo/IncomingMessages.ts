import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import type {IEncryption} from '@core/communication/encryption/IEncryption';
import type {IKeyExchange} from '@core/communication/handshake/IKeyExchange';
import {CryptoTools} from '@core/communication/encryption/CryptoTools';
import {RSA} from '@core/communication/encryption/RSA';
import type {SocketConnection} from '@core/communication/connection/SocketConnection';
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
} from '../messages/incoming/handshake';

// Parsers
import type {
    CompleteDiffieHandshakeMessageParser,
    DisconnectReasonMessageParser,
    GenericErrorMessageParser,
    IdentityAccountsEventParser,
    InitDiffieHandshakeMessageParser,
} from '../messages/parser/handshake';

import {LoginFailedHotelClosedMessageEvent, MaintenanceStatusMessageEvent,} from '../messages/incoming/availability';

import type {
    LoginFailedHotelClosedMessageEventParser,
    MaintenanceStatusMessageEventParser,
} from '../messages/parser/availability';

import {ErrorReportEvent} from '../messages/incoming/error';
import type {ErrorReportEventParser} from '../messages/parser/error';

// Composers
import {
    ClientHelloMessageComposer,
    CompleteDiffieHandshakeMessageComposer,
    InfoRetrieveMessageComposer,
    InitDiffieHandshakeMessageComposer,
    PongMessageComposer,
} from '../messages/outgoing/handshake';

import {EventLogMessageComposer} from '../messages/outgoing/tracking';
import {GetFurnitureAliasesMessageComposer} from '../messages/outgoing/room/engine';

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
    // AS3: sources/win63_version/habbo/communication/demo/class_1762.as::_rsa
    private _rsa: RSA;

    private _boundOnConnected: () => void;
    private _boundOnDisconnected: () => void;

    constructor(demo: HabboCommunicationDemo, communication: IHabboCommunicationManager)
    {
        this._demo = demo;
        this._communication = communication;
        this._rsa = new RSA();

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

        const serverPublicKey = this._rsa.decryptString(parser.encryptedPublicKey);

        this._keyExchange.generateSharedKey(serverPublicKey, 10);

        if(!this._keyExchange.isValidServerPublicKey())
        {
            log.error('Invalid server public key');
            return;
        }

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
        this._communication.suggestedLoginActions = (event as AuthenticationOKMessageEvent).suggestedLoginActions;

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
        let result = '';

        for(let i = 0; i < byteLength; i++)
        {
            const byte = Math.floor(Math.random() * 255);

            result += byte.toString(16).padStart(2, '0');
        }

        return result;
    }
}
