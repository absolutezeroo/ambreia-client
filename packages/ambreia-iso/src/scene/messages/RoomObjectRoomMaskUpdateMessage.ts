/**
 * RoomObjectRoomMaskUpdateMessage
 *
 * @see source_as_win63/habbo/room/messages/RoomObjectRoomMaskUpdateMessage.as
 *
 * Update message for room masks (doors, windows, holes).
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';
import type {IVector3d} from '../../utils/IVector3d';
import {Vector3d} from '../../utils/Vector3d';

export class RoomObjectRoomMaskUpdateMessage extends RoomObjectUpdateMessage
{
    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomMaskUpdateMessage.as::ADD_MASK
    public static readonly ADD_MASK = 'RORMUM_ADD_MASK';
    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomMaskUpdateMessage.as::REMOVE_MASK
    public static readonly REMOVE_MASK = 'RORMUM_REMOVE_MASK';
    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomMaskUpdateMessage.as::MASK_TYPE_DOOR
    public static readonly MASK_TYPE_DOOR = 'door';
    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomMaskUpdateMessage.as::MASK_CATEGORY_WINDOW
    public static readonly MASK_CATEGORY_WINDOW = 'window';
    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomMaskUpdateMessage.as::MASK_CATEGORY_HOLE
    public static readonly MASK_CATEGORY_HOLE = 'hole';

    constructor(
        type: string,
        maskId: string,
        maskType: string | null = null,
        maskLocation: IVector3d | null = null,
        maskCategory: string = 'window'
    )
    {
        super(null, null);
        this._type = type;
        this._maskId = maskId;
        this._maskType = maskType;

        if(maskLocation != null)
        {
            this._maskLocation = new Vector3d(maskLocation.x, maskLocation.y, maskLocation.z);
        }

        this._maskCategory = maskCategory;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectRoomMaskUpdateMessage.as::_type
    private _type: string = '';

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomMaskUpdateMessage.as::get type()
    get type(): string
    {
        return this._type;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectRoomMaskUpdateMessage.as::_maskId
    private _maskId: string = '';

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomMaskUpdateMessage.as::get maskId()
    get maskId(): string
    {
        return this._maskId;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectRoomMaskUpdateMessage.as::_maskType
    private _maskType: string | null = '';

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomMaskUpdateMessage.as::get maskType()
    get maskType(): string | null
    {
        return this._maskType;
    }

    private _maskLocation: Vector3d | null = null;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomMaskUpdateMessage.as::get maskLocation()
    get maskLocation(): IVector3d | null
    {
        return this._maskLocation;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectRoomMaskUpdateMessage.as::_maskCategory
    private _maskCategory: string = 'window';

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomMaskUpdateMessage.as::get maskCategory()
    get maskCategory(): string
    {
        return this._maskCategory;
    }
}
