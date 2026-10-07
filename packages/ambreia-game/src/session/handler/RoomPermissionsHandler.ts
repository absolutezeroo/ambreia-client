import {BaseHandler} from './BaseHandler';
import type {IConnection} from '@ambreia/net/connection/IConnection';
import type {IRoomHandlerListener} from '../IRoomHandlerListener';
import type {IMessageEvent} from '@ambreia/net/messages/IMessageEvent';
import {
    YouAreControllerMessageEvent,
    YouAreNotControllerMessageEvent,
    YouAreOwnerMessageEvent,
} from '@ambreia/protocol/incoming/room/permissions/index';
import type {
    YouAreControllerMessageParser,
    YouAreNotControllerMessageParser,
} from '@ambreia/protocol/parser/room/permissions/index';

/**
 * Room permissions handler
 *
 * Based on AS3: com.sulake.habbo.session.handler.RoomPermissionsHandler
 *
 * Handles messages related to room permissions (controller/owner status).
 */
export class RoomPermissionsHandler extends BaseHandler
{
    constructor(connection: IConnection | null, listener: IRoomHandlerListener)
    {
        super(connection, listener);

        if(connection === null)
        {
            return;
        }

        connection.addMessageEvent(new YouAreControllerMessageEvent(this.onYouAreController.bind(this)));
        connection.addMessageEvent(new YouAreNotControllerMessageEvent(this.onYouAreNotController.bind(this)));
        connection.addMessageEvent(new YouAreOwnerMessageEvent(this.onYouAreOwner.bind(this)));
    }

    // AS3: .../src/com/sulake/habbo/session/handler/RoomPermissionsHandler.as::onYouAreController()
    private onYouAreController(event: IMessageEvent): void
    {
        const parser = event.parser as YouAreControllerMessageParser;

        if(!parser)
        {
            return;
        }

        const session = this.listener?.getSession(parser.flatId);

        if(!session)
        {
            return;
        }

        session.roomControllerLevel = parser.roomControllerLevel;
    }

    // AS3: .../src/com/sulake/habbo/session/handler/RoomPermissionsHandler.as::onYouAreNotController()
    private onYouAreNotController(event: IMessageEvent): void
    {
        const parser = event.parser as YouAreNotControllerMessageParser;

        if(!parser)
        {
            return;
        }

        const session = this.listener?.getSession(parser.flatId);

        if(!session)
        {
            return;
        }

        session.roomControllerLevel = 0;
    }

    // AS3: .../src/com/sulake/habbo/session/handler/RoomPermissionsHandler.as::onYouAreOwner()
    private onYouAreOwner(_event: IMessageEvent): void
    {
        const session = this.listener?.getSession(this.roomId);

        if(!session)
        {
            return;
        }

        session.isRoomOwner = true;
    }
}
