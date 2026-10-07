/**
 * RoomObjectGroupBadgeUpdateMessage
 *
 * @see source_as_win63/habbo/room/messages/RoomObjectGroupBadgeUpdateMessage.as
 *
 * Update message for group badge assets on room objects.
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';

export class RoomObjectGroupBadgeUpdateMessage extends RoomObjectUpdateMessage
{
    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectGroupBadgeUpdateMessage.as::BADGE_LOADED
    public static readonly BADGE_LOADED = 'ROGBUM_BADGE_LOADED';

    constructor(badgeId: string, assetName: string)
    {
        super(null, null);
        this._badgeId = badgeId;
        this._assetName = assetName;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectGroupBadgeUpdateMessage.as::_badgeId
    private _badgeId: string;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectGroupBadgeUpdateMessage.as::get badgeId()
    get badgeId(): string
    {
        return this._badgeId;
    }

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectGroupBadgeUpdateMessage.as::_assetName
    private _assetName: string;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectGroupBadgeUpdateMessage.as::get assetName()
    get assetName(): string
    {
        return this._assetName;
    }
}
