/**
 * RoomWidgetMessage
 *
 * @see sources/win63_version/habbo/ui/widget/messages/RoomWidgetMessage.as
 *
 * Base class for widget messages sent from a widget to its message listener
 * (the room desktop), which routes them to the widget's handler by `type`.
 */
export class RoomWidgetMessage
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetMessage.as::WIDGET_MESSAGE_TEST
    public static readonly WIDGET_MESSAGE_TEST: string = 'RWM_MESSAGE_TEST';

    private _type: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetMessage.as::RoomWidgetMessage()
    constructor(type: string)
    {
        this._type = type;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetMessage.as::get type()
    public get type(): string
    {
        return this._type;
    }
}
