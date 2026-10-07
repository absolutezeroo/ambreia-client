import type {IRoomSession} from '../IRoomSession';
import {RoomSessionEvent} from './RoomSessionEvent';

/**
 * Room session favourite group update event
 *
 * @see source_as_win63/habbo/session/events/RoomSessionFavouriteGroupUpdateEvent.as
 */
export class RoomSessionFavouriteGroupUpdateEvent extends RoomSessionEvent
{
    public static readonly FAVOURITE_GROUP_UPDATE = 'rsfgue_favourite_group_update';

    constructor(session: IRoomSession, roomIndex: number, habboGroupId: number, status: number, habboGroupName: string)
    {
        super(RoomSessionFavouriteGroupUpdateEvent.FAVOURITE_GROUP_UPDATE, session);
        this._roomIndex = roomIndex;
        this._habboGroupId = habboGroupId;
        this._status = status;
        this._habboGroupName = habboGroupName;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/RoomSessionFavouriteGroupUpdateEvent.as::_roomIndex
    private _roomIndex: number;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionFavouriteGroupUpdateEvent.as::get roomIndex()
    get roomIndex(): number
    {
        return this._roomIndex;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/RoomSessionFavouriteGroupUpdateEvent.as::_habboGroupId
    private _habboGroupId: number;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionFavouriteGroupUpdateEvent.as::get habboGroupId()
    get habboGroupId(): number
    {
        return this._habboGroupId;
    }

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionFavouriteGroupUpdateEvent.as::_status
    private _status: number;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionFavouriteGroupUpdateEvent.as::get status()
    get status(): number
    {
        return this._status;
    }

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionFavouriteGroupUpdateEvent.as::_habboGroupName
    private _habboGroupName: string;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionFavouriteGroupUpdateEvent.as::get habboGroupName()
    get habboGroupName(): string
    {
        return this._habboGroupName;
    }
}
