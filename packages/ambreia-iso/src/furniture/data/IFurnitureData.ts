/**
 * Interface for furniture data.
 *
 * @see sources/win63_version/habbo/session/furniture/class_1800.as
 */
export interface IFurnitureData
{
    // AS3: sources/win63_version/habbo/session/furniture/class_1800.as::get type()
    readonly type: string;
    // AS3: sources/win63_version/habbo/session/furniture/class_1800.as::get id()
    readonly id: number;
    // AS3: sources/win63_version/habbo/session/furniture/class_1800.as::get className()
    readonly className: string;
    // AS3: sources/win63_version/habbo/session/furniture/class_1800.as::get fullName()
    readonly fullName: string;
    // AS3: sources/win63_version/habbo/session/furniture/class_1800.as::get hasIndexedColor()
    readonly hasIndexedColor: boolean;
    // AS3: sources/win63_version/habbo/session/furniture/class_1800.as::get colourIndex()
    readonly colourIndex: number;
    // AS3: sources/win63_version/habbo/session/furniture/class_1800.as::get revision()
    readonly revision: number;
    // AS3: sources/win63_version/habbo/session/furniture/class_1800.as::get tileSizeX()
    readonly tileSizeX: number;
    // AS3: sources/win63_version/habbo/session/furniture/class_1800.as::get tileSizeY()
    readonly tileSizeY: number;
    // AS3: sources/win63_version/habbo/session/furniture/class_1800.as::get tileSizeZ()
    readonly tileSizeZ: number;
    // AS3: sources/win63_version/habbo/session/furniture/class_1800.as::get colours()
    readonly colours: number[] | null;
    // AS3: sources/win63_version/habbo/session/furniture/class_1800.as::get localizedName()
    readonly localizedName: string;
    // AS3: sources/win63_version/habbo/session/furniture/class_1800.as::get description()
    readonly description: string;
    // AS3: sources/win63_version/habbo/session/furniture/class_1800.as::get adUrl()
    readonly adUrl: string;
    // AS3: sources/win63_version/habbo/session/furniture/class_1800.as::get purchaseOfferId()
    readonly purchaseOfferId: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/furniture/_SafeCls_2302.as::get tradeable()
    readonly tradeable: boolean;
    // AS3: sources/win63_version/habbo/session/furniture/class_1800.as::get rentOfferId()
    readonly rentOfferId: number;
    // AS3: sources/win63_version/habbo/session/furniture/class_1800.as::get customParams()
    readonly customParams: string | null;
    // AS3: sources/win63_version/habbo/session/furniture/class_1800.as::get category()
    readonly category: number;
    // AS3: sources/win63_version/habbo/session/furniture/class_1800.as::get purchaseCouldBeUsedForBuyout()
    readonly purchaseCouldBeUsedForBuyout: boolean;
    // AS3: sources/win63_version/habbo/session/furniture/class_1800.as::get rentCouldBeUsedForBuyout()
    readonly rentCouldBeUsedForBuyout: boolean;
    // AS3: sources/win63_version/habbo/session/furniture/class_1800.as::get canStandOn()
    readonly canStandOn: boolean;
    // AS3: sources/win63_version/habbo/session/furniture/class_1800.as::get canSitOn()
    readonly canSitOn: boolean;
    // AS3: sources/win63_version/habbo/session/furniture/class_1800.as::get canLayOn()
    readonly canLayOn: boolean;
    // AS3: sources/win63_version/habbo/session/furniture/class_1800.as::get isExternalImageType()
    readonly isExternalImageType: boolean;
    // AS3: sources/win63_version/habbo/session/furniture/class_1800.as::get excludedFromDynamic()
    readonly excludedFromDynamic: boolean;
    // AS3: sources/win63_version/habbo/session/furniture/class_1800.as::get furniLine()
    readonly furniLine: string;

    /**
	 * The furnidata's category string, not the numeric `category` — that one is the special-type
	 * id the room engine switches on, this is the catalogue-facing grouping.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/furniture/_SafeCls_2302.as::get furniDataCategory()
    readonly furniDataCategory: string;

    /**
	 * Whether furniture stacks on top of this item — `canStandOn` above is about avatars.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/furniture/_SafeCls_2302.as::get canPutStuffOn()
    readonly canPutStuffOn: boolean;

    /**
	 * Stacking height in tiles: how high the next item sits, not the footprint's z extent.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/furniture/_SafeCls_2302.as::get height()
    readonly height: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/furniture/_SafeCls_2302.as::get recyclable()
    readonly recyclable: boolean;
}
