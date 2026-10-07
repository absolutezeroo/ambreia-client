import type {IConnection} from '@ambreia/net/connection/IConnection';
import type {IMessageEvent} from '@ambreia/net/messages/IMessageEvent';
import type {IRoomHandlerListener} from '../IRoomHandlerListener';
import {BaseHandler} from './BaseHandler';

// Message events
import {
    OpenPetPackageRequestedMessageEvent
} from '@ambreia/protocol/incoming/room/furniture/OpenPetPackageRequestedMessageEvent';
import {
    OpenPetPackageResultMessageEvent
} from '@ambreia/protocol/incoming/room/furniture/OpenPetPackageResultMessageEvent';

// Parsers
import type {
    OpenPetPackageRequestedMessageEventParser
} from '@ambreia/protocol/parser/room/furniture/OpenPetPackageRequestedMessageEventParser';
import type {
    OpenPetPackageResultMessageEventParser
} from '@ambreia/protocol/parser/room/furniture/OpenPetPackageResultMessageEventParser';

// Events
import {RoomSessionPetPackageEvent} from '../events/RoomSessionPetPackageEvent';

/**
 * Pet package handler
 *
 * Handles pet package open messages and dispatches RoomSessionPetPackageEvent.
 *
 * @see source_as_win63/habbo/session/handler/PetPackageHandler.as
 */
export class PetPackageHandler extends BaseHandler
{
    private _messageEvents: IMessageEvent[] = [];

    constructor(connection: IConnection | null, listener: IRoomHandlerListener)
    {
        super(connection, listener);

        if(connection === null)
        {
            return;
        }

        this.addMessageEvent(connection, new OpenPetPackageRequestedMessageEvent(this.onOpenPetPackageRequested.bind(this)));
        this.addMessageEvent(connection, new OpenPetPackageResultMessageEvent(this.onOpenPetPackageResult.bind(this)));
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

    // AS3: .../src/com/sulake/habbo/session/handler/PetPackageHandler.as::onOpenPetPackageRequested()
    private onOpenPetPackageRequested(event: IMessageEvent): void
    {
        const reqEvent = event as OpenPetPackageRequestedMessageEvent;
        if(reqEvent === null)
        {
            return;
        }

        const parser = reqEvent.parser as OpenPetPackageRequestedMessageEventParser;
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
                RoomSessionPetPackageEvent.RSOPPE_OPEN_PET_PACKAGE_REQUESTED,
                new RoomSessionPetPackageEvent(
                    RoomSessionPetPackageEvent.RSOPPE_OPEN_PET_PACKAGE_REQUESTED,
                    session,
                    parser.objectId,
                    parser.figureData,
                    0
                )
            );
        }
    }

    // AS3: .../src/com/sulake/habbo/session/handler/PetPackageHandler.as::onOpenPetPackageResult()
    private onOpenPetPackageResult(event: IMessageEvent): void
    {
        const resultEvent = event as OpenPetPackageResultMessageEvent;
        if(resultEvent === null)
        {
            return;
        }

        const parser = resultEvent.parser as OpenPetPackageResultMessageEventParser;
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
                RoomSessionPetPackageEvent.RSOPPE_OPEN_PET_PACKAGE_RESULT,
                new RoomSessionPetPackageEvent(
                    RoomSessionPetPackageEvent.RSOPPE_OPEN_PET_PACKAGE_RESULT,
                    session,
                    parser.objectId,
                    null,
                    parser.nameValidationStatus,
                    parser.nameValidationInfo
                )
            );
        }
    }
}
