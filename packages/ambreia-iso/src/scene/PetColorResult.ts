/**
 * PetColorResult
 *
 * Holds the color information for a pet breed/palette.
 *
 * @see sources/win63_version/habbo/room/PetColorResult.as
 */
export class PetColorResult
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/PetColorResult.as::COLOR_TAGS
    private static readonly COLOR_TAGS: string[] = [
        'Null', 'Black', 'White', 'Grey', 'Red', 'Orange', 'Pink',
        'Green', 'Lime', 'Blue', 'Light-Blue', 'Dark-Blue', 'Yellow',
        'Brown', 'Dark-Brown', 'Beige', 'Cyan', 'Purple', 'Gold'
    ];

    constructor(primaryColor: number, secondaryColor: number, breed: number, colorTag: number, id: string, isMaster: boolean, layerTags: string[])
    {
        this._primaryColor = primaryColor & 0xFFFFFF;
        this._secondaryColor = secondaryColor & 0xFFFFFF;
        this._breed = breed;
        this._tag = (colorTag > -1 && colorTag < PetColorResult.COLOR_TAGS.length)
            ? PetColorResult.COLOR_TAGS[colorTag]
            : '';
        this._id = id;
        this._isMaster = isMaster;
        this._layerTags = layerTags;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/PetColorResult.as::_primaryColor
    private _primaryColor: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/PetColorResult.as::get primaryColor()
    get primaryColor(): number
    {
        return this._primaryColor;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/PetColorResult.as::_secondaryColor
    private _secondaryColor: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/PetColorResult.as::get secondaryColor()
    get secondaryColor(): number
    {
        return this._secondaryColor;
    }

    private _breed: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/PetColorResult.as::get breed()
    get breed(): number
    {
        return this._breed;
    }

    private _tag: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/PetColorResult.as::get tag()
    get tag(): string
    {
        return this._tag;
    }

    private _id: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/PetColorResult.as::get id()
    get id(): string
    {
        return this._id;
    }

    private _isMaster: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/PetColorResult.as::get isMaster()
    get isMaster(): boolean
    {
        return this._isMaster;
    }

    private _layerTags: string[];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/PetColorResult.as::get layerTags()
    get layerTags(): string[]
    {
        return this._layerTags;
    }
}
