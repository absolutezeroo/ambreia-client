/**
 * RoomWidgetFurniToWidgetMessage
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetFurniToWidgetMessage.as
 *
 * Sent by RoomDesktop when the room engine reports that a furni wants to open its
 * widget (a `RETWE_REQUEST_*` event). Carries only the object identity; the handler
 * that claims the message type reads the object's model out of the room engine itself.
 */
import {RoomWidgetMessage} from './RoomWidgetMessage';

export class RoomWidgetFurniToWidgetMessage extends RoomWidgetMessage
{
    // AS3: RoomWidgetFurniToWidgetMessage.as::WIDGET_MESSAGE_REQUEST_CREDITFURNI_WIDGET
    public static readonly WIDGET_MESSAGE_REQUEST_CREDITFURNI_WIDGET: string = 'RWFWM_MESSAGE_REQUEST_CREDITFURNI';

    // AS3: RoomWidgetFurniToWidgetMessage.as::WIDGET_MESSAGE_REQUEST_STICKIE_WIDGET
    public static readonly WIDGET_MESSAGE_REQUEST_STICKIE_WIDGET: string = 'RWFWM_MESSAGE_REQUEST_STICKIE';

    // AS3: RoomWidgetFurniToWidgetMessage.as::WIDGET_MESSAGE_REQUEST_PRESENT_WIDGET
    public static readonly WIDGET_MESSAGE_REQUEST_PRESENT_WIDGET: string = 'RWFWM_MESSAGE_REQUEST_PRESENT';

    // AS3: RoomWidgetFurniToWidgetMessage.as::WIDGET_MESSAGE_REQUEST_TROPHY_WIDGET
    public static readonly WIDGET_MESSAGE_REQUEST_TROPHY_WIDGET: string = 'RWFWM_MESSAGE_REQUEST_TROPHY';

    // AS3: RoomWidgetFurniToWidgetMessage.as::WIDGET_MESSAGE_REQUEST_TEASER_WIDGET
    public static readonly WIDGET_MESSAGE_REQUEST_TEASER_WIDGET: string = 'RWFWM_MESSAGE_REQUEST_TEASER';

    // AS3: RoomWidgetFurniToWidgetMessage.as::WIDGET_MESSAGE_REQUEST_ECOTRONBOX_WIDGET
    public static readonly WIDGET_MESSAGE_REQUEST_ECOTRONBOX_WIDGET: string = 'RWFWM_MESSAGE_REQUEST_ECOTRONBOX';

    // AS3: RoomWidgetFurniToWidgetMessage.as::WIDGET_MESSAGE_REQUEST_DIMMER_WIDGET
    public static readonly WIDGET_MESSAGE_REQUEST_DIMMER_WIDGET: string = 'RWFWM_MESSAGE_REQUEST_DIMMER';

    // AS3: RoomWidgetFurniToWidgetMessage.as::WIDGET_MESSAGE_REQUEST_PLACEHOLDER_WIDGET
    public static readonly WIDGET_MESSAGE_REQUEST_PLACEHOLDER_WIDGET: string = 'RWFWM_MESSAGE_REQUEST_PLACEHOLDER';

    // AS3: RoomWidgetFurniToWidgetMessage.as::WIDGET_MESSAGE_REQUEST_CLOTHING_CHANGE_WIDGET
    public static readonly WIDGET_MESSAGE_REQUEST_CLOTHING_CHANGE_WIDGET: string = 'RWFWM_MESSAGE_REQUEST_CLOTHING_CHANGE';

    // AS3: RoomWidgetFurniToWidgetMessage.as::WIDGET_MESSAGE_REQUEST_ACHIEVEMENT_RESOLUTION_ENGRAVING
    public static readonly WIDGET_MESSAGE_REQUEST_ACHIEVEMENT_RESOLUTION_ENGRAVING: string = 'RWFWM_WIDGET_MESSAGE_REQUEST_ACHIEVEMENT_RESOLUTION_ENGRAVING';

    /**
     * AS3: RoomWidgetFurniToWidgetMessage.as::_SafeStr_10530
     *
     * Obfuscated in every available tree, so the member name is DERIVED from its value
     * ("RWFWM_WIDGET_MESSAGE_REQUEST_ACHIEVEMENT_RESOLUTION_FAILED") rather than recovered.
     */
    // AS3: RoomWidgetFurniToWidgetMessage.as::_SafeStr_10530
    public static readonly WIDGET_MESSAGE_REQUEST_ACHIEVEMENT_RESOLUTION_FAILED: string = 'RWFWM_WIDGET_MESSAGE_REQUEST_ACHIEVEMENT_RESOLUTION_FAILED';

    // AS3: RoomWidgetFurniToWidgetMessage.as::WIDGET_MESSAGE_REQUEST_BADGE_DISPLAY_ENGRAVING
    public static readonly WIDGET_MESSAGE_REQUEST_BADGE_DISPLAY_ENGRAVING: string = 'RWFWM_WIDGET_MESSAGE_REQUEST_BADGE_DISPLAY_ENGRAVING';

    // AS3: RoomWidgetFurniToWidgetMessage.as::_SafeStr_4872
    private _id: number = 0;

    // AS3: RoomWidgetFurniToWidgetMessage.as::_SafeStr_4689
    private _category: number = 0;

    // AS3: RoomWidgetFurniToWidgetMessage.as::_SafeStr_6722
    private _roomId: number = 0;

    // AS3: RoomWidgetFurniToWidgetMessage.as::RoomWidgetFurniToWidgetMessage()
    constructor(type: string, id: number, category: number, roomId: number)
    {
        super(type);

        this._id = id;
        this._category = category;
        this._roomId = roomId;
    }

    // AS3: RoomWidgetFurniToWidgetMessage.as::get id()
    public get id(): number
    {
        return this._id;
    }

    // AS3: RoomWidgetFurniToWidgetMessage.as::get category()
    public get category(): number
    {
        return this._category;
    }

    // AS3: RoomWidgetFurniToWidgetMessage.as::get roomId()
    public get roomId(): number
    {
        return this._roomId;
    }
}
