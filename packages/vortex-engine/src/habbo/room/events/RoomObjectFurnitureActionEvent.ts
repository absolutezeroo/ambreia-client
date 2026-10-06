/**
 * RoomObjectFurnitureActionEvent
 *
 * Based on AS3: com.sulake.habbo.room.events.RoomObjectFurnitureActionEvent
 *
 * Event dispatched for furniture actions (mouse button/arrow changes).
 */
import {RoomObjectEvent} from '@room/events/RoomObjectEvent';
import type {IRoomObject} from '@room/object/IRoomObject';

export class RoomObjectFurnitureActionEvent extends RoomObjectEvent
{
    public static readonly ROFCAE_DICE_OFF = 'ROFCAE_DICE_OFF';
    public static readonly ROFCAE_DICE_ACTIVATE = 'ROFCAE_DICE_ACTIVATE';
    public static readonly ROFCAE_USE_HABBOWHEEL = 'ROFCAE_USE_HABBOWHEEL';
    public static readonly ROFCAE_STICKIE = 'ROFCAE_STICKIE';
    public static readonly ROFCAE_ENTER_ONEWAYDOOR = 'ROFCAE_ENTER_ONEWAYDOOR';
    public static readonly ROFCAE_SOUND_MACHINE_INIT = 'ROFCAE_SOUND_MACHINE_INIT';
    public static readonly ROFCAE_SOUND_MACHINE_START = 'ROFCAE_SOUND_MACHINE_START';
    public static readonly ROFCAE_SOUND_MACHINE_STOP = 'ROFCAE_SOUND_MACHINE_STOP';
    public static readonly ROFCAE_SOUND_MACHINE_DISPOSE = 'ROFCAE_SOUND_MACHINE_DISPOSE';
    public static readonly ROFCAE_JUKEBOX_INIT = 'ROFCAE_JUKEBOX_INIT';
    public static readonly ROFCAE_JUKEBOX_START = 'ROFCAE_JUKEBOX_START';
    public static readonly ROFCAE_JUKEBOX_MACHINE_STOP = 'ROFCAE_JUKEBOX_MACHINE_STOP';
    public static readonly ROFCAE_JUKEBOX_DISPOSE = 'ROFCAE_JUKEBOX_DISPOSE';
    public static readonly ROFCAE_MOUSE_BUTTON = 'ROFCAE_MOUSE_BUTTON';
    public static readonly ROFCAE_MOUSE_ARROW = 'ROFCAE_MOUSE_ARROW';

    constructor(type: string, object: IRoomObject | null)
    {
        super(type, object);
    }
}
