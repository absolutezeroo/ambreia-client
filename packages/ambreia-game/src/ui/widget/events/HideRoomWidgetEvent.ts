/**
 * HideRoomWidgetEvent
 *
 * Dispatched by RoomUI.hideWidget() and routed through RoomDesktop.processEvent() to whichever
 * widget handler declares HIDE_ROOM_WIDGET in getProcessedEvents().
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/HideRoomWidgetEvent.as
 */
export class HideRoomWidgetEvent
{
    // AS3: HideRoomWidgetEvent.as::HIDE_ROOM_WIDGET
    static readonly HIDE_ROOM_WIDGET: string = 'hrwe_hide_room_widget';

    // AS3: HideRoomWidgetEvent.as::type
    readonly type: string = HideRoomWidgetEvent.HIDE_ROOM_WIDGET;

    // AS3: HideRoomWidgetEvent.as::widgetType
    readonly widgetType: string;

    // AS3: HideRoomWidgetEvent.as::HideRoomWidgetEvent()
    constructor(widgetType: string)
    {
        this.widgetType = widgetType;
    }
}
