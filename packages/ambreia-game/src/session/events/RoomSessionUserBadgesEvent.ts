import type {IRoomSession} from '../IRoomSession';
import {RoomSessionEvent} from './RoomSessionEvent';

/**
 * Room session user badges event
 *
 * Based on AS3: com.sulake.habbo.session.events.RoomSessionUserBadgesEvent
 */
export class RoomSessionUserBadgesEvent extends RoomSessionEvent
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/RoomSessionUserBadgesEvent.as::RSUBE_BADGES
    public static readonly RSUBE_BADGES = 'RSUBE_BADGES';

    constructor(session: IRoomSession, userId: number, badges: string[])
    {
        super(RoomSessionUserBadgesEvent.RSUBE_BADGES, session);
        this._userId = userId;
        this._badges = badges;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/RoomSessionUserBadgesEvent.as::_userId
    private _userId: number;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionUserBadgesEvent.as::get userId()
    get userId(): number
    {
        return this._userId;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/RoomSessionUserBadgesEvent.as::_badges
    private _badges: string[];

    // AS3: sources/win63_version/habbo/session/events/RoomSessionUserBadgesEvent.as::get badges()
    get badges(): string[]
    {
        return this._badges;
    }
}
