/**
 * RoomObjectBadgeAssetEvent
 *
 * @see source_as_win63/habbo/room/events/RoomObjectBadgeAssetEvent.as
 *
 * Event dispatched to request loading a badge asset for a room object.
 */
import {RoomObjectEvent} from '../../events/RoomObjectEvent';
import type {IRoomObject} from '../../object/IRoomObject';

export class RoomObjectBadgeAssetEvent extends RoomObjectEvent
{
    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectBadgeAssetEvent.as::LOAD_BADGE
    public static readonly LOAD_BADGE = 'ROGBE_LOAD_BADGE';

    constructor(type: string, object: IRoomObject, badgeId: string, groupBadge: boolean = true)
    {
        super(type, object);
        this._badgeId = badgeId;
        this._groupBadge = groupBadge;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/events/RoomObjectBadgeAssetEvent.as::_badgeId
    private _badgeId: string;

    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectBadgeAssetEvent.as::get badgeId()
    get badgeId(): string
    {
        return this._badgeId;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/events/RoomObjectBadgeAssetEvent.as::_groupBadge
    private _groupBadge: boolean;

    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectBadgeAssetEvent.as::get groupBadge()
    get groupBadge(): boolean
    {
        return this._groupBadge;
    }
}
