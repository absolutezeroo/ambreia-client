/**
 * RoomEngineToWidgetEvent
 *
 * @see source_as_win63/habbo/room/events/RoomEngineToWidgetEvent.as
 *
 * Event dispatched from room engine to request widget operations.
 */
import {RoomEngineObjectEvent} from './RoomEngineObjectEvent';

export class RoomEngineToWidgetEvent extends RoomEngineObjectEvent
{
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineToWidgetEvent.as::REQUEST_OPEN_WIDGET
    public static readonly REQUEST_OPEN_WIDGET = 'RETWE_OPEN_WIDGET';
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineToWidgetEvent.as::REQUEST_CLOSE_WIDGET
    public static readonly REQUEST_CLOSE_WIDGET = 'RETWE_CLOSE_WIDGET';
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineToWidgetEvent.as::REQUEST_OPEN_FURNI_CONTEXT_MENU
    public static readonly REQUEST_OPEN_FURNI_CONTEXT_MENU = 'RETWE_OPEN_FURNI_CONTEXT_MENU';
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineToWidgetEvent.as::REQUEST_CLOSE_FURNI_CONTEXT_MENU
    public static readonly REQUEST_CLOSE_FURNI_CONTEXT_MENU = 'RETWE_CLOSE_FURNI_CONTEXT_MENU';
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineToWidgetEvent.as::REQUEST_PLACEHOLDER
    public static readonly REQUEST_PLACEHOLDER = 'RETWE_REQUEST_PLACEHOLDER';
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineToWidgetEvent.as::REQUEST_CREDITFURNI
    public static readonly REQUEST_CREDITFURNI = 'RETWE_REQUEST_CREDITFURNI';
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineToWidgetEvent.as::REQUEST_STICKIE
    public static readonly REQUEST_STICKIE = 'RETWE_REQUEST_STICKIE';
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineToWidgetEvent.as::REQUEST_PRESENT
    public static readonly REQUEST_PRESENT = 'RETWE_REQUEST_PRESENT';
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineToWidgetEvent.as::REQUEST_TROPHY
    public static readonly REQUEST_TROPHY = 'RETWE_REQUEST_TROPHY';
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineToWidgetEvent.as::REQUEST_TEASER
    public static readonly REQUEST_TEASER = 'RETWE_REQUEST_TEASER';
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineToWidgetEvent.as::REQUEST_ECOTRONBOX
    public static readonly REQUEST_ECOTRONBOX = 'RETWE_REQUEST_ECOTRONBOX';
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineToWidgetEvent.as::REQUEST_DIMMER
    public static readonly REQUEST_DIMMER = 'RETWE_REQUEST_DIMMER';
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineToWidgetEvent.as::REMOVE_DIMMER
    public static readonly REMOVE_DIMMER = 'RETWE_REMOVE_DIMMER';
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineToWidgetEvent.as::REQUEST_CLOTHING_CHANGE
    public static readonly REQUEST_CLOTHING_CHANGE = 'RETWE_REQUEST_CLOTHING_CHANGE';
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineToWidgetEvent.as::REQUEST_MANNEQUIN
    public static readonly REQUEST_MANNEQUIN = 'RETWE_REQUEST_MANNEQUIN';
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineToWidgetEvent.as::REQUEST_PURCHASABLE_CLOTHING_CONFIRMATION_DIALOG
    public static readonly REQUEST_PURCHASABLE_CLOTHING_CONFIRMATION_DIALOG = 'ROWRE_REQUEST_PURCHASABLE_CLOTHING_CONFIRMATION_DIALOG';
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineToWidgetEvent.as::REQUEST_BACKGROUND_COLOR
    public static readonly REQUEST_BACKGROUND_COLOR = 'RETWE_REQUEST_BACKGROUND_COLOR';
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineToWidgetEvent.as::REQUEST_AREA_HIDE
    public static readonly REQUEST_AREA_HIDE = 'RETWE_REQUEST_AREA_HIDE';
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineToWidgetEvent.as::REQUEST_EFFECTBOX_OPEN_DIALOG
    public static readonly REQUEST_EFFECTBOX_OPEN_DIALOG = 'RETWE_REQUEST_EFFECTBOX_OPEN_DIALOG';
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineToWidgetEvent.as::REQUEST_ACHIEVEMENT_RESOLUTION_ENGRAVING
    public static readonly REQUEST_ACHIEVEMENT_RESOLUTION_ENGRAVING = 'RETWE_REQUEST_ACHIEVEMENT_RESOLUTION_ENGRAVING';
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineToWidgetEvent.as::REQUEST_ACHIEVEMENT_RESOLUTION_FAILED
    public static readonly REQUEST_ACHIEVEMENT_RESOLUTION_FAILED = 'RETWE_REQUEST_ACHIEVEMENT_RESOLUTION_FAILED';
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineToWidgetEvent.as::REQUEST_FRIEND_FURNITURE_CONFIRM
    public static readonly REQUEST_FRIEND_FURNITURE_CONFIRM = 'RETWE_REQUEST_FRIEND_FURNITURE_CONFIRM';
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineToWidgetEvent.as::REQUEST_FRIEND_FURNITURE_ENGRAVING
    public static readonly REQUEST_FRIEND_FURNITURE_ENGRAVING = 'RETWE_REQUEST_FRIEND_FURNITURE_ENGRAVING';
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineToWidgetEvent.as::REQUEST_BADGE_DISPLAY_ENGRAVING
    public static readonly REQUEST_BADGE_DISPLAY_ENGRAVING = 'RETWE_REQUEST_BADGE_DISPLAY_ENGRAVING';
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineToWidgetEvent.as::REQUEST_HIGH_SCORE_DISPLAY
    public static readonly REQUEST_HIGH_SCORE_DISPLAY = 'RETWE_REQUEST_HIGH_SCORE_DISPLAY';
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineToWidgetEvent.as::REQUEST_HIDE_HIGH_SCORE_DISPLAY
    public static readonly REQUEST_HIDE_HIGH_SCORE_DISPLAY = 'RETWE_REQUEST_HIDE_HIGH_SCORE_DISPLAY';
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineToWidgetEvent.as::REQUEST_INTERNAL_LINK
    public static readonly REQUEST_INTERNAL_LINK = 'RETWE_REQUEST_INTERNAL_LINK';
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineToWidgetEvent.as::REQUEST_ROOM_LINK
    public static readonly REQUEST_ROOM_LINK = 'RETWE_REQUEST_ROOM_LINK';

    constructor(
        type: string,
        roomId: number,
        objectId: number,
        category: number,
        widget: string | null = null
    )
    {
        super(type, roomId, objectId, category);
        this._widget = widget;
    }

    private _widget: string | null;

    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineToWidgetEvent.as::get widget()
    get widget(): string | null
    {
        return this._widget;
    }

    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineToWidgetEvent.as::get contextMenu()
    get contextMenu(): string | null
    {
        return this._widget;
    }
}
