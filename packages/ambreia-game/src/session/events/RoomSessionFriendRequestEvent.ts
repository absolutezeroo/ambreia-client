import type {IRoomSession} from '../IRoomSession';
import {RoomSessionEvent} from './RoomSessionEvent';

/**
 * Room session friend request event
 *
 * @see source_as_win63/habbo/session/events/RoomSessionFriendRequestEvent.as
 */
export class RoomSessionFriendRequestEvent extends RoomSessionEvent
{
    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionFriendRequestEvent.as::FRIEND_REQUEST
    public static readonly FRIEND_REQUEST = 'RSFRE_FRIEND_REQUEST';

    constructor(session: IRoomSession, requestId: number, userId: number, userName: string, openLandingPage: boolean = false)
    {
        super(RoomSessionFriendRequestEvent.FRIEND_REQUEST, session, openLandingPage);
        this._requestId = requestId;
        this._userId = userId;
        this._userName = userName;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/RoomSessionFriendRequestEvent.as::_requestId
    private _requestId: number;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionFriendRequestEvent.as::get requestId()
    get requestId(): number
    {
        return this._requestId;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/RoomSessionFriendRequestEvent.as::_userId
    private _userId: number;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionFriendRequestEvent.as::get userId()
    get userId(): number
    {
        return this._userId;
    }

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionFriendRequestEvent.as::_userName
    private _userName: string;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionFriendRequestEvent.as::get userName()
    get userName(): string
    {
        return this._userName;
    }
}
