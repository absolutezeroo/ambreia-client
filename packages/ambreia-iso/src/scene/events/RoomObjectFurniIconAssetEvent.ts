/**
 * RoomObjectFurniIconAssetEvent
 *
 * Raised by the furni chest logic to ask the engine for the icon of one item it holds.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/events/RoomObjectFurniIconAssetEvent.as
 */
import {RoomObjectEvent} from '../../events/RoomObjectEvent';
import type {IRoomObject} from '../../object/IRoomObject';

export class RoomObjectFurniIconAssetEvent extends RoomObjectEvent
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/events/RoomObjectFurniIconAssetEvent.as::_SafeStr_11678
    // (the identifier is obfuscated; the constant's value is the type the chest logic declares
    // in getEventTypes(), so the name is derived from that value.)
    public static readonly LOAD_FURNI_ICON: string = 'ROFIAE_LOAD_FURNI_ICON';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/events/RoomObjectFurniIconAssetEvent.as::RoomObjectFurniIconAssetEvent()
    constructor(type: string, object: IRoomObject, wallItem: boolean, typeId: number, extra: string)
    {
        super(type, object);
        this._wallItem = wallItem;
        this._typeId = typeId;
        this._extra = extra;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/events/RoomObjectFurniIconAssetEvent.as::_SafeStr_9355
    private _wallItem: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/events/RoomObjectFurniIconAssetEvent.as::get wallItem()
    get wallItem(): boolean
    {
        return this._wallItem;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/events/RoomObjectFurniIconAssetEvent.as::_SafeStr_8605
    private _typeId: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/events/RoomObjectFurniIconAssetEvent.as::get typeId()
    get typeId(): number
    {
        return this._typeId;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/events/RoomObjectFurniIconAssetEvent.as::_SafeStr_7590
    private _extra: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/events/RoomObjectFurniIconAssetEvent.as::get extra()
    get extra(): string
    {
        return this._extra;
    }
}
