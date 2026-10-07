import type {IConnection} from '@ambreia/net/connection/IConnection';
import type {IMessageEvent} from '@ambreia/net/messages/IMessageEvent';
import type {IRoomHandlerListener} from '../IRoomHandlerListener';
import {BaseHandler} from './BaseHandler';

// Message events
import {
    PresentOpenedMessageEvent
} from '../../communication/messages/incoming/room/furniture/PresentOpenedMessageEvent';

// Parsers
import type {
    PresentOpenedMessageEventParser
} from '../../communication/messages/parser/room/furniture/PresentOpenedMessageEventParser';

// Events
import {RoomSessionPresentEvent} from '../events/RoomSessionPresentEvent';

/**
 * Present handler
 *
 * Handles present opened messages and dispatches RoomSessionPresentEvent.
 *
 * @see source_as_win63/habbo/session/handler/PresentHandler.as
 */
export class PresentHandler extends BaseHandler
{
    private _messageEvents: IMessageEvent[] = [];

    constructor(connection: IConnection | null, listener: IRoomHandlerListener)
    {
        super(connection, listener);

        if(connection === null)
        {
            return;
        }

        this.addMessageEvent(connection, new PresentOpenedMessageEvent(this.onPresentOpened.bind(this)));
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

    // AS3: .../src/com/sulake/habbo/session/handler/PresentHandler.as::onPresentOpened()
    private onPresentOpened(event: IMessageEvent): void
    {
        const presentEvent = event as PresentOpenedMessageEvent;
        if(presentEvent === null)
        {
            return;
        }

        const parser = presentEvent.parser as PresentOpenedMessageEventParser;
        if(parser === null)
        {
            return;
        }

        const session = this.listener.getSession(this.roomId);
        if(session === null)
        {
            return;
        }

        if(this.listener && this.listener.sessionEvents)
        {
            this.listener.sessionEvents.emit(
                RoomSessionPresentEvent.RSPE_PRESENT_OPENED,
                new RoomSessionPresentEvent(
                    RoomSessionPresentEvent.RSPE_PRESENT_OPENED,
                    session,
                    parser.classId,
                    parser.itemType,
                    parser.productCode,
                    parser.placedItemId,
                    parser.placedItemType,
                    parser.placedInRoom,
                    parser.petFigureString
                )
            );
        }
    }
}
