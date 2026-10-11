import type {IConnection} from '@ambreia/net/connection/IConnection';
import type {IMessageEvent} from '@ambreia/net/messages/IMessageEvent';
import type {IRoomHandlerListener} from '../IRoomHandlerListener';
import {BaseHandler} from './BaseHandler';
import {ErrorReportStorage} from '@ambreia/common/utils/ErrorReportStorage';

// Message events
import {
    OpenConnectionMessageEvent
} from '@ambreia/protocol/incoming/room/session/OpenConnectionMessageEvent';
import {RoomReadyMessageEvent} from '@ambreia/protocol/incoming/room/session/RoomReadyMessageEvent';
import {
    CloseConnectionMessageEvent
} from '@ambreia/protocol/incoming/room/session/CloseConnectionMessageEvent';
import {RoomForwardMessageEvent} from '@ambreia/protocol/incoming/room/session/RoomForwardMessageEvent';
import {CantConnectMessageEvent} from '@ambreia/protocol/incoming/room/session/CantConnectMessageEvent';
import {QuitMessageComposer} from '@ambreia/protocol/outgoing/room/session/QuitMessageComposer';

// Parsers
import type {
    OpenConnectionMessageParser
} from '@ambreia/protocol/parser/room/session/OpenConnectionMessageParser';
import type {RoomReadyMessageParser} from '@ambreia/protocol/parser/room/session/RoomReadyMessageParser';
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
        this.addMessageEvent(connection, new RoomReadyMessageEvent(this.onRoomReady.bind(this)));
        this.addMessageEvent(connection, new CloseConnectionMessageEvent(this.onRoomDisconnected.bind(this)));
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

    /**
     * The server sends this right after the SSO login with the start room, and whenever it moves
     * the player: it never puts anyone in a room itself, the client connects.
     */
    // The RPG server forwards directly to a room/instance id; there is no Navigator metadata hop.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/_SafeCls_1951.as::onRoomForward()
    private onRoomForward(event: IMessageEvent): void
    {
        const parser = event?.parser as RoomForwardMessageParser | null;

        if(!parser || !this.listener) return;

        log.debug(`Room forward: ${parser.roomId}`);
        this.listener.gotoRoom(parser.roomId);
    }

    /** The entry failed (full, banned, blocked, queue error); RoomUI tells the player why. */
    // A refused RPG room/instance entry simply drops the pending session.
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
