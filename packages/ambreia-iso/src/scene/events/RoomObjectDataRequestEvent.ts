/**
 * RoomObjectDataRequestEvent
 *
 * @see source_as_win63/habbo/room/events/RoomObjectDataRequestEvent.as
 *
 * Event dispatched to request data for a room object (current user ID, URL prefix).
 */
import {RoomObjectEvent} from '../../events/RoomObjectEvent';
import type {IRoomObject} from '../../object/IRoomObject';

export class RoomObjectDataRequestEvent extends RoomObjectEvent
{
    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectDataRequestEvent.as::CURRENT_USER_ID
    public static readonly CURRENT_USER_ID = 'RODRE_CURRENT_USER_ID';
    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectDataRequestEvent.as::URL_PREFIX
    public static readonly URL_PREFIX = 'RODRE_URL_PREFIX';

    constructor(type: string, object: IRoomObject)
    {
        super(type, object);
    }
}
