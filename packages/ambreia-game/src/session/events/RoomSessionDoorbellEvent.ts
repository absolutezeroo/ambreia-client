import type {IRoomSession} from '../IRoomSession';
import {RoomSessionEvent} from './RoomSessionEvent';

/**
 * Room session doorbell event
 *
 * Based on AS3: com.sulake.habbo.session.events.RoomSessionDoorbellEvent
 */
export class RoomSessionDoorbellEvent extends RoomSessionEvent
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/RoomSessionDoorbellEvent.as::RSDE_DOORBELL
    public static readonly RSDE_DOORBELL = 'RSDE_DOORBELL';
    public static readonly RSDE_REJECTED = 'RSDE_REJECTED';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/RoomSessionDoorbellEvent.as::RSDE_ACCEPTED
    public static readonly RSDE_ACCEPTED = 'RSDE_ACCEPTED';

    constructor(type: string, session: IRoomSession, userName: string, openLandingPage: boolean = false)
    {
        super(type, session, openLandingPage);
        this._userName = userName;
    }

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionDoorbellEvent.as::_userName
    private _userName: string;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionDoorbellEvent.as::get userName()
    get userName(): string
    {
        return this._userName;
    }
}
