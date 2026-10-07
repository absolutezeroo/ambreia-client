import {EventEmitter} from 'eventemitter3';
import {Component, ComponentDependency, type IContext} from '@core/runtime';
import {IID_RoomEngine} from '@iid/IIDRoomEngine';
import {IID_HabboConfigurationManager} from '@iid/IIDHabboConfigurationManager';
import {IID_AvatarRenderManager} from '@iid/IIDAvatarRenderManager';
import type {IHabboCommunicationManager} from '../communication/IHabboCommunicationManager';
import type {IAvatarRenderManager} from '../avatar/IAvatarRenderManager';
import type {IRoomSessionManager} from './IRoomSessionManager';
import type {IRoomHandlerListener} from './IRoomHandlerListener';
import type {IRoomSession} from './IRoomSession';
import {RoomSessionState} from './IRoomSession';
import {RoomSession} from './RoomSession';
import {RoomSessionEvent} from './events/RoomSessionEvent';
import {
    RoomNetworkOpenConnectionMessageComposer
} from '../communication/messages/outgoing/room/session/RoomNetworkOpenConnectionMessageComposer';
import type {BaseHandler} from './handler/BaseHandler';
import {RoomSessionHandler, RoomSessionHandlerState} from './handler/RoomSessionHandler';
import {RoomPermissionsHandler} from './handler/RoomPermissionsHandler';
import {RoomDataHandler} from './handler/RoomDataHandler';
import {RoomChatHandler} from './handler/RoomChatHandler';
import {RoomUsersHandler} from './handler/RoomUsersHandler';
import {GenericErrorHandler} from './handler/GenericErrorHandler';
import {RoomDimmerPresetsHandler} from './handler/RoomDimmerPresetsHandler';
import {PresentHandler} from './handler/PresentHandler';
import {PetPackageHandler} from './handler/PetPackageHandler';
import {AvatarEffectsHandler} from './handler/AvatarEffectsHandler';
import {RoomEngineEvent} from '../room/events/RoomEngineEvent';
import {Logger} from '@ambreia/common/utils/Logger';
import type {IRoomEngine} from '@habbo/room';
import {IID_HabboCommunicationManager} from "@iid/IIDHabboCommunicationManager";

const log = Logger.getLogger('habbo.session.RoomSessionManager');

/**
 * Room session manager implementation
 *
 * Based on AS3: com.sulake.habbo.session.RoomSessionManager
 *
 * Implements both IRoomSessionManager and IRoomHandlerListener.
 * Creates handlers that listen to messages and call back via IRoomHandlerListener.
 *
 * Room entry flow:
 * 1. gotoRoom() creates RoomSession
 * 2. createSession() stores session, emits RSE_CREATED
 * 3. startSession() calls session.start() which sends OpenFlatConnectionMessageComposer
 * 4. Server responds with OpenConnectionMessageEvent -> onRoomConnected
 * 5. Server responds with RoomReadyMessageEvent -> onRoomReady -> sessionUpdate(RS_READY)
 */
export class RoomSessionManager extends Component implements IRoomSessionManager, IRoomHandlerListener
{
    // sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/RoomSessionManager.as
    // ::onRoomVisualizationSettings() — deliberately not subscribed, and this note is here so the
    // next unwired-code sweep stops re-flagging it as a missing registration.
    //
    // AS3 subscribes `_SafeCls_2101` (id 2986) and the handler's first statement is
    // `if(_SafeStr_9634 || !_roomViewerMode) return;` — it does nothing at all unless the client is
    // running as the standalone **room viewer** embed, a mode this port does not implement (no
    // `_roomViewerMode` exists anywhere in it). What the body then does is build that embed's own
    // 1024x768 canvas, mask it, offset it by (0,-400) and attach the chat display — a second,
    // parallel room presentation, not anything the normal client uses.
    //
    // The message itself is ported and registered; `RoomMessageHandler` subscribes it for the
    // room engine, which is the path the normal client actually takes. Porting the viewer mode is
    // its own task.

    // DEVIATION: dead in AS3 itself — grepping the whole primary tree finds only the declaration
    //   (value 3); no call site ever passes it to the constructor's `flags` parameter, which this
    //   port does not carry either (see the constructor below). The bit pattern it names (1|2) IS
    //   read, but only as the literal `flags & 3` in AS3's `get dependencies()`, never through this
    //   symbol.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/RoomSessionManager.as::SETUP_WITHOUT_TRACKING

    // AS3: .../src/com/sulake/habbo/session/RoomSessionManager.as::_communication
    private _communication: IHabboCommunicationManager | null = null;
    // AS3: .../src/com/sulake/habbo/session/RoomSessionManager.as::_roomEngine
    private _roomEngine: IRoomEngine | null = null;
    // AS3: .../src/com/sulake/habbo/session/RoomSessionManager.as::_avatarRenderer
    private _avatarRenderer: IAvatarRenderManager | null = null;
    // AS3: .../src/com/sulake/habbo/session/RoomSessionManager.as::_handlers
    private _handlers: BaseHandler[] = [];
    private _sessions: Map<string, RoomSession> = new Map();
    private _pendingSession: RoomSession | null = null;

    constructor(context: IContext)
    {
        super(context);
    }

    private _sessionEvents: EventEmitter = new EventEmitter();

    get sessionEvents(): EventEmitter
    {
        return this._sessionEvents;
    }

    private _sessionStarting: boolean = false;

    // AS3: .../src/com/sulake/habbo/session/RoomSessionManager.as::get sessionStarting()
    get sessionStarting(): boolean
    {
        return this._sessionStarting;
    }

    /**
	 * Whether the room engine has reported REE_ENGINE_INITIALIZED. Not "this component is
	 * initialized" — AS3 sets its counterpart only from onRoomEngineInitialized(), never from
	 * initComponent().
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/RoomSessionManager.as:54
    private _roomEngineInitialized: boolean = false;

    /**
	 * Whether the manager is fully initialized
	 * In AS3 this also checks room engine initialization
	 */
    // AS3: .../src/com/sulake/habbo/session/RoomSessionManager.as::get initialized()
    get initialized(): boolean
    {
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/RoomSessionManager.as::get initialized()
        return this._roomEngineInitialized && this.allRequiredDependenciesInjected;
    }

    protected override get dependencies(): Array<ComponentDependency<any>>
    {
        return [
            new ComponentDependency(
                IID_HabboCommunicationManager,
                (manager: IHabboCommunicationManager | null) =>
                {
                    this._communication = manager;
                },
                true
            ),
            // AS3 declares this with a null setter — it only waits for the manager to exist.
            new ComponentDependency(IID_HabboConfigurationManager, null, true),
            // AS3 gates this on `(flags & 4) == 0`, true for the default flags = 0. The cycle with
            // RoomEngine is broken on the other side: RoomEngine declares IIDHabboRoomSessionManager
            // optional (_SafeCls_90.as:409), exactly as RoomEngine.ts:353 already does.
            new ComponentDependency(
                IID_RoomEngine,
                (engine: IRoomEngine | null) =>
                {
                    this._roomEngine = engine;
                },
                true,
                [
                    {
                        type: RoomEngineEvent.REE_ENGINE_INITIALIZED,
                        callback: this.onRoomEngineInitialized.bind(this),
                    },
                ]
            ),
            // AS3 passes no required flag here, so it takes ComponentDependency's default: true.
            new ComponentDependency(
                IID_AvatarRenderManager,
                (renderer: IAvatarRenderManager | null) =>
                {
                    this._avatarRenderer = renderer;
                },
                true
            ),
        ];
    }

    /**
	 * Go to a room - creates and starts a new room session
	 */
    // AS3: .../src/com/sulake/habbo/session/RoomSessionManager.as::gotoRoom()
    gotoRoom(roomId: number, password: string = '', roomResources: string = '', skipOpc: boolean = false): boolean
    {
        const session = new RoomSession();

        session.roomId = roomId;
        session.roomPassword = password;
        session.roomResources = roomResources;
        session.skipOpc = skipOpc;

        return this.createSession(session);
    }

    /**
	 * Go to a room via network (for room forwarding)
	 *
	 * @see sources/win63_version/habbo/session/RoomSessionManager.as gotoRoomNetwork()
	 */
    // AS3: .../src/com/sulake/habbo/session/RoomSessionManager.as::gotoRoomNetwork()
    gotoRoomNetwork(roomId: number, homeRoomId: number): boolean
    {
        const session = new RoomSession();

        session.roomId = 1;
        session.roomPassword = '';
        session.openConnectionComposer = new RoomNetworkOpenConnectionMessageComposer(roomId, homeRoomId);

        return this.createSession(session);
    }

    /**
	 * Start an existing session
	 */
    // AS3: .../src/com/sulake/habbo/session/RoomSessionManager.as::startSession()
    startSession(session: IRoomSession): boolean
    {
        if(session.state === RoomSessionState.STARTED)
        {
            return false;
        }

        if((session as RoomSession).isGameSession)
        {
            return true;
        }

        if(session.start())
        {
            this._sessionStarting = false;
            this._sessionEvents.emit(RoomSessionEvent.RSE_STARTED, new RoomSessionEvent(RoomSessionEvent.RSE_STARTED, session));
            this.updateHandlers(session);

            log.info(`Room session started: ${session.roomId}`);

            return true;
        }

        this.disposeSession(session.roomId);

        this._sessionStarting = false;

        return false;
    }

    /**
	 * Get an active session by room ID
	 */
    // AS3: .../src/com/sulake/habbo/session/RoomSessionManager.as::getSession()
    getSession(roomId: number): IRoomSession | null
    {
        const key = this.getRoomIdentifier(roomId);

        return this._sessions.get(key) ?? null;
    }

    /**
	 * Dispose a session
	 *
	 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/RoomSessionManager.as::disposeSession()
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/RoomSessionManager.as::disposeSession()
    disposeSession(roomId: number, disposeEngine: boolean = true): void
    {
        const key = this.getRoomIdentifier(roomId);
        const session = this._sessions.get(key);

        if(session)
        {
            this._sessions.delete(key);
            // disposeEngine goes INTO the event (RoomUI.ts checks event.openLandingPage to
            // decide whether to reopen the hotel-view toolbar/landing page) - it does not
            // gate whether the engine gets purged below, which AS3 always does.
            this._sessionEvents.emit(RoomSessionEvent.RSE_ENDED, new RoomSessionEvent(RoomSessionEvent.RSE_ENDED, session, disposeEngine));

            session.dispose();

            // AS3 purges the room-content loader unconditionally, regardless of disposeEngine.
            this._roomEngine?.purgeRoomContent();

            // AS3 also calls System.pauseForGCIfCollectionImminent(0.26) here - a Flash-only
            // GC hint with no browser/JS equivalent, so there is nothing to port it to.

            log.info(`Room session disposed: ${roomId}`);
        }
    }

    /**
	 * Start a game session
	 */
    // AS3: .../src/com/sulake/habbo/session/RoomSessionManager.as::startGameSession()
    startGameSession(): void
    {
        const session = new RoomSession();

        session.roomId = 1;
        session.isGameSession = true;

        if(this._communication?.connection)
        {
            session.connection = this._communication.connection;
        }

        const key = this.getRoomIdentifier(session.roomId);

        this._sessions.set(key, session);

        this._sessionEvents.emit(RoomSessionEvent.RSE_CREATED, new RoomSessionEvent(RoomSessionEvent.RSE_CREATED, session));

        log.info('Game session started');
    }

    /**
	 * Dispose the game session
	 */
    // AS3: .../src/com/sulake/habbo/session/RoomSessionManager.as::disposeGameSession()
    disposeGameSession(): void
    {
        const key = this.getRoomIdentifier(1);
        const session = this._sessions.get(key);

        if(session && session.isGameSession)
        {
            this.disposeSession(1, false);
        }
    }

    /**
	 * Called by handlers when session state changes
	 */
    // AS3: .../src/com/sulake/habbo/session/RoomSessionManager.as::sessionUpdate()
    sessionUpdate(roomId: number, type: string): void
    {
        const session = this.getSession(roomId);

        if(session !== null)
        {
            switch(type)
            {
                case RoomSessionHandlerState.RS_CONNECTED:
                case RoomSessionHandlerState.RS_READY:
                    // Session connected/ready - no action needed
                    break;
                case RoomSessionHandlerState.RS_DISCONNECTED:
                    this.disposeSession(roomId);
                    break;
            }
        }

        log.debug(`Session update: room=${roomId}, type=${type}`);
    }

    /**
	 * Called by handlers when session needs reinitialization
	 *
	 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/RoomSessionManager.as::sessionReinitialize()
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/RoomSessionManager.as::sessionReinitialize()
    sessionReinitialize(oldRoomId: number, newRoomId: number): void
    {
        const oldKey = this.getRoomIdentifier(oldRoomId);
        let session = this._sessions.get(oldKey) ?? null;

        if(session)
        {
            this._sessions.delete(oldKey);
        }
        else
        {
            // AS3 does not bail out here - it builds a session (skipOpc=true, as for a
            // reconnect/forward with no prior session) and continues unconditionally below,
            // even though createSession() may only queue it as pending if the manager isn't
            // `initialized` yet.
            session = new RoomSession();
            session.roomId = oldRoomId;
            session.skipOpc = true;

            this.createSession(session);
        }

        session.reset(newRoomId);

        const newKey = this.getRoomIdentifier(newRoomId);

        // AS3 removes whatever is at the new key but never disposes it here (an empty
        // if-block in the source) - with getRoomIdentifier() returning one shared constant
        // key, this is a no-op in practice, not a leak to fix.
        this._sessions.delete(newKey);
        this._sessions.set(newKey, session);

        this.updateHandlers(session);

        log.debug(`Session reinitialize: ${oldRoomId} -> ${newRoomId}`);
    }

    override dispose(): void
    {
        if(this.disposed) return;

        // Dispose all sessions
        for(const [key, session] of this._sessions)
        {
            session.dispose();

            this._sessions.delete(key);
        }

        // Dispose all handlers
        for(const handler of this._handlers)
        {
            handler.dispose();
        }

        this._handlers = [];

        this._sessionEvents.removeAllListeners();

        super.dispose();

        log.debug('RoomSessionManager disposed');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/RoomSessionManager.as::initComponent()
    // AS3 does not touch the room-engine flag here; it only wires the handlers and drains any
    // pending request.
    protected override initComponent(): void
    {
        this.createHandlers();

        this.executePendingSessionRequest();

        log.debug('RoomSessionManager initialized');
    }

    /**
	 * Called when room engine is initialized
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/RoomSessionManager.as::onRoomEngineInitialized()
    private onRoomEngineInitialized(..._args: unknown[]): void
    {
        log.debug('Room engine initialized');

        this._roomEngineInitialized = true;

        // Execute any pending session requests now that engine is ready
        this.executePendingSessionRequest();
    }

    // DEVIATION: AS3 also creates the poll and word-quiz session handlers; the RPG fork removed
    //   polls and the word quiz.
    // AS3: .../src/com/sulake/habbo/session/RoomSessionManager.as::createHandlers()
    private createHandlers(): void
    {
        if(!this._communication)
        {
            return;
        }

        const connection = this._communication.connection;

        // Create handlers in AS3 order
        // @see sources/win63_version/habbo/session/RoomSessionManager.as line 159-175
        this._handlers.push(new RoomSessionHandler(connection, this));
        this._handlers.push(new RoomChatHandler(connection, this));
        this._handlers.push(new RoomUsersHandler(connection, this));
        this._handlers.push(new RoomPermissionsHandler(connection, this));
        this._handlers.push(new AvatarEffectsHandler(connection, this));
        this._handlers.push(new RoomDataHandler(connection, this));
        this._handlers.push(new PresentHandler(connection, this));
        this._handlers.push(new GenericErrorHandler(connection, this));
        this._handlers.push(new RoomDimmerPresetsHandler(connection, this));
        this._handlers.push(new PetPackageHandler(connection, this));

        log.debug(`Created ${this._handlers.length} handlers`);
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSessionManager.as::createSession()
    private createSession(session: RoomSession): boolean
    {
        if(!this.initialized)
        {
            log.debug(`Not initialized, creating pending session for room: ${session.roomId}`);

            this._pendingSession = session;

            return false;
        }

        const key = this.getRoomIdentifier(session.roomId);

        this._sessionStarting = true;

        // Dispose existing session for this room
        if(this._sessions.has(key))
        {
            this.disposeSession(session.roomId, false);
        }

        // Set connection
        if(this._communication?.connection)
        {
            session.connection = this._communication.connection;
        }

        this._sessions.set(key, session);

        this._sessionEvents.emit(RoomSessionEvent.RSE_CREATED, new RoomSessionEvent(RoomSessionEvent.RSE_CREATED, session));

        log.debug(`Room session created: ${session.roomId}`);

        // Start the session
        this.startSession(session);

        return true;
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSessionManager.as::executePendingSessionRequest()
    private executePendingSessionRequest(): void
    {
        if(this.initialized && this._pendingSession !== null)
        {
            this.createSession(this._pendingSession);

            this._pendingSession = null;
        }
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSessionManager.as::updateHandlers()
    private updateHandlers(session: IRoomSession): void
    {
        if(session !== null && this._handlers !== null)
        {
            for(const handler of this._handlers)
            {
                if(handler !== null)
                {
                    handler.roomId = session.roomId;
                }
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/RoomSessionManager.as::getRoomIdentifier()
    // AS3 returns the constant "hard_coded_room_id" — every session shares one key,
    // so at most one room session exists at a time. That is what makes createSession()
    // dispose the previous room: it finds the old session under the shared key and
    // ends it (RSE_ENDED → RoomUI disposes its desktop/view) before storing the new one.
    // The old `room_${roomId}` scheme gave each room a distinct key, so entering room B
    // never found room A's session, room A was never disposed, and its RoomView/chat
    // bubbles stayed rendered on top of the new room (the "ghost room" on screen).
    private getRoomIdentifier(_roomId: number): string
    {
        return 'hard_coded_room_id';
    }
}
