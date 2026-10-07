import type {IRoomSession} from '../IRoomSession';
import {RoomSessionEvent} from './RoomSessionEvent';

/**
 * Room session dance event
 *
 * Based on AS3: com.sulake.habbo.session.events.RoomSessionDanceEvent
 */
export class RoomSessionDanceEvent extends RoomSessionEvent
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/RoomSessionDanceEvent.as::RSDE_DANCE
    public static readonly RSDE_DANCE = 'RSDE_DANCE';

    constructor(session: IRoomSession, userId: number, danceStyle: number)
    {
        super(RoomSessionDanceEvent.RSDE_DANCE, session);
        this._userId = userId;
        this._danceStyle = danceStyle;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/RoomSessionDanceEvent.as::_userId
    private _userId: number;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionDanceEvent.as::get userId()
    get userId(): number
    {
        return this._userId;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/RoomSessionDanceEvent.as::_danceStyle
    private _danceStyle: number;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionDanceEvent.as::get danceStyle()
    get danceStyle(): number
    {
        return this._danceStyle;
    }
}
