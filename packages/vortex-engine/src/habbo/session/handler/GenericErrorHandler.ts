import type {IConnection} from '@ambreia/net/connection/IConnection';
import type {IMessageEvent} from '@ambreia/net/messages/IMessageEvent';
import type {IRoomHandlerListener} from '../IRoomHandlerListener';
import {BaseHandler} from './BaseHandler';

// Message events
import {GenericErrorMessageEvent} from '@ambreia/protocol/incoming/handshake/GenericErrorMessageEvent';

// Parsers
import type {GenericErrorMessageParser} from '@ambreia/protocol/parser/handshake/GenericErrorMessageParser';

// Events
import {RoomSessionErrorMessageEvent} from '../events/RoomSessionErrorMessageEvent';

/**
 * Generic error handler
 *
 * Handles GenericErrorEvent and dispatches RoomSessionErrorMessageEvent
 * for error code 4008 (kicked by owner).
 *
 * @see source_as_win63/habbo/session/handler/GenericErrorHandler.as
 */
export class GenericErrorHandler extends BaseHandler
{
    private _messageEvents: IMessageEvent[] = [];

    constructor(connection: IConnection | null, listener: IRoomHandlerListener)
    {
        super(connection, listener);

        if(connection === null)
        {
            return;
        }

        this.addMessageEvent(connection, new GenericErrorMessageEvent(this.onGenericError.bind(this)));
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

    // AS3: .../src/com/sulake/habbo/session/handler/GenericErrorHandler.as::onGenericError()
    private onGenericError(event: IMessageEvent): void
    {
        const genericEvent = event as GenericErrorMessageEvent;
        if(genericEvent === null)
        {
            return;
        }

        const parser = genericEvent.parser as GenericErrorMessageParser;
        if(parser === null)
        {
            return;
        }

        const session = this.listener.getSession(this.roomId);
        if(session === null)
        {
            return;
        }

        switch(parser.errorCode - 4008)
        {
            case 0:
            {
                const errorType = RoomSessionErrorMessageEvent.KICKED_BY_OWNER;

                if(this.listener && this.listener.sessionEvents)
                {
                    this.listener.sessionEvents.emit(
                        errorType,
                        new RoomSessionErrorMessageEvent(errorType, session)
                    );
                }
                return;
            }
            default:
                return;
        }
    }
}
