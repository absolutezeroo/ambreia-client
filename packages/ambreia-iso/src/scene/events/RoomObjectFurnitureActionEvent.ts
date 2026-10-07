/**
 * RoomObjectFurnitureActionEvent
 *
 * Based on AS3: com.sulake.habbo.room.events.RoomObjectFurnitureActionEvent
 *
 * Event dispatched for furniture actions (mouse button/arrow changes).
 */
import {RoomObjectEvent} from '../../events/RoomObjectEvent';
import type {IRoomObject} from '../../object/IRoomObject';

export class RoomObjectFurnitureActionEvent extends RoomObjectEvent
{
    public static readonly ROFCAE_DICE_OFF = 'ROFCAE_DICE_OFF';
    public static readonly ROFCAE_DICE_ACTIVATE = 'ROFCAE_DICE_ACTIVATE';
    public static readonly ROFCAE_USE_HABBOWHEEL = 'ROFCAE_USE_HABBOWHEEL';
    public static readonly ROFCAE_STICKIE = 'ROFCAE_STICKIE';
    public static readonly ROFCAE_ENTER_ONEWAYDOOR = 'ROFCAE_ENTER_ONEWAYDOOR';
    public static readonly ROFCAE_MOUSE_BUTTON = 'ROFCAE_MOUSE_BUTTON';
    public static readonly ROFCAE_MOUSE_ARROW = 'ROFCAE_MOUSE_ARROW';

    constructor(type: string, object: IRoomObject | null)
    {
        super(type, object);
    }
}
