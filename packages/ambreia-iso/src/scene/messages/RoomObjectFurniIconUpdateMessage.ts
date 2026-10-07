/**
 * RoomObjectFurniIconUpdateMessage
 *
 * Carries the asset name a furni chest should draw for one of the items it holds — the
 * placeholder first, then the real one once the icon has loaded.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/messages/RoomObjectFurniIconUpdateMessage.as
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';

export class RoomObjectFurniIconUpdateMessage extends RoomObjectUpdateMessage
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/messages/RoomObjectFurniIconUpdateMessage.as::BADGE_LOADED
    // (AS3 really does name it BADGE_LOADED — copy-paste from the badge message it was
    // modelled on. The value is the furni-icon one, and nothing reads the constant.)
    public static readonly BADGE_LOADED: string = 'ROFIUM_FURNI_ICON_LOADED';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/messages/RoomObjectFurniIconUpdateMessage.as::RoomObjectFurniIconUpdateMessage()
    constructor(assetName: string, wallItem: boolean, typeId: number, extra: string)
    {
        super(null, null);
        this._assetName = assetName;
        this._wallItem = wallItem;
        this._typeId = typeId;
        this._extra = extra;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/messages/RoomObjectFurniIconUpdateMessage.as::_assetName
    private _assetName: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/messages/RoomObjectFurniIconUpdateMessage.as::get assetName()
    get assetName(): string
    {
        return this._assetName;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/messages/RoomObjectFurniIconUpdateMessage.as::_SafeStr_9355
    private _wallItem: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/messages/RoomObjectFurniIconUpdateMessage.as::get wallItem()
    get wallItem(): boolean
    {
        return this._wallItem;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/messages/RoomObjectFurniIconUpdateMessage.as::_SafeStr_8605
    private _typeId: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/messages/RoomObjectFurniIconUpdateMessage.as::get typeId()
    get typeId(): number
    {
        return this._typeId;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/messages/RoomObjectFurniIconUpdateMessage.as::_SafeStr_7590
    private _extra: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/messages/RoomObjectFurniIconUpdateMessage.as::get extra()
    get extra(): string
    {
        return this._extra;
    }
}
