import type {IRoomWidgetHandler} from '../IRoomWidgetHandler';
import type {IRoomWidgetHandlerContainer} from '../IRoomWidgetHandlerContainer';
import type {RoomWidgetMessage} from '../widget/messages/RoomWidgetMessage';
import type {RoomWidgetUpdateEvent} from '../widget/events/RoomWidgetUpdateEvent';
import {RoomWidgetLoadingBarUpdateEvent} from '../widget/events/RoomWidgetLoadingBarUpdateEvent';

/**
 * Passes the loading bar's show/hide event straight through to the widget bus.
 *
 * It is the only handler that re-dispatches its input unchanged: the desktop already builds a
 * `RoomWidgetLoadingBarUpdateEvent` and hands it to `processEvent()`, so there is nothing to
 * translate — the handler exists purely so the event reaches the widget's listeners.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/LoadingBarWidgetHandler.as
 */
export class LoadingBarWidgetHandler implements IRoomWidgetHandler
{
    // AS3: .../handler/LoadingBarWidgetHandler.as::_disposed
    private _disposed: boolean = false;

    // AS3: .../handler/LoadingBarWidgetHandler.as::_container
    private _container: IRoomWidgetHandlerContainer | null = null;

    // AS3: .../handler/LoadingBarWidgetHandler.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: .../handler/LoadingBarWidgetHandler.as::get type()
    get type(): string
    {
        return 'RWE_LOADINGBAR';
    }

    // AS3: .../handler/LoadingBarWidgetHandler.as::set container()
    set container(value: IRoomWidgetHandlerContainer | null)
    {
        this._container = value;
    }

    // AS3: .../handler/LoadingBarWidgetHandler.as::getWidgetMessages()
    // The bar has no buttons.
    getWidgetMessages(): string[]
    {
        return [];
    }

    // AS3: .../handler/LoadingBarWidgetHandler.as::processWidgetMessage()
    processWidgetMessage(_message: RoomWidgetMessage): RoomWidgetUpdateEvent | null
    {
        return null;
    }

    // AS3: .../handler/LoadingBarWidgetHandler.as::getProcessedEvents()
    getProcessedEvents(): string[]
    {
        return [RoomWidgetLoadingBarUpdateEvent.SHOW, RoomWidgetLoadingBarUpdateEvent.HIDE];
    }

    // AS3: .../handler/LoadingBarWidgetHandler.as::processEvent()
    // Both cases have the same body in AS3; the switch is there to reject anything else.
    processEvent(event: RoomWidgetLoadingBarUpdateEvent): void
    {
        if(this._container === null) return;

        if(event.type !== RoomWidgetLoadingBarUpdateEvent.SHOW && event.type !== RoomWidgetLoadingBarUpdateEvent.HIDE)
        {
            return;
        }

        this._container.desktopEvents.emit(event.type, event);
    }

    // AS3: .../handler/LoadingBarWidgetHandler.as::update()
    // Empty in AS3 too.
    update(): void
    {
    }

    // AS3: .../handler/LoadingBarWidgetHandler.as::dispose()
    dispose(): void
    {
        this._disposed = true;
        this._container = null;
    }
}
