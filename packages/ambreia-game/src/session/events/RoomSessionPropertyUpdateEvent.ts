import type {IRoomSession} from '../IRoomSession';
import {RoomSessionEvent} from './RoomSessionEvent';

/**
 * Room session property update event
 *
 * Based on AS3: com.sulake.habbo.session.events.RoomSessionPropertyUpdateEvent
 */
export class RoomSessionPropertyUpdateEvent extends RoomSessionEvent
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/RoomSessionPropertyUpdateEvent.as::RSDUE_ALLOW_PETS
    public static readonly RSDUE_ALLOW_PETS = 'RSDUE_ALLOW_PETS';
    public static readonly RSDUE_SETTINGS = 'RSDUE_SETTINGS';

    constructor(type: string, session: IRoomSession)
    {
        super(type, session);
    }
}
