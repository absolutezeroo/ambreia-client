/**
 * Custom part data for a pet figure.
 *
 * @see sources/win63_version/habbo/avatar/pets/PetCustomPart.as
 */
export class PetCustomPart
{
    constructor(layerId: number, partId: number, paletteId: number)
    {
        this._layerId = layerId;
        this._partId = partId;
        this._paletteId = paletteId;
    }

    private _layerId: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/pets/PetCustomPart.as::get layerId()
    public get layerId(): number
    {
        return this._layerId;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/pets/PetCustomPart.as::set layerId()
    public set layerId(value: number)
    {
        this._layerId = value;
    }

    private _partId: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/pets/PetCustomPart.as::get partId()
    public get partId(): number
    {
        return this._partId;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/pets/PetCustomPart.as::set partId()
    public set partId(value: number)
    {
        this._partId = value;
    }

    private _paletteId: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/pets/PetCustomPart.as::get paletteId()
    public get paletteId(): number
    {
        return this._paletteId;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/pets/PetCustomPart.as::set paletteId()
    public set paletteId(value: number)
    {
        this._paletteId = value;
    }
}
