import type {IRoomSession} from '../IRoomSession';
import {RoomSessionEvent} from './RoomSessionEvent';
import type {IUserData} from "../IUserData";

/**
 * Room session user data update event
 *
 * Based on AS3: com.sulake.habbo.session.events.RoomSessionUserDataUpdateEvent
 */
export class RoomSessionUserDataUpdateEvent extends RoomSessionEvent
{
    public static readonly RSUDUE_USER_DATA_UPDATE = 'RSUDUE_USER_DATA_UPDATE';

    constructor(session: IRoomSession, addedUsers: IUserData[] = [])
    {
        super(RoomSessionUserDataUpdateEvent.RSUDUE_USER_DATA_UPDATE, session);
        this._addedUsers = addedUsers;
    }

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionUserDataUpdateEvent.as::_addedUsers
    private _addedUsers: IUserData[];

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionUserDataUpdateEvent.as::get addedUsers()
    get addedUsers(): IUserData[]
    {
        return this._addedUsers;
    }
}
