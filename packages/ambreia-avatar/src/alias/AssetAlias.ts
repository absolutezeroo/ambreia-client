/**
 * Represents an asset alias mapping one asset name to another, with optional flipping.
 * Parsed from JSON with properties: name, link, fliph, flipv.
 *
 * @see sources/win63_version/habbo/avatar/alias/AssetAlias.as
 */
export class AssetAlias
{
    constructor(data: any)
    {
        this._name = String(data.name ?? '');
        this._link = String(data.link ?? '');
        this._flipH = Boolean(parseInt(data.fliph));
        this._flipV = Boolean(parseInt(data.flipv));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/alias/AssetAlias.as::_name
    private _name: string;

    /**
	 * The alias name.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/alias/AssetAlias.as::get name()
    public get name(): string
    {
        return this._name;
    }

    private _link: string;

    /**
	 * The linked asset name this alias points to.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/alias/AssetAlias.as::get link()
    public get link(): string
    {
        return this._link;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/alias/AssetAlias.as::_flipH
    private _flipH: boolean;

    /**
	 * Whether the asset should be flipped horizontally.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/alias/AssetAlias.as::get flipH()
    public get flipH(): boolean
    {
        return this._flipH;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/alias/AssetAlias.as::_flipV
    private _flipV: boolean;

    /**
	 * Whether the asset should be flipped vertically.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/alias/AssetAlias.as::get flipV()
    public get flipV(): boolean
    {
        return this._flipV;
    }
}
