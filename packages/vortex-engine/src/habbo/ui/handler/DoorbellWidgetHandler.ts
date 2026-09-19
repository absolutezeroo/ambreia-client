import type {IRoomWidgetHandler} from '../IRoomWidgetHandler';
import type {IRoomWidgetHandlerContainer} from '../IRoomWidgetHandlerContainer';
import type {RoomWidgetMessage} from '../widget/messages/RoomWidgetMessage';
import type {RoomWidgetUpdateEvent} from '../widget/events/RoomWidgetUpdateEvent';
import {RoomWidgetLetUserInMessage} from '../widget/messages/RoomWidgetLetUserInMessage';
import {RoomWidgetDoorbellEvent} from '../widget/events/RoomWidgetDoorbellEvent';
import {RoomSessionDoorbellEvent} from '@habbo/session/events/RoomSessionDoorbellEvent';

/**
 * Turns the room session's doorbell events into widget events, and the widget's answer back into
 * a `letUserIn` on the session. It holds no state of its own — the list lives on the widget.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/DoorbellWidgetHandler.as
 */
export class DoorbellWidgetHandler implements IRoomWidgetHandler
{
    private _disposed: boolean = false;

    // AS3: .../DoorbellWidgetHandler.as::_container
    private _container: IRoomWidgetHandlerContainer | null = null;

    // AS3: .../DoorbellWidgetHandler.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: .../DoorbellWidgetHandler.as::get type()
    get type(): string
    {
        return 'RWE_DOORBELL';
    }

    // AS3: .../DoorbellWidgetHandler.as::set container()
    set container(value: IRoomWidgetHandlerContainer | null)
    {
        this._container = value;
    }

    // AS3: .../DoorbellWidgetHandler.as::getWidgetMessages()
    getWidgetMessages(): string[]
    {
        return [RoomWidgetLetUserInMessage.LET_USER_IN];
    }

    // AS3: .../DoorbellWidgetHandler.as::processWidgetMessage()
    // Always returns null: the answer goes to the server, nothing is drawn back.
    processWidgetMessage(message: RoomWidgetMessage): RoomWidgetUpdateEvent | null
    {
        if(message.type === RoomWidgetLetUserInMessage.LET_USER_IN)
        {
            const letUserIn = message as RoomWidgetLetUserInMessage;

            this._container?.roomSession?.letUserIn(letUserIn.userName, letUserIn.canEnter);
        }

        return null;
    }

    // AS3: .../DoorbellWidgetHandler.as::getProcessedEvents()
    getProcessedEvents(): string[]
    {
        return [
            RoomSessionDoorbellEvent.RSDE_DOORBELL,
            RoomSessionDoorbellEvent.RSDE_REJECTED,
            RoomSessionDoorbellEvent.RSDE_ACCEPTED
        ];
    }

    /**
     * One session event maps to one widget event of the same meaning. The rejected and accepted
     * cases exist so that a doorbell answered *elsewhere* — by another room owner — still clears
     * the row here.
     */
    // AS3: .../DoorbellWidgetHandler.as::processEvent()
    processEvent(event: RoomSessionDoorbellEvent): void
    {
        if(event.userName === undefined || event.userName === null) return;

        switch(event.type)
        {
            case RoomSessionDoorbellEvent.RSDE_DOORBELL:
                this.dispatch(RoomWidgetDoorbellEvent.RINGING, event.userName);
                break;

            case RoomSessionDoorbellEvent.RSDE_REJECTED:
                this.dispatch(RoomWidgetDoorbellEvent.REJECTED, event.userName);
                break;

            case RoomSessionDoorbellEvent.RSDE_ACCEPTED:
                this.dispatch(RoomWidgetDoorbellEvent.ACCEPTED, event.userName);
                break;
        }
    }

    // AS3: .../DoorbellWidgetHandler.as::processEvent()
    // The same dispatch, written out three times there. AS3 calls the bus `container.events`;
    // this port names it `desktopEvents`, which is the one every other handler dispatches on.
    private dispatch(type: string, userName: string): void
    {
        this._container?.desktopEvents.emit(type, new RoomWidgetDoorbellEvent(type, userName));
    }

    // AS3: .../DoorbellWidgetHandler.as::update()
    // Empty in AS3 too.
    update(): void
    {
    }

    // AS3: .../DoorbellWidgetHandler.as::dispose()
    dispose(): void
    {
        this._disposed = true;
        this._container = null;
    }
}
