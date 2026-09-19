import type {IConnection} from '@core/communication/connection/IConnection';
import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import type {IRoomHandlerListener} from '../IRoomHandlerListener';
import {BaseHandler} from './BaseHandler';
import {RoomSessionDoorbellEvent} from '../events/RoomSessionDoorbellEvent';
import {RoomSessionQueueEvent} from '../events/RoomSessionQueueEvent';
import {ErrorReportStorage} from '@core/utils/ErrorReportStorage';

// Message events
import {
    OpenConnectionMessageEvent
} from '../../communication/messages/incoming/room/session/OpenConnectionMessageEvent';
import {
    FlatAccessibleMessageEvent
} from '../../communication/messages/incoming/room/session/FlatAccessibleMessageEvent';
import {RoomReadyMessageEvent} from '../../communication/messages/incoming/room/session/RoomReadyMessageEvent';
import {
    CloseConnectionMessageEvent
} from '../../communication/messages/incoming/room/session/CloseConnectionMessageEvent';
import {
    RoomQueueStatusMessageEvent
} from '../../communication/messages/incoming/room/session/RoomQueueStatusMessageEvent';
import {
    YouAreSpectatorMessageEvent
} from '../../communication/messages/incoming/room/session/YouAreSpectatorMessageEvent';
import {
    FlatAccessDeniedMessageEvent
} from '../../communication/messages/incoming/navigator/FlatAccessDeniedMessageEvent';

// Parsers
import type {
    OpenConnectionMessageParser
} from '../../communication/messages/parser/room/session/OpenConnectionMessageParser';
import type {
    FlatAccessibleMessageParser
} from '../../communication/messages/parser/room/session/FlatAccessibleMessageParser';
import type {RoomReadyMessageParser} from '../../communication/messages/parser/room/session/RoomReadyMessageParser';
import type {
    FlatAccessDeniedMessageParser
} from '../../communication/messages/parser/navigator/FlatAccessDeniedMessageParser';
import type {
    RoomQueueStatusMessageParser
} from '../../communication/messages/parser/room/session/RoomQueueStatusMessageParser';
import type {
    YouAreSpectatorMessageParser
} from '../../communication/messages/parser/room/session/YouAreSpectatorMessageParser';

import {Logger} from '@core/utils/Logger';

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
}
