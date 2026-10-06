import type {IFurnitureData} from '@habbo/session/furniture/IFurnitureData';
import type {IPurchasableOffer} from '../IPurchasableOffer';
import type {HabboCatalog} from '../HabboCatalog';
import type {ICatalogPage} from './ICatalogPage';
import type {IProduct} from './IProduct';
import type {IProductContainer} from './IProductContainer';
import type {IGridItem} from './IGridItem';
import {FurniProductContainer} from './FurniProductContainer';
import {Product} from './Product';

/**
 * A search result dressed up as a catalog offer.
 *
 * The catalog's grid only knows how to render `IPurchasableOffer`s, and a furni matched by a text
 * search is not one — it has furni data and an offer id and nothing else. This wraps the pair so the
 * existing page and grid code can display it unchanged.
 *
 * **Almost every price accessor returns zero or empty**, and that is AS3's own doing rather than a
 * gap: a search result is lazy, so its real price arrives later from
 * `FurniProductContainer.activate()`'s `GetProductOffer` and is rendered from the reply, never from
 * this object.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/FurnitureOffer.as
 */
export class FurnitureOffer implements IPurchasableOffer
{
    // AS3: FurnitureOffer.as::_SafeStr_4620 (backing field of the furni data)
    private _furniData: IFurnitureData | null;

    /** Derived name — `_SafeStr_7581`, the id the room engine answers a preview render with. */
    // AS3: FurnitureOffer.as::_SafeStr_7581
    private _previewCallbackId: number = -1;

    // AS3: FurnitureOffer.as::_SafeStr_4734 (backing field of page)
    private _page!: ICatalogPage;

    // AS3: FurnitureOffer.as::_SafeStr_4945 (backing field of productContainer)
    private _productContainer: FurniProductContainer;

    // AS3: FurnitureOffer.as::_SafeStr_7822 (backing field of product)
    private _product: Product;

    /** Derived name — `_SafeStr_7986`: the offer id the search resolved, or -1 to derive one. */
    // AS3: FurnitureOffer.as::_SafeStr_7986
    private _resolvedOfferId: number;

    /** Derived name — `_SafeStr_9841`: whether that resolved id was the rent offer. */
    // AS3: FurnitureOffer.as::_SafeStr_9841
    private _resolvedAsRentOffer: boolean;

    // AS3: FurnitureOffer.as::FurnitureOffer()
    constructor(
        furniData: IFurnitureData,
        catalog: HabboCatalog,
        offerId: number = -1,
        isRentOffer: boolean = false,
        productCode: string | null = null
    )
    {
        this._furniData = furniData;
        this._resolvedOfferId = offerId;
        this._resolvedAsRentOffer = isRentOffer;

        // The furni's class name is the product code unless the caller resolved an override.
        const code = productCode === null || productCode.length === 0 ? furniData.className : productCode;

        this._productContainer = new FurniProductContainer(this, [], catalog, furniData);
        this._product = new Product(
            furniData.type,
            furniData.id,
            furniData.customParams ?? '',
            1,
            catalog.getProductData(code),
            furniData,
            catalog
        );
    }

    /**
     * AS3: FurnitureOffer.as::get offerId()
     *
     * A resolved id wins; otherwise it is read off the furni data, and which of the two depends on
     * `isRentOffer` — which itself falls back to the page.
     */
    // AS3: FurnitureOffer.as::get offerId()
    get offerId(): number
    {
        if(this._resolvedOfferId > -1) return this._resolvedOfferId;

        return this.isRentOffer
            ? (this._furniData?.rentOfferId ?? -1)
            : (this._furniData?.purchaseOfferId ?? -1);
    }

    /**
     * AS3: FurnitureOffer.as::get isRentOffer()
     *
     * With no resolved id, a furni that *can* be rented is treated as a rent offer. (AS3 excepts a
     * Builders Club page; the RPG fork removed the Builders Club.)
     */
    // AS3: FurnitureOffer.as::get isRentOffer()
    get isRentOffer(): boolean
    {
        if(this._resolvedOfferId > -1) return this._resolvedAsRentOffer;

        return (this._furniData?.rentOfferId ?? -1) > -1;
    }

    /** AS3 builds this key from the furni id, not from the product code. */
    // AS3: FurnitureOffer.as::get localizationId()
    get localizationId(): string
    {
        return `roomItem.name.${this._furniData?.id ?? 0}`;
    }

    /** Prefers the product data's name and falls back to the furni's own localised one. */
    // AS3: FurnitureOffer.as::get localizationName()
    get localizationName(): string
    {
        const productData = this._product !== null ? this._product.productData : null;

        if(productData != null && productData.name != null && productData.name.length > 0)
        {
            return productData.name;
        }

        return this._furniData?.localizedName ?? '';
    }

    // AS3: FurnitureOffer.as::get localizationDescription()
    get localizationDescription(): string
    {
        return this._furniData?.description ?? '';
    }

    /**
     * AS3 leaves this null until a page adopts the offer; `IPurchasableOffer` declares it
     * non-nullable, so the field is asserted rather than the interface widened — every read below
     * guards on it anyway, exactly as AS3 does.
     */
    // AS3: FurnitureOffer.as::get page()
    get page(): ICatalogPage
    {
        return this._page;
    }

    // AS3: FurnitureOffer.as::set page()
    set page(value: ICatalogPage)
    {
        this._page = value;
    }

    // AS3: FurnitureOffer.as::get productContainer()
    get productContainer(): IProductContainer
    {
        return this._productContainer;
    }

    // AS3: FurnitureOffer.as::get product()
    get product(): IProduct
    {
        return this._product;
    }

    /** The container is its own grid item — `ProductContainer` extends `ProductGridItem`. */
    // AS3: FurnitureOffer.as::get gridItem()
    get gridItem(): IGridItem
    {
        return this._productContainer;
    }

    // AS3: FurnitureOffer.as::get pricingModel()
    get pricingModel(): string
    {
        return 'pricing_model_furniture';
    }

    // AS3: FurnitureOffer.as::set previewCallbackId()
    set previewCallbackId(value: number)
    {
        this._previewCallbackId = value;
    }

    // AS3: FurnitureOffer.as::get previewCallbackId()
    get previewCallbackId(): number
    {
        return this._previewCallbackId;
    }

    // AS3: FurnitureOffer.as::get priceInCredits()
    get priceInCredits(): number
    {
        return 0;
    }

    // AS3: FurnitureOffer.as::get priceInActivityPoints()
    get priceInActivityPoints(): number
    {
        return 0;
    }

    // AS3: FurnitureOffer.as::get activityPointType()
    get activityPointType(): number
    {
        return 0;
    }

    /** -1, not 0 — the one price accessor that is not simply blank. */
    // AS3: FurnitureOffer.as::get priceInSilver()
    get priceInSilver(): number
    {
        return -1;
    }

    // AS3: FurnitureOffer.as::get priceInEmerald()
    get priceInEmerald(): number
    {
        return 0;
    }

    // AS3: FurnitureOffer.as::get priceType()
    get priceType(): string
    {
        return '';
    }

    // AS3: FurnitureOffer.as::get clubLevel()
    get clubLevel(): number
    {
        return 0;
    }

    // AS3: FurnitureOffer.as::get badgeCode()
    get badgeCode(): string
    {
        return '';
    }

    // AS3: FurnitureOffer.as::get extraChatStyleCode()
    get extraChatStyleCode(): string
    {
        return '';
    }

    // AS3: FurnitureOffer.as::get isSingleChatStyle()
    get isSingleChatStyle(): boolean
    {
        return false;
    }

    // AS3: FurnitureOffer.as::get bundlePurchaseAllowed()
    get bundlePurchaseAllowed(): boolean
    {
        return false;
    }

    // AS3: FurnitureOffer.as::get giftable()
    get giftable(): boolean
    {
        return false;
    }

    // AS3: FurnitureOffer.as::get disposed()
    get disposed(): boolean
    {
        return this._furniData === null;
    }

    /** AS3 leaves `_productContainer` and `_product` alone here; only the three fields below go. */
    // AS3: FurnitureOffer.as::dispose()
    dispose(): void
    {
        this._furniData = null;
        this._previewCallbackId = -1;
    }
}
