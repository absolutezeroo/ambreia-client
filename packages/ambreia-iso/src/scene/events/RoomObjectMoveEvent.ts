/**
 * RoomObjectMoveEvent
 *
 * Based on AS3: com.sulake.habbo.room.events.RoomObjectMoveEvent
 *
 * Event emitted when room objects move or slide.
 */
import {RoomObjectEvent} from '../../events/RoomObjectEvent';
import type {IRoomObject} from '../../object/IRoomObject';

export class RoomObjectMoveEvent extends RoomObjectEvent
{
    public static readonly ROME_SLIDE_ANIMATION = 'ROME_SLIDE_ANIMATION';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/events/RoomObjectMoveEvent.as::ROME_POSITION_CHANGED
    public static readonly ROME_POSITION_CHANGED = 'ROME_POSITION_CHANGED';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/events/RoomObjectMoveEvent.as::ROME_OBJECT_REMOVED
    public static readonly ROME_OBJECT_REMOVED = 'ROME_OBJECT_REMOVED';

    constructor(type: string, object: IRoomObject | null)
    {
        super(type, object);
    }
}
