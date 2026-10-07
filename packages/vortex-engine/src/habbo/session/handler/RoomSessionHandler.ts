import type {IConnection} from '@ambreia/net/connection/IConnection';
import type {IMessageEvent} from '@ambreia/net/messages/IMessageEvent';
import type {IRoomHandlerListener} from '../IRoomHandlerListener';
import {BaseHandler} from './BaseHandler';
import {RoomSessionDoorbellEvent} from '../events/RoomSessionDoorbellEvent';
import {RoomSessionQueueEvent} from '../events/RoomSessionQueueEvent';
import {ErrorReportStorage} from '@ambreia/common/utils/ErrorReportStorage';

// Message events
import {
    OpenConnectionMessageEvent
} from '@ambreia/protocol/incoming/room/session/OpenConnectionMessageEvent';
import {
    FlatAccessibleMessageEvent
} from '@ambreia/protocol/incoming/room/session/FlatAccessibleMessageEvent';
import {RoomReadyMessageEvent} from '@ambreia/protocol/incoming/room/session/RoomReadyMessageEvent';
import {
    CloseConnectionMessageEvent
} from '@ambreia/protocol/incoming/room/session/CloseConnectionMessageEvent';
import {
    RoomQueueStatusMessageEvent
} from '@ambreia/protocol/incoming/room/session/RoomQueueStatusMessageEvent';
import {
    YouAreSpectatorMessageEvent
} from '@ambreia/protocol/incoming/room/session/YouAreSpectatorMessageEvent';
import {
    FlatAccessDeniedMessageEvent
} from '@ambreia/protocol/incoming/navigator/FlatAccessDeniedMessageEvent';
import {RoomForwardMessageEvent} from '@ambreia/protocol/incoming/room/session/RoomForwardMessageEvent';
import {CantConnectMessageEvent} from '@ambreia/protocol/incoming/room/session/CantConnectMessageEvent';
import {QuitMessageComposer} from '@ambreia/protocol/outgoing/room/session/QuitMessageComposer';

// Parsers
import type {
    OpenConnectionMessageParser
} from '@ambreia/protocol/parser/room/session/OpenConnectionMessageParser';
import type {
    FlatAccessibleMessageParser
} from '@ambreia/protocol/parser/room/session/FlatAccessibleMessageParser';
import type {RoomReadyMessageParser} from '@ambreia/protocol/parser/room/session/RoomReadyMessageParser';
import type {
    FlatAccessDeniedMessageParser
} from '@ambreia/protocol/parser/navigator/FlatAccessDeniedMessageParser';
import type {
    RoomQueueStatusMessageParser
} from '@ambreia/protocol/parser/room/session/RoomQueueStatusMessageParser';
import type {
    YouAreSpectatorMessageParser
} from '@ambreia/protocol/parser/room/session/YouAreSpectatorMessageParser';
import type {RoomForwardMessageParser} from '@ambreia/protocol/parser/room/session/RoomForwardMessageParser';
import type {CantConnectMessageParser} from '@ambreia/protocol/parser/room/session/CantConnectMessageParser';

import {Logger} from '@ambreia/common/utils/Logger';

const log = Logger.getLogger('habbo.session.handler.RoomSessionHandler');

/**
 * Room session state constants
 */
export const RoomSessionHandlerState = {
    RS_CONNECTED: 'RS_CONNECTED',
    RS_READY: 'RS_READY',
    RS_DISCONNECTED: 'RS_DISCONNECTED',
} as const;

/**
 * Room session handler
 *
 * Based on AS3: com.sulake.habbo.session.handler.RoomSessionHandler
 *
 * Handles room connection state messages and notifies the RoomSessionManager
 * via IRoomHandlerListener callbacks.
 */
export class RoomSessionHandler extends BaseHandler
{
    private _messageEvents: IMessageEvent[] = [];

    constructor(connection: IConnection | null, listener: IRoomHandlerListener)
    {
        super(connection, listener);

        if(connection === null)
        {
            return;
        }

        // Register message event handlers
        this.addMessageEvent(connection, new OpenConnectionMessageEvent(this.onRoomConnected.bind(this)));
        this.addMessageEvent(connection, new FlatAccessibleMessageEvent(this.onFlatAccessible.bind(this)));
        this.addMessageEvent(connection, new RoomReadyMessageEvent(this.onRoomReady.bind(this)));
        this.addMessageEvent(connection, new CloseConnectionMessageEvent(this.onRoomDisconnected.bind(this)));
        this.addMessageEvent(connection, new FlatAccessDeniedMessageEvent(this.onFlatAccessDenied.bind(this)));
        this.addMessageEvent(connection, new RoomQueueStatusMessageEvent(this.onRoomQueueStatus.bind(this)));
        this.addMessageEvent(connection, new YouAreSpectatorMessageEvent(this.onYouAreSpectator.bind(this)));
        this.addMessageEvent(connection, new RoomForwardMessageEvent(this.onRoomForward.bind(this)));
        this.addMessageEvent(connection, new CantConnectMessageEvent(this.onCantConnect.bind(this)));
    }

    override dispose(): void
    {
        // Remove message events
        if(this.connection)
        {
            for(const event of this._messageEvents)
            {
                this.connection.removeMessageEvent(event);
            }
        }
        this._messageEvents = [];

        super.dispose();
    }

    private addMessageEvent(connection: IConnection, event: IMessageEvent): void
    {
        connection.addMessageEvent(event);
        this._messageEvents.push(event);
    }

    // AS3: .../src/com/sulake/habbo/session/handler/RoomSessionHandler.as::onRoomConnected()
    private onRoomConnected(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as OpenConnectionMessageParser;
        if(parser === null)
        {
            return;
        }

        if(this.listener)
        {
            this.listener.sessionUpdate(parser.flatId, RoomSessionHandlerState.RS_CONNECTED);
        }

        log.debug(`Room connected: ${parser.flatId}`);
    }

    // AS3: .../src/com/sulake/habbo/session/handler/RoomSessionHandler.as::onFlatAccessible()
    private onFlatAccessible(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as FlatAccessibleMessageParser;
        if(parser === null)
        {
            return;
        }

        const userName = parser.userName;
        if(userName !== null && userName.length > 0)
        {
            if(this.listener && this.listener.sessionEvents)
            {
                const session = this.listener.getSession(parser.flatId);
                if(session !== null)
                {
                    this.listener.sessionEvents.emit(
                        RoomSessionDoorbellEvent.RSDE_ACCEPTED,
                        new RoomSessionDoorbellEvent(RoomSessionDoorbellEvent.RSDE_ACCEPTED, session, userName)
                    );
                }
            }
        }

        log.debug(`Flat accessible: ${parser.flatId}, user: ${userName}`);
    }

    // AS3: .../src/com/sulake/habbo/session/handler/RoomSessionHandler.as::onRoomReady()
    private onRoomReady(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as RoomReadyMessageParser;
        if(parser === null)
        {
            return;
        }

        const roomId = parser.roomId;

        // The room a crash report was filed from. Written by nobody until now, like the rest of
        // that report — see `HabboTracking.storeErrorDetails()`.
        ErrorReportStorage.addDebugData('RoomID', `Room id: ${roomId}`);

        if(this.listener)
        {
            this.listener.sessionReinitialize(roomId, roomId);
            this.listener.sessionUpdate(roomId, RoomSessionHandlerState.RS_READY);
        }

        log.debug(`Room ready: ${roomId}`);
    }

    // AS3: .../src/com/sulake/habbo/session/handler/RoomSessionHandler.as::onFlatAccessDenied()
    private onFlatAccessDenied(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as FlatAccessDeniedMessageParser;
        if(parser === null)
        {
            return;
        }

        const userName = parser.userName;
        if(userName === null || userName.length === 0)
        {
            if(this.listener)
            {
                this.listener.sessionUpdate(parser.flatId, RoomSessionHandlerState.RS_DISCONNECTED);
            }
        }
        else if(this.listener && this.listener.sessionEvents)
        {
            const session = this.listener.getSession(parser.flatId);
            if(session !== null)
            {
                this.listener.sessionEvents.emit(
                    RoomSessionDoorbellEvent.RSDE_REJECTED,
                    new RoomSessionDoorbellEvent(RoomSessionDoorbellEvent.RSDE_REJECTED, session, userName)
                );
            }
        }

        log.debug(`Flat access denied: ${parser.flatId}, user: ${userName}`);
    }

    // AS3: .../src/com/sulake/habbo/session/handler/RoomSessionHandler.as::onRoomDisconnected()
    private onRoomDisconnected(_event: IMessageEvent): void
    {
        const roomId = this.roomId;

        if(this.listener)
        {
            this.listener.sessionUpdate(roomId, RoomSessionHandlerState.RS_DISCONNECTED);
        }

        log.debug(`Room disconnected: ${roomId}`);
    }

    // AS3: .../src/com/sulake/habbo/session/handler/RoomSessionHandler.as::onRoomQueueStatus()
    private onRoomQueueStatus(event: IMessageEvent): void
    {
        if(!this.listener || !this.listener.sessionEvents)
        {
            return;
        }

        const parser = event.parser as RoomQueueStatusMessageParser;
        if(!parser)
        {
            return;
        }

        const session = this.listener.getSession(parser.flatId);
        if(!session)
        {
            return;
        }

        const targets = parser.getQueueSetTargets();
        const activeTarget = parser.activeTarget;

        for(const target of targets)
        {
            const queueSet = parser.getQueueSet(target);
            if(!queueSet)
            {
                continue;
            }

            const queueEvent = new RoomSessionQueueEvent(
                session,
                queueSet.name,
                queueSet.target,
                queueSet.target === activeTarget
            );

            const queueTypes = queueSet.queueTypes;

            for(const queueType of queueTypes)
            {
                queueEvent.addQueue(queueType, queueSet.getQueueSize(queueType));
            }

            this.listener.sessionEvents.emit(RoomSessionQueueEvent.QUEUE_STATUS, queueEvent);
        }
    }

    // AS3: .../src/com/sulake/habbo/session/handler/RoomSessionHandler.as::onYouAreSpectator()
    private onYouAreSpectator(event: IMessageEvent): void
    {
        if(!this.listener)
        {
            return;
        }

        const parser = event.parser as YouAreSpectatorMessageParser;
        if(!parser)
        {
            return;
        }

        const session = this.listener.getSession(parser.flatId);
        if(!session)
        {
            return;
        }

        session.isSpectatorMode = true;
    }

    /**
     * The server sends this right after the SSO login with the start room, and whenever it moves
     * the player: it never puts anyone in a room itself, the client connects.
     */
    // DEVIATION: AS3's navigator asks GetGuestRoom first and enters on the answer; GetGuestRoom is not
    //   in the core-cut contract (2026-10-07), so the session enters the room directly.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/_SafeCls_1951.as::onRoomForward()
    private onRoomForward(event: IMessageEvent): void
    {
        const parser = event?.parser as RoomForwardMessageParser | null;

        if(!parser || !this.listener) return;

        log.debug(`Room forward: ${parser.roomId}`);
        this.listener.gotoRoom(parser.roomId);
    }

    /** The entry failed (full, banned, blocked, queue error); RoomUI tells the player why. */
    // DEVIATION: AS3's navigator also sends the player back to reception through the toolbar; both
    //   left with the core cut, so the pending session is simply dropped.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/_SafeCls_1951.as::onCantConnect()
    private onCantConnect(event: IMessageEvent): void
    {
        const parser = event?.parser as CantConnectMessageParser | null;

        if(!parser) return;

        log.warn(`Cannot enter room ${this.roomId}: reason ${parser.reason}`);
        this.connection?.send(new QuitMessageComposer());
        this.listener?.sessionUpdate(this.roomId, RoomSessionHandlerState.RS_DISCONNECTED);
    }
}
