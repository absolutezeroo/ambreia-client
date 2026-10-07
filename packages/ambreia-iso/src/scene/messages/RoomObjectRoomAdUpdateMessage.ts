/**
 * RoomObjectRoomAdUpdateMessage
 *
 * @see source_as_win63/habbo/room/messages/RoomObjectRoomAdUpdateMessage.as
 *
 * Update message for room advertisement data.
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';

export class RoomObjectRoomAdUpdateMessage extends RoomObjectUpdateMessage
{
    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomAdUpdateMessage.as::ROOM_AD_ACTIVATE
    public static readonly ROOM_AD_ACTIVATE = 'RORUM_ROOM_AD_ACTIVATE';
    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomAdUpdateMessage.as::ROOM_BILLBOARD_IMAGE_LOADED
    public static readonly ROOM_BILLBOARD_IMAGE_LOADED = 'RORUM_ROOM_BILLBOARD_IMAGE_LOADED';
    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomAdUpdateMessage.as::ROOM_BILLBOARD_LOADING_FAILED
    public static readonly ROOM_BILLBOARD_LOADING_FAILED = 'RORUM_ROOM_BILLBOARD_IMAGE_LOADING_FAILED';

    constructor(
        type: string,
        asset: string,
        clickUrl: string,
        objectId: number = -1,
        bitmapData: ImageBitmap | null = null
    )
    {
        super(null, null);
        this._type = type;
        this._asset = asset;
        this._clickUrl = clickUrl;
        this._objectId = objectId;
        this._bitmapData = bitmapData;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectRoomAdUpdateMessage.as::_type
    private _type: string;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomAdUpdateMessage.as::get type()
    get type(): string
    {
        return this._type;
    }

    // AS3: sources/win63_version/habbo/room/messages/RoomObjectRoomAdUpdateMessage.as::_asset
    private _asset: string;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomAdUpdateMessage.as::get asset()
    get asset(): string
    {
        return this._asset;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectRoomAdUpdateMessage.as::_clickUrl
    private _clickUrl: string;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomAdUpdateMessage.as::get clickUrl()
    get clickUrl(): string
    {
        return this._clickUrl;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectRoomAdUpdateMessage.as::_objectId
    private _objectId: number;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomAdUpdateMessage.as::get objectId()
    get objectId(): number
    {
        return this._objectId;
    }

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomAdUpdateMessage.as::_bitmapData
    private _bitmapData: ImageBitmap | null;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomAdUpdateMessage.as::get bitmapData()
    get bitmapData(): ImageBitmap | null
    {
        return this._bitmapData;
    }
}
