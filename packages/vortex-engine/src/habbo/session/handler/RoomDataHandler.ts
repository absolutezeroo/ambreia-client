import type {IConnection} from '@ambreia/net/connection/IConnection';
import type {IMessageEvent} from '@ambreia/net/messages/IMessageEvent';
import type {IRoomHandlerListener} from '../IRoomHandlerListener';
import {BaseHandler} from './BaseHandler';

// Message events
import {
    GetGuestRoomResultMessageEvent
} from '../../communication/messages/incoming/navigator/GetGuestRoomResultMessageEvent';

// Parsers
import type {
    GetGuestRoomResultMessageParser
} from '../../communication/messages/parser/navigator/GetGuestRoomResultMessageParser';

// Events
import {RoomSessionEvent} from '../events/RoomSessionEvent';
import {RoomSessionPropertyUpdateEvent} from '../events/RoomSessionPropertyUpdateEvent';

/**
 * Room data handler
 *
 * Based on AS3: com.sulake.habbo.session.handler.RoomDataHandler
 *
 * Handles GetGuestRoomResultEvent and updates session properties.
 */
export class RoomDataHandler extends BaseHandler
{
    private _messageEvents: IMessageEvent[] = [];

    constructor(connection: IConnection | null, listener: IRoomHandlerListener)
    {
        super(connection, listener);

        if(connection === null)
        {
            return;
        }

        this.addMessageEvent(connection, new GetGuestRoomResultMessageEvent(this.onRoomResult.bind(this)));
    }

    override dispose(): void
    {
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

    // AS3: .../src/com/sulake/habbo/session/handler/RoomDataHandler.as::onRoomResult()
    private onRoomResult(event: IMessageEvent): void
    {
        const resultEvent = event as GetGuestRoomResultMessageEvent;
        if(resultEvent === null)
        {
            return;
        }

        const parser = resultEvent.parser as GetGuestRoomResultMessageParser;
        if(parser === null)
        {
            return;
        }

        // Skip if this is a room forward message (initial GetGuestRoom before entering)
        if(parser.roomForward)
        {
            return;
        }

        const session = this.listener.getSession(this.roomId);
        if(session === null)
        {
            return;
        }

        const data = parser.data;
        if(data !== null)
        {
            session.tradeMode = data.tradeMode;
            session.isGuildRoom = data.habboGroupId !== 0;
            session.doorMode = data.doorMode;
            session.arePetsAllowed = data.allowPets;
        }

        session.roomModerationSettings = parser.roomModerationSettings;

        // Dispatch events
        if(this.listener.sessionEvents)
        {
            this.listener.sessionEvents.emit(
                RoomSessionPropertyUpdateEvent.RSDUE_ALLOW_PETS,
                new RoomSessionPropertyUpdateEvent(RoomSessionPropertyUpdateEvent.RSDUE_ALLOW_PETS, session)
            );

            this.listener.sessionEvents.emit(
                RoomSessionEvent.SESSION_ROOM_DATA,
                new RoomSessionEvent(RoomSessionEvent.SESSION_ROOM_DATA, session)
            );
        }
    }
}
