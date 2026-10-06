/**
 * UseProductItem — one candidate pet in a "use this product on…" menu.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/UseProductItem.as
 *
 * Built by AvatarInfoWidgetHandler's two scans of the room's pets and consumed by
 * UseProductView, which renders one bubble per item over its pet (AS3's BreedPetView, the other
 * consumer, went with pet breeding in the RPG fork).
 */
export class UseProductItem
{
    // AS3: UseProductItem.as::id (the backing field is obfuscated `_SafeStr_4872`; named from its getter)
    private _id: number;
    // AS3: UseProductItem.as::category (obfuscated `_SafeStr_4689`)
    private _category: number;
    // AS3: UseProductItem.as::_name
    private _name: string;
    // AS3: UseProductItem.as::requestRoomObjectId (obfuscated `_SafeStr_7499`)
    private _requestRoomObjectId: number;
    // AS3: UseProductItem.as::targetRoomObjectId (obfuscated `_SafeStr_6863`)
    private _targetRoomObjectId: number;
    // AS3: UseProductItem.as::requestInventoryStripId (obfuscated `_SafeStr_9849`)
    private _requestInventoryStripId: number;
    // AS3: UseProductItem.as::replace (obfuscated `_SafeStr_9295`)
    private _replace: boolean;

    // AS3: UseProductItem.as::UseProductItem()
    constructor(
        id: number,
        category: number,
        name: string,
        requestRoomObjectId: number,
        targetRoomObjectId: number,
        requestInventoryStripId: number = -1,
        replace: boolean = false
    )
    {
        this._id = id;
        this._category = category;
        this._name = name;
        this._requestRoomObjectId = requestRoomObjectId;
        this._targetRoomObjectId = targetRoomObjectId;
        this._requestInventoryStripId = requestInventoryStripId;
        this._replace = replace;
    }

    // AS3: UseProductItem.as::get id()
    public get id(): number
    {
        return this._id;
    }

    // AS3: UseProductItem.as::get category()
    public get category(): number
    {
        return this._category;
    }

    // AS3: UseProductItem.as::get name()
    public get name(): string
    {
        return this._name;
    }

    // AS3: UseProductItem.as::get requestRoomObjectId()
    public get requestRoomObjectId(): number
    {
        return this._requestRoomObjectId;
    }

    // AS3: UseProductItem.as::get targetRoomObjectId()
    public get targetRoomObjectId(): number
    {
        return this._targetRoomObjectId;
    }

    // AS3: UseProductItem.as::get requestInventoryStripId()
    public get requestInventoryStripId(): number
    {
        return this._requestInventoryStripId;
    }

    // AS3: UseProductItem.as::get replace()
    public get replace(): boolean
    {
        return this._replace;
    }

    // AS3: UseProductItem.as::dispose()
    public dispose(): void
    {
    }
}
