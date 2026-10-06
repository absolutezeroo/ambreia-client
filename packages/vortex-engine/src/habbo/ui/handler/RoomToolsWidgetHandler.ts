/**
 * RoomToolsWidgetHandler
 *
 * @see sources/win63_version/habbo/ui/handler/RoomToolsWidgetHandler.as
 *
 * Handler for the RWE_ROOM_TOOLS widget: listens for guest-room-result
 * messages to populate room name/owner/tags on room enter, and delegates
 * rating/navigation actions to the navigator/connection.
 */
import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import type {IRoomWidgetHandler} from '@habbo/ui/IRoomWidgetHandler';
import type {IRoomWidgetHandlerContainer} from '@habbo/ui/IRoomWidgetHandlerContainer';
import type {IHabboNavigator} from '@habbo/navigator/IHabboNavigator';
import type {IHabboCommunicationManager} from '@habbo/communication/IHabboCommunicationManager';
import type {ISessionDataManager} from '@habbo/session/ISessionDataManager';
import type {RoomWidgetMessage} from '@habbo/ui/widget/messages/RoomWidgetMessage';
import type {RoomWidgetUpdateEvent} from '@habbo/ui/widget/events/RoomWidgetUpdateEvent';
import {GetGuestRoomResultMessageEvent} from '@habbo/communication/messages/incoming/navigator/GetGuestRoomResultMessageEvent';
import type {GetGuestRoomResultMessageParser} from '@habbo/communication/messages/parser/navigator/GetGuestRoomResultMessageParser';
import type {RoomToolsWidget} from '@habbo/ui/widget/roomtools/RoomToolsWidget';
import {SessionDataPreferencesEvent} from '@habbo/session/events/SessionDataPreferencesEvent';

export class RoomToolsWidgetHandler implements IRoomWidgetHandler
{
    // AS3: .../src/com/sulake/habbo/ui/handler/RoomToolsWidgetHandler.as::_disposed
    private _disposed: boolean = false;
    // AS3: .../src/com/sulake/habbo/ui/handler/RoomToolsWidgetHandler.as::_communicationManagerMessageEvents
    private _communicationManagerMessageEvents: IMessageEvent[] = [];
    // AS3: .../src/com/sulake/habbo/ui/handler/RoomToolsWidgetHandler.as::_communicationManager
    private _communicationManager: IHabboCommunicationManager | null = null;
    private _navigatorRef: IHabboNavigator | null = null;
    private _widget: RoomToolsWidget | null = null;
    // AS3: .../src/com/sulake/habbo/ui/handler/RoomToolsWidgetHandler.as::_container
    private _container: IRoomWidgetHandlerContainer | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/RoomToolsWidgetHandler.as::set widget()
    public set widget(value: RoomToolsWidget | null)
    {
        this._widget = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/RoomToolsWidgetHandler.as::onRoomInfo()
    private onRoomInfo = (event: IMessageEvent): void =>
    {
        const parser = (event as GetGuestRoomResultMessageEvent).getParser<GetGuestRoomResultMessageParser>();
        const data = parser.data;

        if(data)
        {
            this._widget?.updateRoomData(data);
        }

        if(parser.enterRoom && data && this._widget)
        {
            const ownerLine = data.showOwner
                ? `${this._widget.localizations?.getLocalizationWithParams('room.tool.room.owner.prefix', 'By') ?? 'By'} ${data.ownerName}`
                : this._widget.localizations?.getLocalizationWithParams('room.tool.public.room', 'Public room') ?? 'Public room';

            this._widget.showRoomInfo(true, data.roomName, ownerLine, data.tags);
            this._widget.storeRoomData(data);
            this._widget.enterNewRoom(data.flatId);
        }
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/RoomToolsWidgetHandler.as::toggleRoomInfoWindow()
    public toggleRoomInfoWindow(): void
    {
        this._navigatorRef?.toggleRoomInfoVisibility();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/RoomToolsWidgetHandler.as::goToPrivateRoom()
    public goToPrivateRoom(flatId: number): void
    {
        this._navigatorRef?.goToPrivateRoom(flatId);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/RoomToolsWidgetHandler.as::get type()
    public get type(): string
    {
        return 'RWE_ROOM_TOOLS';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/RoomToolsWidgetHandler.as::onSessionDataPreferences()
    // Empty in AS3 too - no fidelity gap in leaving it a no-op, only in the listener wiring itself.
    private onSessionDataPreferences = (_event: unknown): void =>
    {
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/RoomToolsWidgetHandler.as::set container() / get container()
    public set container(value: IRoomWidgetHandlerContainer | null)
    {
        this._container?.sessionDataManager?.events.off(SessionDataPreferencesEvent.PREFERENCES_UPDATED, this.onSessionDataPreferences);

        this._container = value;

        this._container?.sessionDataManager?.events.on(SessionDataPreferencesEvent.PREFERENCES_UPDATED, this.onSessionDataPreferences);
    }

    // AS3: .../src/com/sulake/habbo/ui/handler/RoomToolsWidgetHandler.as::get container()
    public get container(): IRoomWidgetHandlerContainer | null
    {
        return this._container;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/RoomToolsWidgetHandler.as::getWidgetMessages()
    public getWidgetMessages(): string[]
    {
        return ['RWZTM_ZOOM_TOGGLE'];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/RoomToolsWidgetHandler.as::processWidgetMessage()
    public processWidgetMessage(_message: RoomWidgetMessage): RoomWidgetUpdateEvent | null
    {
        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/RoomToolsWidgetHandler.as::getProcessedEvents()
    public getProcessedEvents(): string[]
    {
        return [];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/RoomToolsWidgetHandler.as::processEvent()
    public processEvent(_event: unknown): void
    {
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/RoomToolsWidgetHandler.as::update()
    public update(): void
    {
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/RoomToolsWidgetHandler.as::dispose()
    public dispose(): void
    {
        this._disposed = true;

        if(this._communicationManager)
        {
            for(const event of this._communicationManagerMessageEvents)
            {
                this._communicationManager.removeMessageEvent(event);
            }

            this._communicationManagerMessageEvents = [];
            this._communicationManager = null;
        }

        this._container?.sessionDataManager?.events.off(SessionDataPreferencesEvent.PREFERENCES_UPDATED, this.onSessionDataPreferences);

        this._navigatorRef = null;
        this._widget = null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/RoomToolsWidgetHandler.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/RoomToolsWidgetHandler.as::set navigator() / get navigator()
    public set navigator(value: IHabboNavigator | null)
    {
        this._navigatorRef = value;
    }

    // AS3: .../src/com/sulake/habbo/ui/handler/RoomToolsWidgetHandler.as::get navigator()
    public get navigator(): IHabboNavigator | null
    {
        return this._navigatorRef;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/RoomToolsWidgetHandler.as::get sessionDataManager()
    public get sessionDataManager(): ISessionDataManager | null
    {
        return this._container?.sessionDataManager ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/RoomToolsWidgetHandler.as::set communicationManager()
    public set communicationManager(value: IHabboCommunicationManager | null)
    {
        this._communicationManager = value;

        if(this._communicationManager)
        {
            const event = this._communicationManager.addMessageEvent(new GetGuestRoomResultMessageEvent(this.onRoomInfo));

            this._communicationManagerMessageEvents.push(event);
        }
    }
}
