import type {IRoomSession} from '../IRoomSession';

/**
 * Room session event
 *
 * Based on AS3: com.sulake.habbo.session.events.RoomSessionEvent
 */
export class RoomSessionEvent
{
    public static readonly RSE_CREATED = 'RSE_CREATED';
    public static readonly RSE_STARTED = 'RSE_STARTED';
    public static readonly RSE_ENDED = 'RSE_ENDED';
    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionEvent.as::SESSION_ROOM_DATA
    public static readonly SESSION_ROOM_DATA = 'RSE_ROOM_DATA';

    constructor(type: string, session: IRoomSession, openLandingPage: boolean = true)
    {
        this._type = type;
        this._session = session;
        this._openLandingPage = openLandingPage;
    }

    private _type: string;

    get type(): string
    {
        return this._type;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/RoomSessionEvent.as::_session
    private _session: IRoomSession;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionEvent.as::get session()
    get session(): IRoomSession
    {
        return this._session;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/RoomSessionEvent.as::_openLandingPage
    private _openLandingPage: boolean;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionEvent.as::get openLandingPage()
    get openLandingPage(): boolean
    {
        return this._openLandingPage;
    }
}
