/**
 * RoomObjectWidgetRequestEvent
 *
 * Based on AS3: com.sulake.habbo.room.events.RoomObjectWidgetRequestEvent
 *
 * Event dispatched to request opening/closing widgets for room objects.
 */
import {RoomObjectEvent} from '@room/events/RoomObjectEvent';
import type {IRoomObject} from '@room/object/IRoomObject';

export class RoomObjectWidgetRequestEvent extends RoomObjectEvent
{
    public static readonly ROWRE_OPEN_WIDGET = 'ROWRE_OPEN_WIDGET';
    public static readonly ROWRE_CLOSE_WIDGET = 'ROWRE_CLOSE_WIDGET';
    public static readonly ROWRE_OPEN_FURNI_CONTEXT_MENU = 'ROWRE_OPEN_FURNI_CONTEXT_MENU';
    public static readonly ROWRE_CLOSE_FURNI_CONTEXT_MENU = 'ROWRE_CLOSE_FURNI_CONTEXT_MENU';
    public static readonly ROWRE_PLACEHOLDER = 'ROWRE_PLACEHOLDER';
    public static readonly ROWRE_CREDITFURNI = 'ROWRE__CREDITFURNI';
    public static readonly ROWRE_STICKIE = 'ROWRE__STICKIE';
    public static readonly ROWRE_PRESENT = 'ROWRE_PRESENT';
    public static readonly ROWRE_TROPHY = 'ROWRE_TROPHY';
    public static readonly ROWRE_TEASER = 'ROWRE_TEASER';
    public static readonly ROWRE_ECOTRONBOX = 'ROWRE_ECOTRONBOX';
    public static readonly ROWRE_DIMMER = 'ROWRE_DIMMER';
    public static readonly ROWRE_REMOVE_DIMMER = 'ROWRE_WIDGET_REMOVE_DIMMER';
    public static readonly ROWRE_CLOTHING_CHANGE = 'ROWRE_CLOTHING_CHANGE';
    public static readonly ROWRE_MANNEQUIN = 'ROWRE_MANNEQUIN';
    public static readonly ROWRE_PET_PRODUCT_MENU = 'ROWRE_PET_PRODUCT_MENU';
    public static readonly ROWRE_GUILD_FURNI_CONTEXT_MENU = 'ROWRE_GUILD_FURNI_CONTEXT_MENU';
    public static readonly ROWRE_MONSTERPLANT_SEED_PLANT_CONFIRMATION_DIALOG = 'ROWRE_MONSTERPLANT_SEED_PLANT_CONFIRMATION_DIALOG';
    public static readonly ROWRE_PURCHASABLE_CLOTHING_CONFIRMATION_DIALOG = 'ROWRE_PURCHASABLE_CLOTHING_CONFIRMATION_DIALOG';
    public static readonly ROWRE_BACKGROUND_COLOR = 'ROWRE_BACKGROUND_COLOR';
    public static readonly ROWRE_HIDE_AREA = 'ROWRE_HIDE_AREA';

    public static readonly ROWRE_EFFECTBOX_OPEN_DIALOG = 'ROWRE_EFFECTBOX_OPEN_DIALOG';

    public static readonly ROWRE_ACHIEVEMENT_RESOLUTION_OPEN = 'ROWRE_ACHIEVEMENT_RESOLUTION_OPEN';
    public static readonly ROWRE_ACHIEVEMENT_RESOLUTION_ENGRAVING = 'ROWRE_ACHIEVEMENT_RESOLUTION_ENGRAVING';
    public static readonly ROWRE_ACHIEVEMENT_RESOLUTION_FAILED = 'ROWRE_ACHIEVEMENT_RESOLUTION_FAILED';
    public static readonly ROWRE_FRIEND_FURNITURE_CONFIRM = 'ROWRE_FRIEND_FURNITURE_CONFIRM';
    public static readonly ROWRE_FRIEND_FURNITURE_ENGRAVING = 'ROWRE_FRIEND_FURNITURE_ENGRAVING';
    public static readonly ROWRE_BADGE_DISPLAY_ENGRAVING = 'ROWRE_BADGE_DISPLAY_ENGRAVING';
    public static readonly ROWRE_HIGH_SCORE_DISPLAY = 'ROWRE_HIGH_SCORE_DISPLAY';
    public static readonly ROWRE_HIDE_HIGH_SCORE_DISPLAY = 'ROWRE_HIDE_HIGH_SCORE_DISPLAY';
    public static readonly ROWRE_INTERNAL_LINK = 'ROWRE_INTERNAL_LINK';
    public static readonly ROWRE_ROOM_LINK = 'ROWRE_ROOM_LINK';

    constructor(type: string, object: IRoomObject | null)
    {
        super(type, object);
    }
}
