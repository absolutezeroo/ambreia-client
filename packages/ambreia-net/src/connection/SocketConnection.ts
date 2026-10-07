import {EventEmitter} from 'eventemitter3';
import {ByteArray} from '../util/ByteArray';
import {WireFormatter} from '../wireformat/WireFormatter';
import {MessageRegistry} from '../messages/MessageRegistry';
import {Logger} from '@ambreia/common/utils/Logger';
import {FRAME_CHANNEL_NET, FrameTimings} from '@ambreia/common/utils/FrameTimings';
import type {IConnection} from './IConnection';
import type {IConnectionCallback} from './IConnectionCallback';
import type {IEncryption} from '../encryption/IEncryption';
import type {IMessageComposer} from '../messages/IMessageComposer';
import type {IMessageEvent} from '../messages/IMessageEvent';
import type {IMessageConfiguration} from '../messages/IMessageConfiguration';
import type {IMessageDataWrapper} from '../messages/IMessageDataWrapper';
import type {IWireFormatter} from '../wireformat/IWireFormatter';
import type {IPacketTap} from './IPacketTap';
import {MessageDataWrapper} from '../messages/MessageDataWrapper';
import {PreEncryptionMessageComposer} from '../messages/PreEncryptionMessageComposer';
import {PacketLogger} from '../PacketLogger';

const log = Logger.getLogger('core.communication.connection.SocketConnection');

export interface IConnectionEvents
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/communication/connection/IConnection.as::get connected()
    connected: () => void;
    disconnected: () => void;
    error: (error: Error) => void;
    message: (messageId: number) => void;
    /**
	 * Emitted after a message is successfully parsed and before handlers are called
	 */
    messageEvent: (event: IMessageEvent) => void;
}

export class SocketConnection extends EventEmitter<IConnectionEvents> implements IConnection
{
    private _socket: WebSocket | null = null;
    private _receivedBuffer: ByteArray = new ByteArray();
    private _pendingMessages: ByteArray[] = [];
    private _pendingComposers: IMessageComposer<unknown[]>[] = [];
    private _pendingReceivedMessages: IMessageDataWrapper[] = [];
    // TS-only: no AS3 counterpart; dedupes the dropped-packet warnings in handleReceivedMessage().
    private readonly _unhandledMessageIds: Set<number> = new Set();
    private _tap: IPacketTap | null = null;

    private _clientToServerEncryption: IEncryption | null = null;
    private _serverToClientEncryption: IEncryption | null = null;
    private _authenticated: boolean = false;
    private _configurationReady: boolean = false;

    private _messageRegistry: MessageRegistry = new MessageRegistry();
    private _wireFormatter: IWireFormatter = new WireFormatter();
    private _timeoutId: ReturnType<typeof setTimeout> | null = null;
    private _callback: IConnectionCallback | null;
    private _host: string = '';
    private _port: number = 0;

    // TS-only: no AS3 counterpart; diagnostics for the background-tab disconnect. `onclose`
    // reports 1006 for every abnormal drop, and 1006 covers two opposite causes: the page was
    // frozen by Chrome and the socket died with no JavaScript running (the close event is only
    // DELIVERED on thaw, minutes later), or the link was cut while the page was live. The server
    // PINGs a silent session every 30s (NetworkingConfig.IdleOkActivityWindow), so the gap since
    // the last inbound byte separates them: minutes = the page was stopped, ~30s = the link was
    // still carrying traffic when something in the path cut it.
    private _lastReceivedAt: number = 0;
    // TS-only: no AS3 counterpart; see _lastReceivedAt. Set by _onVisibilityChange().
    private _hiddenSince: number = 0;

    constructor(callback?: IConnectionCallback)
    {
        super();
        this._callback = callback ?? null;

        if(typeof document !== 'undefined')
        {
            document.addEventListener('visibilitychange', this._onVisibilityChange);
        }
    }

    // TS-only: no AS3 counterpart; see _lastReceivedAt. Recording when the tab went away is the
    // only way to report how long it had been hidden — by the time a frozen page thaws and runs
    // this close handler, visibilityState already reads 'visible' again.
    private _onVisibilityChange = (): void =>
    {
        this._hiddenSince = (document.visibilityState === 'hidden') ? Date.now() : 0;
    };

    private _connected: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/communication/connection/IConnection.as::get connected()
    get connected(): boolean
    {
        return this._connected;
    }

    private _disposed: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/communication/connection/IConnection.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    private _timeout: number = 10000;

    get timeout(): number
    {
        return this._timeout;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/communication/connection/IConnection.as::set timeout()
    set timeout(value: number)
    {
        this._timeout = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/communication/connection/IConnection.as::init()
    init(host: string, port: number = 0, _tcpNoDelay: boolean = true): boolean
    {
        if(this._disposed)
        {
            return false;
        }

        this._host = host;
        this._port = port;
        this._callback?.connectionInit?.(host, port);

        let url: string;
        if(host.startsWith('ws://') || host.startsWith('wss://'))
        {
            if(host.startsWith('ws://'))
            {
                log.warn('Insecure WebSocket connection (ws://). Use wss:// in production.');
            }
            url = host;
        }
        else
        {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            url = port > 0 ? `${protocol}//${host}:${port}` : `${protocol}//${host}`;
        }

        try
        {
            this._socket = new WebSocket(url);
            this._socket.binaryType = 'arraybuffer';
            this.setupEventListeners();
            this.startTimeout();
            return true;
        }
        catch (error)
        {
            log.error(`WebSocket error: ${(error as Error).message}`);
            this._callback?.connectionError?.(error as Error);
            return false;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/communication/connection/IConnection.as::createSocket()
    createSocket(): void
    {
        this.close();
        this._receivedBuffer.clear();
        this._pendingMessages = [];
        this._clientToServerEncryption = null;
        this._serverToClientEncryption = null;
        this._socket = null;
    }

    addListener<T extends EventEmitter.EventNames<IConnectionEvents>>(
        type: T,
        listener: EventEmitter.EventListener<IConnectionEvents, T>,
        context?: unknown
    ): this;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/communication/connection/IConnection.as::addListener()
    addListener(type: string, listener: (...args: unknown[]) => void, context?: unknown): this;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/communication/connection/IConnection.as::addListener()
    addListener(type: string, listener: (...args: any[]) => void, context?: unknown): this
    {
        switch(type)
        {
            case 'connect':
                return super.addListener('connected', listener as EventEmitter.EventListener<IConnectionEvents, 'connected'>, context);
            case 'close':
                return super.addListener('disconnected', listener as EventEmitter.EventListener<IConnectionEvents, 'disconnected'>, context);
            case 'ioError':
            case 'securityError':
                return super.addListener('error', listener as EventEmitter.EventListener<IConnectionEvents, 'error'>, context);
            default:
                // The four names above are every Flash socket event AS3's IConnection.addListener() is called
                // with anywhere in the port. There is no fifth to map.
                return super.addListener(
                    type as EventEmitter.EventNames<IConnectionEvents>,
                    listener as EventEmitter.EventListener<IConnectionEvents, EventEmitter.EventNames<IConnectionEvents>>,
                    context
                );
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/communication/connection/IConnection.as::send()
    send(composer: IMessageComposer<unknown[]>): boolean
    {
        if(this._disposed)
        {
            return false;
        }

        if(!this._clientToServerEncryption || (this._authenticated && !this._configurationReady))
        {
            this._pendingComposers.push(composer);
            return false;
        }

        const messageId = this._messageRegistry.getMessageIdForComposer(composer);
        if(messageId < 0)
        {
            // Once per class: a composer outside the contract is sent from a click path, every click.
            log.once(`unknown-composer:${composer.constructor.name}`).warn(`Unknown composer: ${composer.constructor.name}`);
            return false;
        }

        PacketLogger.outgoing(messageId, composer.constructor.name);

        let values: unknown[] = composer.getMessageArray();

        if(this._tap?.outgoing)
        {
            // A copy: composers hand out their own `_data`, and a tap editing in place would change it.
            const edited = this._tap.outgoing(messageId, [...values]);

            if(edited === null) return false;

            values = edited;
        }

        const encoded = this._wireFormatter.encode(messageId, values);

        this._clientToServerEncryption.encipher(encoded);

        return this.sendRaw(encoded, messageId);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/communication/connection/IConnection.as::sendUnencrypted()
    sendUnencrypted(composer: IMessageComposer<unknown[]>): boolean
    {
        if(this._disposed)
        {
            return false;
        }

        const messageId = this._messageRegistry.getMessageIdForComposer(composer);
        if(messageId < 0)
        {
            log.warn(`Unknown composer: ${composer.constructor.name}`);
            return false;
        }

        if(!(composer instanceof PreEncryptionMessageComposer))
        {
            return false;
        }

        const encoded = this._wireFormatter.encode(messageId, composer.getMessageArray());
        return this.sendRaw(encoded, messageId);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/communication/connection/IConnection.as::setEncryption()
    setEncryption(clientToServer: IEncryption, serverToClient: IEncryption): void
    {
        this._clientToServerEncryption = clientToServer;
        this._serverToClientEncryption = serverToClient;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/communication/connection/IConnection.as::isAuthenticated()
    isAuthenticated(): void
    {
        this._authenticated = true;

        this.flushPendingComposers();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/communication/connection/IConnection.as::isConfigured()
    isConfigured(): void
    {
        this._configurationReady = true;

        this.flushPendingReceivedMessages();
        this.flushPendingComposers();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/communication/connection/IConnection.as::getServerToClientEncryption()
    getServerToClientEncryption(): IEncryption | null
    {
        return this._serverToClientEncryption;
    }

    getClientToServerEncryption(): IEncryption | null
    {
        return this._clientToServerEncryption;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/communication/connection/IConnection.as::registerMessageClasses()
    registerMessageClasses(config: IMessageConfiguration): void
    {
        this._messageRegistry.registerMessages(config);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/communication/connection/IConnection.as::addMessageEvent()
    addMessageEvent(event: IMessageEvent): void
    {
        this._messageRegistry.registerMessageEvent(event);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/communication/connection/IConnection.as::removeMessageEvent()
    removeMessageEvent(event: IMessageEvent): void
    {
        this._messageRegistry.unregisterMessageEvent(event);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/communication/connection/IConnection.as::processReceivedData()
    processReceivedData(): void
    {
        if(this._receivedBuffer.length === 0)
        {
            return;
        }

        this._receivedBuffer.position = 0;

        // The `net` channel of the `:showstats` frame budget, opened past the empty-buffer return
        // above so idle calls bill nothing. It covers the whole incoming cost — splitMessages()
        // (decipher + framing) and every parser and handler reached through
        // handleReceivedMessage() — because that is what scales with the number of moving units in
        // the room, and it was the one stage of a frame with no instrument at all.
        //
        // This method runs both from the ticker update loop and straight off the socket's
        // onmessage (see the note further down), so a burst arriving mid-frame is billed to the
        // frame it lands in, which is where it actually costs.
        FrameTimings.begin(FRAME_CHANNEL_NET);

        try
        {
            const messages = this._wireFormatter.splitMessages(this._receivedBuffer, this);

            for(const wrapper of messages)
            {
                const messageId = wrapper.getMessageId();

                this.emit('message', messageId);
                this._callback?.messageReceived?.(String(0));

                if(this._authenticated && !this._configurationReady)
                {
                    this._pendingReceivedMessages.push(wrapper);
                    continue;
                }

                this.handleReceivedMessage(wrapper);
            }
        }
        catch (error)
        {
            log.error(`Process error: ${(error as Error).message}`);

            // AS3 (class_1752.as::processReceivedData()) re-throws this error after notifying
            // messageParseError() - an invalid message length means the byte stream is desynced
            // beyond recovery (WireFormatter.splitMessages() already consumed part of the encryption
            // keystream via decipher() before throwing, and never compacts/clears the buffer on this
            // path). Swallowing it here without disconnecting means every subsequent frame re-parses
            // the same corrupted buffer from position 0 with an already-advanced keystream, producing
            // a new garbage length value forever - an infinite console-spamming loop, not a recoverable
            // condition. Treat it as fatal: clear the buffer and close the connection.
            this._receivedBuffer.clear();
            this._callback?.connectionError?.(error as Error);
            this.emit('error', error as Error);
            this.close();
        }
        finally
        {
            FrameTimings.end(FRAME_CHANNEL_NET);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/communication/connection/IConnection.as::close()
    close(): void
    {
        this.clearTimeout();

        if(this._socket)
        {
            if(this._socket.readyState === WebSocket.OPEN)
            {
                this._socket.close();
            }
            this._socket = null;
        }

        this._connected = false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/communication/connection/IConnection.as::dispose()
    dispose(): void
    {
        if(this._disposed)
        {
            return;
        }

        if(typeof document !== 'undefined')
        {
            document.removeEventListener('visibilitychange', this._onVisibilityChange);
        }

        this.close();
        this._receivedBuffer.clear();
        this._pendingMessages = [];
        this._pendingComposers = [];
        this._pendingReceivedMessages = [];
        this._messageRegistry.clear();
        this._wireFormatter.dispose();
        this._clientToServerEncryption = null;
        this._serverToClientEncryption = null;
        this._authenticated = false;
        this._configurationReady = false;
        this._callback = null;
        this.removeAllListeners();

        this._disposed = true;
    }

    private setupEventListeners(): void
    {
        if(!this._socket)
        {
            return;
        }

        this._socket.onopen = () =>
        {
            this.clearTimeout();
            this._connected = true;
            this._callback?.connectionOpened?.();
            this.emit('connected');
            this.flushPendingMessages();
        };

        this._socket.onclose = (event) =>
        {
            // The close code is the only evidence of *why* the link went away, and it is gone the
            // moment this handler returns. 1000/1001 = someone closed it deliberately (server
            // shutdown, navigation); 1006 = no close frame at all, i.e. the TCP connection died —
            // which is what a backgrounded tab, a sleeping machine or a dropped route looks like.
            // Without this the disconnect was indistinguishable from every other disconnect.
            const sinceLastRx = this._lastReceivedAt ? Date.now() - this._lastReceivedAt : -1;
            const hiddenFor = this._hiddenSince ? Date.now() - this._hiddenSince : 0;

            log.warn(
                `Connection closed: code=${event.code} reason="${event.reason}" clean=${event.wasClean}`
                + ` sinceLastRx=${sinceLastRx}ms hiddenFor=${hiddenFor}ms visibility=${typeof document !== 'undefined' ? document.visibilityState : 'n/a'}`
                + (event.code === 1006 ? ' — no close frame; the transport dropped rather than the peer closing' : '')
            );

            this.clearTimeout();
            this._connected = false;
            this._callback?.connectionClosed?.(event.code, event.wasClean);
            this.emit('disconnected');
        };

        this._socket.onerror = () =>
        {
            const error = new Error('WebSocket error');
            this._callback?.connectionError?.(error);
            this.emit('error', error);
        };

        this._socket.onmessage = (event) =>
        {
            if(!event.data)
            {
                return;
            }

            if(event.data instanceof Blob)
            {
                const reader = new FileReader();
                reader.readAsArrayBuffer(event.data);
                reader.onloadend = () =>
                {
                    this.onDataReceived(reader.result as ArrayBuffer);
                };
            }
            else if(event.data instanceof ArrayBuffer)
            {
                this.onDataReceived(event.data);
            }
        };
    }

    private onDataReceived(data: ArrayBuffer): void
    {
        this._lastReceivedAt = Date.now();

        const bytes = ByteArray.fromArrayBuffer(data);
        const oldPosition = this._receivedBuffer.position;
        this._receivedBuffer.position = this._receivedBuffer.length;
        this._receivedBuffer.writeBytes(bytes);
        this._receivedBuffer.position = oldPosition;

        // Process on arrival, driven by the WebSocket 'message' event, NOT only by the
        // ticker-driven update loop (CoreCommunicationManager.update -> processReceivedData).
        //
        // AS3 parity note: the Flash client also drained the socket from an update loop
        // (class_44.update -> processReceivedData), and this port faithfully mirrors that. But the
        // browser fully PAUSES requestAnimationFrame (which drives the Pixi ticker, hence that
        // update loop) whenever the tab is backgrounded, whereas Flash Player kept a hidden SWF
        // running (throttled, ~4fps) so its loop never stalled. The result was: switch tabs for
        // ~30s and the ticker froze -> processReceivedData stopped -> incoming packets piled up in
        // _receivedBuffer unprocessed while the room appeared frozen, needing a reconnect. The
        // 'message' event keeps firing on a backgrounded tab, so processing here restores the
        // Flash behaviour (network keeps up regardless of render throttling). splitMessages()
        // already buffers partial frames, so a fragmented arrival is safe. The ticker still calls
        // processReceivedData() too; it simply finds an empty buffer most of the time now.
        this.processReceivedData();
    }

    private startTimeout(): void
    {
        this.clearTimeout();
        this._timeoutId = setTimeout(() =>
        {
            if(!this._connected && this._socket)
            {
                this._socket.close();
                const error = new Error('Connection timeout');
                this._callback?.connectionError?.(error);
                this.emit('error', error);
            }
        }, this._timeout);
    }

    private clearTimeout(): void
    {
        if(this._timeoutId)
        {
            clearTimeout(this._timeoutId);
            this._timeoutId = null;
        }
    }

    private sendRaw(data: ByteArray, messageId?: number): boolean
    {
        if(!this._socket)
        {
            return false;
        }

        // Queue only while the socket has NEVER been open — the port connects asynchronously where
        // Flash called send() after connect, so a message composed during the handshake window has
        // to wait for onopen. CONNECTING is exactly that window and nothing else.
        if(this._socket.readyState === WebSocket.CONNECTING)
        {
            this._pendingMessages.push(data.clone());
            return true;
        }

        // AS3: SocketConnection.as::send() l.222-229 — `if(_socket.connected) { write } else
        // return false`. There is no queue on this path in AS3, and adding one was actively
        // harmful: `onclose` leaves `_socket` non-null and only clears `_connected`, so a
        // connection lost while the tab was hidden sent every later action into `_pendingMessages`
        // and reported success. Nothing ever flushes that queue (only `onopen` does, and there is
        // no reconnect), so the client looked alive while silently swallowing every click — the
        // "came back to the tab and can do nothing, have to reconnect" symptom.
        if(this._socket.readyState !== WebSocket.OPEN)
        {
            log.once('send-after-close').warn(
                'Send attempted on a closed connection — the socket went away and nothing reconnects. '
                + 'Every action from here on is dropped until the page is reloaded.'
            );

            return false;
        }

        try
        {
            this._socket.send(data.toArrayBuffer());
            if(messageId !== undefined)
            {
                this._callback?.messageSent?.(String(messageId));
            }
            return true;
        }
        catch (error)
        {
            log.error(`Send error: ${(error as Error).message}`);
            return false;
        }
    }

    private flushPendingMessages(): void
    {
        while(this._pendingMessages.length > 0)
        {
            const message = this._pendingMessages.shift()!;
            this.sendRaw(message);
        }
    }

    private flushPendingComposers(): void
    {
        if(!this._clientToServerEncryption || !this._configurationReady)
        {
            return;
        }

        const composers = this._pendingComposers;
        this._pendingComposers = [];

        for(const composer of composers)
        {
            this.send(composer);
        }
    }

    private flushPendingReceivedMessages(): void
    {
        const messages = this._pendingReceivedMessages;
        this._pendingReceivedMessages = [];

        for(const message of messages)
        {
            this.handleReceivedMessage(message);
        }
    }

    // TS-only: see IConnection.setPacketTap().
    setPacketTap(tap: IPacketTap | null): void
    {
        this._tap = tap;
    }

    // TS-only: see IConnection.injectIncoming(). Encoded by the formatter the server's bytes go
    // through, but never deciphered: an injected message must not advance the real stream's keystream.
    injectIncoming(messageId: number, values: unknown[]): void
    {
        if(this._disposed) return;

        const frame = this._wireFormatter.encode(messageId, values);
        const body = new ByteArray(frame.length - 4);

        frame.position = 4;
        frame.readBytes(body, 0, frame.length - 4);
        body.position = 2;

        this.handleReceivedMessage(new MessageDataWrapper(messageId, body));
    }

    private handleReceivedMessage(received: IMessageDataWrapper): void
    {
        let wrapper = received;

        if(this._tap?.incoming)
        {
            const edited = this._tap.incoming(wrapper);

            if(edited === null) return;

            wrapper = edited;
        }

        const messageId = wrapper.getMessageId();
        const events = this._messageRegistry.getMessageEventsForId(messageId);

        PacketLogger.incoming(messageId, this._messageRegistry.getIncomingMessageName(messageId), events?.length ?? 0);

        if(!events || events.length === 0)
        {
            // `warn`, not `debug`. `CLAUDE.md` → Conventions reserves `warn` for exactly
            // this shape — a code path the client does not handle, which renders nothing and
            // throws nothing, so `debug` buries it — and "ported but never wired" is this port's
            // single most common defect: the parser and the handler both exist, nobody registered
            // them, and the only symptom is a feature that quietly never happens.
            //
            // Once per id: a message the server repeats every tick would otherwise drown the
            // console and make the warning worthless.
            if(!this._unhandledMessageIds.has(messageId))
            {
                this._unhandledMessageIds.add(messageId);
                log.warn(`No registered handler for incoming message id ${messageId} (${this._messageRegistry.getIncomingMessageName(messageId)}) — dropped. Further occurrences of this id are silent.`);
            }

            return;
        }

        const parser = events[0].parser;

        if(!parser)
        {
            // Registered but parserless drops the packet whole, and nothing downstream can tell
            // that apart from a message the server never sent.
            if(!this._unhandledMessageIds.has(messageId))
            {
                this._unhandledMessageIds.add(messageId);
                log.warn(`Message id ${messageId} (${this._messageRegistry.getIncomingMessageName(messageId)}) is registered but its event carries no parser — dropped. Further occurrences of this id are silent.`);
            }

            return;
        }

        try
        {
            parser.flush();

            if(parser.parse(wrapper))
            {
                for(const event of events)
                {
                    event.connection = this;
                    this.emit('messageEvent', event);

                    try
                    {
                        event.callback(event);
                    }
                    catch (error)
                    {
                        log.error(`Handler error for ${messageId}: ${(error as Error).message}`, error);
                    }
                }
            }
        }
        catch (error)
        {
            log.error(`Parse error for ${messageId}: ${(error as Error).message}`, error);
            this._callback?.messageParseError?.(wrapper);
        }
    }
}
