import {Logger} from '@core/utils/Logger';
import {BadgeImageReadyEvent} from '@habbo/session/events/BadgeImageReadyEvent';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {ITextWindow} from '@core/window/components/ITextWindow';
import type {IGetImageListener} from '@habbo/room/IGetImageListener';
import type {IAvatarImageListener} from '@habbo/avatar/IAvatarImageListener';
import type {IProductData} from '@habbo/session/product/IProductData';
import type {IFurnitureData} from '@habbo/session/furniture/IFurnitureData';
import type {HabboCatalog} from '../HabboCatalog';
import type {IPurchasableOffer} from '../IPurchasableOffer';
import type {IProduct} from './IProduct';
import type {ProductContainer} from './ProductContainer';
import {ProductGridItem} from './ProductGridItem';

const log = Logger.getLogger('habbo.catalog.viewer.Product');

/**
 * A single product (furni/badge/effect/subscription/avatar-render/chat-style) inside an offer.
 *
 * @see sources/win63_version/habbo/catalog/viewer/Product.as
 */
export class Product extends ProductGridItem implements IProduct
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/Product.as::EFFECT_CLASSID_NINJA_DISAPPEAR
    static readonly EFFECT_CLASSID_NINJA_DISAPPEAR: number = 108;

    private _productType: string;

    private _productClassId: number;

    private _extraParam: string;

    private _productCount: number;

    private _productData: IProductData | null;

    private _furnitureData: IFurnitureData | null;

    private _isUniqueLimitedItem: boolean;

    private _uniqueLimitedItemSeriesSize: number;

    private _uniqueLimitedItemsLeft: number;

    private _badgeTarget: ProductGridItem | null = null;

    constructor(
        productType: string,
        productClassId: number,
        extraParam: string,
        productCount: number,
        productData: IProductData | null,
        furnitureData: IFurnitureData | null,
        catalog: HabboCatalog,
        isUniqueLimitedItem: boolean = false,
        uniqueLimitedItemSeriesSize: number = 0,
        uniqueLimitedItemsLeft: number = 0
    )
    {
        super(catalog);
        this._productType = productType;
        this._productClassId = productClassId;
        this._extraParam = extraParam;
        this._productCount = productCount;
        this._productData = productData;
        this._furnitureData = furnitureData;
        this._isUniqueLimitedItem = isUniqueLimitedItem;
        this._uniqueLimitedItemSeriesSize = uniqueLimitedItemSeriesSize;
        this._uniqueLimitedItemsLeft = uniqueLimitedItemsLeft;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/Product.as::stripAddonProducts()
    static stripAddonProducts(products: IProduct[]): IProduct[]
    {
        if(products.length === 1) return products;

        return products.filter((product) =>
            product.productType !== 'b'
            && !(product.productType === 'e' && product.productClassId === Product.EFFECT_CLASSID_NINJA_DISAPPEAR)
            && product.productType !== 'chat_style'
        );
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/Product.as::get productType()
    get productType(): string
    {
        return this._productType;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/Product.as::get productClassId()
    get productClassId(): number
    {
        return this._productClassId;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/Product.as::set extraParam()
    set extraParam(value: string)
    {
        this._extraParam = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/Product.as::get extraParam()
    get extraParam(): string
    {
        return this._extraParam;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/Product.as::get productCount()
    get productCount(): number
    {
        return this._productCount;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/Product.as::get productData()
    get productData(): IProductData | null
    {
        return this._productData;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/Product.as::get furnitureData()
    get furnitureData(): IFurnitureData | null
    {
        return this._furnitureData;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/Product.as::get isUniqueLimitedItem()
    get isUniqueLimitedItem(): boolean
    {
        return this._isUniqueLimitedItem;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/Product.as::get uniqueLimitedItemSeriesSize()
    get uniqueLimitedItemSeriesSize(): number
    {
        return this._uniqueLimitedItemSeriesSize;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/Product.as::get uniqueLimitedItemsLeft()
    get uniqueLimitedItemsLeft(): number
    {
        return this._uniqueLimitedItemsLeft;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/Product.as::set uniqueLimitedItemsLeft()
    set uniqueLimitedItemsLeft(value: number)
    {
        this._uniqueLimitedItemsLeft = value;
    }

    override dispose(): void
    {
        if(this.disposed) return;

        this.catalog?.sessionDataManager?.events.off(
            BadgeImageReadyEvent.BADGE_IMAGE_READY, this.onBadgeImageReadyEvent
        );

        this._productType = '';
        this._productClassId = 0;
        this._extraParam = '';
        this._productCount = 0;
        this._productData = null;
        this._furnitureData = null;

        super.dispose();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/Product.as::initIcon()
    // The `param1 is BundleGridViewCatalogWidget` branch is unreachable here: that widget
    // class isn't ported yet (viewer/widgets/ is a later phase), so every caller currently
    // is a ProductContainer.
    initIcon(
        grid: unknown,
        imageListener: IGetImageListener | null = null,
        avatarListener: IAvatarImageListener | null = null,
        offer: IPurchasableOffer | null = null,
        target: unknown = null,
        stuffData: unknown = null,
        onPreviewImageReady: ((...args: unknown[]) => void) | null = null
    ): ImageBitmap | null
    {
        if(this.disposed) return null;

        const listener: IGetImageListener = imageListener ?? this;

        const roomEngine = (grid as ProductContainer).offer.page.viewer.roomEngine;

        if(!roomEngine || !this.catalog)
        {
            log.warn(`initIcon: bailing out early (roomEngine=${!!roomEngine}, catalog=${!!this.catalog})`);

            return null;
        }

        let image: ImageBitmap | null = null;

        switch(this._productType)
        {
            case 's':
            {
                const result = roomEngine.getFurnitureIcon(this._productClassId, listener, null, stuffData);

                image = result.data;

                break;
            }
            case 'i':
            {
                if(offer && this._furnitureData)
                {
                    // Decoration products are named, not rendered: the thumbnail is an asset
                    // called `th_<kind>_<code>`, so this branch builds the name and hands it to
                    // the catalog, which downloads it if the library has not got it.
                    //
                    // `wallpaper` is the odd one — its asset name says `wall`, not the class name
                    // the other two use — and `landscape` also dots-to-underscores its code and
                    // pins a `001` variant on the end.
                    const className = this._furnitureData.className;
                    const extraParam = String(offer.product?.extraParam ?? '');

                    let assetName = '';

                    switch(className)
                    {
                        case 'floor':
                            assetName = ['th', className, extraParam].join('_');
                            break;
                        case 'wallpaper':
                            assetName = ['th', 'wall', extraParam].join('_');
                            break;
                        case 'landscape':
                            assetName = ['th', className, extraParam.replace('.', '_'), '001'].join('_');
                            break;
                        default:
                        {
                            // Not a decoration after all — fall back to the rendered wall item.
                            // AS3 still calls setImageFromAsset() below with an empty name, which
                            // returns immediately.
                            const fallback = roomEngine.getWallItemIcon(this._productClassId, listener, this._extraParam);

                            image = fallback.data;
                        }
                    }

                    // PROBE (throwaway): the Spaces grid thumbnails.
                    log.warn(`PROBE spaces icon: class=${className} asset=${assetName} target=${target ? (target as {name?: string}).name : null} hasAsset=${this.catalog.assets?.hasAsset(assetName)} callback=${!!onPreviewImageReady}`);

                    this.catalog.setImageFromAsset(target, assetName, onPreviewImageReady);

                    break;
                }

                const result = roomEngine.getWallItemIcon(this._productClassId, listener, this._extraParam);

                image = result.data;

                break;
            }
            case 'e':
            {
                image = this.catalog.getPixelEffectIcon(this._productClassId);

                if(listener === this)
                {
                    this.setIconImage(image, true);
                }

                break;
            }
            case 'h':
            {
                image = this.catalog.getSubscriptionProductIcon(this._productClassId);

                break;
            }
            case 'b':
            {
                // AS3 subscribes before asking, because the ask is what starts the download: a
                // badge not yet cached comes back through BIRE_BADGE_IMAGE_READY instead, and
                // without this the tile stayed blank until something called initIcon() again.
                this.catalog.sessionDataManager?.events.on(
                    BadgeImageReadyEvent.BADGE_IMAGE_READY, this.onBadgeImageReadyEvent
                );

                this._badgeTarget = listener as unknown as ProductGridItem;

                const badgeImage = this.catalog.sessionDataManager?.getBadgeImage(this._extraParam) ?? null;

                if(badgeImage)
                {
                    createImageBitmap(badgeImage).then((bitmap) => this.onBadgeImageReady(bitmap));
                }

                image = null;

                break;
            }
            case 'r':
            {
                this.renderAvatarImage(this._extraParam, avatarListener).then((rendered) =>
                {
                    if(rendered) this.setIconImage(rendered, false);
                });

                image = null;

                break;
            }
            case 'chat_style':
                // AS3: `catalog.freeFlowChat.chatStyleLibrary.getStyle(int(extraParam))
                // .selectorPreview.clone()`. The clone exists because assigning a BitmapData hands
                // its lifetime to the window; the port's wrapper does not take ownership, so the
                // library's own ImageBitmap is passed through and outlives the icon.
                image = this.catalog.freeFlowChat?.chatStyleLibrary?.getStyle(parseInt(this._extraParam))?.selectorPreview ?? null;
                break;
            default:
                image = null;
        }

        if(image != null && listener === this)
        {
            this.setIconImage(image, true);
        }

        return image;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/Product.as::imageReady()
    imageReady(_id: number, image: ImageBitmap | null): void
    {
        if(!this.disposed)
        {
            this.setIconImage(image, true);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/Product.as::imageFailed()
    imageFailed(_id: number): void
    {
    }

    /**
     * AS3: .../src/com/sulake/habbo/catalog/viewer/Product.as::onBadgeImageReady()
     *
     * The event fires for every badge the session loads, so the id is checked before touching the
     * tile. AS3's payload is already a BitmapData; here it is an HTMLImageElement, converted the
     * same way the cache-hit path in initIcon() converts its own.
     */
    // AS3: .../src/com/sulake/habbo/catalog/viewer/Product.as::onBadgeImageReady()
    private onBadgeImageReadyEvent = (event: BadgeImageReadyEvent): void =>
    {
        if(this.disposed || event.badgeId !== this._extraParam) return;

        const image = event.badgeImage as CanvasImageSource | null;

        if(image === null) return;

        void createImageBitmap(image).then((bitmap) => this.onBadgeImageReady(bitmap));
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/Product.as::onBadgeImageReady()
    // The tail of the AS3 handler, shared with the cache-hit path in initIcon().
    private onBadgeImageReady(image: ImageBitmap): void
    {
        if(!this.disposed && this._productType === 'b' && this._badgeTarget)
        {
            this._badgeTarget.setIconImage(image, false);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/Product.as::get isColorable()
    get isColorable(): boolean
    {
        if(this._furnitureData && this._furnitureData.fullName)
        {
            return this._furnitureData.fullName.indexOf('*') !== -1;
        }

        return false;
    }

    // TS-only: no AS3 counterpart; re-pairs the inherited getter with the setter below. TypeScript
    //   shadows the whole accessor pair when a subclass declares only one half, so without this
    //   `this.view` reads `undefined` here - see the same note on `ProductContainer`.
    override get view(): IWindowContainer
    {
        return super.view;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/Product.as::set view()
    // The decompiled source computes multiContainer/multiCounter but the win63 build's
    // method body is truncated before using them - reconstructed from the clean reference
    // (vortex-client), which shows the container made visible and the counter text set.
    override set view(view: IWindowContainer)
    {
        if(!view) return;

        super.view = view;

        if(this._productCount > 1)
        {
            const multiContainer = this._view!.findChildByName('multiContainer');

            if(multiContainer)
            {
                multiContainer.visible = true;
            }

            const multiCounter = this._view!.findChildByName('multiCounter') as unknown as ITextWindow | null;

            if(multiCounter)
            {
                multiCounter.text = 'x' + this._productCount;
            }
        }
    }
}
