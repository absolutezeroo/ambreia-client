/**
 * RoomWidgetUpdateEvent
 *
 * @see sources/win63_version/habbo/ui/widget/events/RoomWidgetUpdateEvent.as
 *
 * Base class for widget update events. Dispatched via
 * `desktopEvents.emit(event.type, event)` rather than a Flash Event bus.
 */
export class RoomWidgetUpdateEvent
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetUpdateEvent.as::WIDGET_UPDATE_EVENT_TEST
    public static readonly WIDGET_UPDATE_EVENT_TEST: string = 'RWUE_EVENT_TEST';

    private _type: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetUpdateEvent.as::RoomWidgetUpdateEvent()
    constructor(type: string)
    {
        this._type = type;
    }

    public get type(): string
    {
        return this._type;
    }
}
