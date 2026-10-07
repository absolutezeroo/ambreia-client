/**
 * RoomObjectFloorHoleEvent
 *
 * @see source_as_win63/habbo/room/events/RoomObjectFloorHoleEvent.as
 *
 * Event dispatched when floor holes are added or removed (e.g. for roller holes).
 */
import {RoomObjectEvent} from '../../events/RoomObjectEvent';
import type {IRoomObject} from '../../object/IRoomObject';

export class RoomObjectFloorHoleEvent extends RoomObjectEvent
{
    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectFloorHoleEvent.as::ADD_HOLE
    public static readonly ADD_HOLE = 'ROFHO_ADD_HOLE';
    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectFloorHoleEvent.as::REMOVE_HOLE
    public static readonly REMOVE_HOLE = 'ROFHO_REMOVE_HOLE';

    constructor(type: string, object: IRoomObject)
    {
        super(type, object);
    }
}
