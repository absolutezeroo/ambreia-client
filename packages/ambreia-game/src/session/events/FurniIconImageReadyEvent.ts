/**
 * FurniIconImageReadyEvent
 *
 * Fired once a furni icon requested by `FurniIconImageManager` has finished loading.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/events/FurniIconImageReadyEvent.as
 */
export class FurniIconImageReadyEvent
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/events/FurniIconImageReadyEvent.as::_SafeStr_11210
    // (the identifier is obfuscated; the constant's value is the event type the class passes to
    // super(), so the name is derived from that value.)
    static readonly FURNI_ICON_READY: string = 'FIIRE_ICON_READY';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/events/FurniIconImageReadyEvent.as::FurniIconImageReadyEvent()
    constructor(
        assetName: string,
        wallItem: boolean,
        typeId: number,
        extra: string,
        furniIconImage: HTMLImageElement | null
    )
    {
        this._assetName = assetName;
        this._wallItem = wallItem;
        this._typeId = typeId;
        this._extra = extra;
        this._furniIconImage = furniIconImage;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/events/FurniIconImageReadyEvent.as::_assetName
    private _assetName: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/events/FurniIconImageReadyEvent.as::get assetName()
    get assetName(): string
    {
        return this._assetName;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/events/FurniIconImageReadyEvent.as::_SafeStr_9355
    private _wallItem: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/events/FurniIconImageReadyEvent.as::get wallItem()
    get wallItem(): boolean
    {
        return this._wallItem;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/events/FurniIconImageReadyEvent.as::_SafeStr_8605
    private _typeId: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/events/FurniIconImageReadyEvent.as::get typeId()
    get typeId(): number
    {
        return this._typeId;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/events/FurniIconImageReadyEvent.as::_SafeStr_7590
    private _extra: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/events/FurniIconImageReadyEvent.as::get extra()
    get extra(): string
    {
        return this._extra;
    }

    /**
	 * AS3 hands over a `BitmapData` clone; this port caches `HTMLImageElement`s in
	 * `FurniIconImageManager`, exactly as `BadgeImageManager` does, and passes the element.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/events/FurniIconImageReadyEvent.as::_SafeStr_4582
    private _furniIconImage: HTMLImageElement | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/events/FurniIconImageReadyEvent.as::get furniIconImage()
    get furniIconImage(): HTMLImageElement | null
    {
        return this._furniIconImage;
    }
}
