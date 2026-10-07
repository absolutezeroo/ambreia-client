/**
 * Describes a single product to preview, consumed by ProductIconWidget /
 * ProductImageWidget's `productInfo` setter.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IProductDisplayInfo.as
 */
export interface IProductDisplayInfo
{
    // AS3: .../src/com/sulake/habbo/window/widgets/IProductDisplayInfo.as::get productTypeId()
    readonly productTypeId: number;
    // AS3: .../src/com/sulake/habbo/window/widgets/IProductDisplayInfo.as::get itemTypeId()
    readonly itemTypeId: string;
    // AS3: .../src/com/sulake/habbo/window/widgets/IProductDisplayInfo.as::get extraData()
    readonly extraData: string;
    // AS3: .../src/com/sulake/habbo/window/widgets/IProductDisplayInfo.as::get petFigureString()
    readonly petFigureString: string;
    // AS3: .../src/com/sulake/habbo/window/widgets/IProductDisplayInfo.as::get botFigureString()
    readonly botFigureString: string;
    // AS3: .../src/com/sulake/habbo/window/widgets/IProductDisplayInfo.as::get figureSetIds()
    readonly figureSetIds: number[];
}
