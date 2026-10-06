import type {ITextWindow} from '@core/window/components/ITextWindow';
import type {IDisposable} from '@core/runtime/IDisposable';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IIterable} from '@core/window/utils/IIterable';
import type {IItemListWindow} from '@core/window/components/IItemListWindow';
import type {IItemGridWindow} from '@core/window/components/IItemGridWindow';
import type {IBitmapWrapperWindow} from '@core/window/components/IBitmapWrapperWindow';
import type {ISelectableWindow} from '@core/window/components/ISelectableWindow';
import {WindowEvent} from '@core/window/events/WindowEvent';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import {WindowKeyboardEvent} from '@core/window/events/WindowKeyboardEvent';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IStuffData} from '@habbo/room/object/data/IStuffData';
import type {IGetImageListener} from '@habbo/room/IGetImageListener';
import type {IAvatarImageListener} from '@habbo/avatar/IAvatarImageListener';
import {AvatarAction} from '@habbo/avatar/enum/AvatarAction';
import {textureToBitmap} from '@habbo/avatar/AvatarImageSnapshot';
import {Vector3d} from '@room/utils/Vector3d';
import {Logger} from '@core/utils/Logger';
import type {HabboCatalog} from '../HabboCatalog';
import type {IPurchasableOffer} from '../IPurchasableOffer';
import {Offer} from '../viewer/Offer';
import {CatalogProductImages} from '../viewer/CatalogProductImages';
import type {IWidgetWindow} from '@core/window/components/IWidgetWindow';
import type {ProductImageWidget} from '@habbo/window/widgets/ProductImageWidget';
import {ClubBuyOfferData} from '../club/ClubBuyOfferData';
import {RentUtils} from '../viewer/widgets/utils/RentUtils';
import {CatalogWidgetEvent} from '../viewer/widgets/events/CatalogWidgetEvent';

const log = Logger.getLogger('habbo.catalog.purchase.PurchaseConfirmationDialog');

/**
 * The catalog's "Confirm purchase" dialog: product preview, localized product name, quantity,
 * price and the buy/cancel pair, built from the `purchase_confirmation` layout.
 *
 * `turnIntoGifting()` swaps the buy button over to the gift path, which replaces this window with
 * the `gift_wrapping` layout: receiver name with friend-name suggestions, box/colour/ribbon
 * selectors previewed through the room engine, an optional message, and `giveGift()`.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as
 */
// AS3: PurchaseConfirmationDialog.as:62 — `implements _SafeCls_67, _SafeCls_1739`, the first of
// which is IAvatarImageListener (it is what `createAvatarImage(..., this)` in the "r" branch takes).
export class PurchaseConfirmationDialog implements IDisposable, IGetImageListener, IAvatarImageListener
{
    // AS3: PurchaseConfirmationDialog.as::_window.color — the light header tint. AS3 has a dark one
    // for mint-token and NFT purchases too, which the RPG fork removed.
    private static readonly WINDOW_COLOR: number = 4296112;

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::_catalog
    private _catalog: HabboCatalog | null;

    private _windowManager: IHabboWindowManager | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::_window
    private _window: IWindowContainer | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::_offerId
    private _offerId: number = -1;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::pageId
    // Name derived, not recovered: obfuscated as `_SafeStr_7494` in every tree, and the class did
    // not exist in the 2016 build. It is showOffer()'s `param4`, forwarded to purchaseProduct()'s
    // pageId. The five fields below are the same case - each is named after the showOffer()
    // parameter it stores and the call it is eventually handed to.
    private _pageId: number = -1;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::extraParam
    private _extraParam: string = '';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::quantity
    private _quantity: number = 1;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::get productType()
    private _productType: string = '';

    // Derived name: `stuffData` is declared in no AS3 tree — the trace points
    // at the class it belongs to, but the identifier itself is this port's.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::stuffData
    private _stuffData: IStuffData | null = null;

    // TS-only: AS3 has no such flag - it infers a gift from `_receiverName` being non-empty, which
    // only the unported gift dialog ever sets. This carries HabboCatalog's `_purchaseWillBeGift`
    // across so isGiftPurchase() can answer before that dialog exists.
    private _purchaseWillBeGift: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::pendingImageId
    // Name derived (obfuscated `_SafeStr_6872`): the pending getFurnitureImage()/getWallItemImage()
    // request id, matched against imageReady()'s.
    private _pendingImageId: number = 0;

    /** Friend names the receiver field autocompletes against; empty when no friend list is up. */
    // AS3: PurchaseConfirmationDialog.as::_friendNames
    private _friendNames: string[] = [];

    /** A receiver the caller already knows, which skips straight past the name field. */
    // AS3: PurchaseConfirmationDialog.as::_userName
    private _userName: string | null = null;

    // AS3: PurchaseConfirmationDialog.as::_receiverName
    private _receiverName: string = '';

    // AS3: PurchaseConfirmationDialog.as::_highlightIndex
    private _highlightIndex: number = 0;

    // AS3: PurchaseConfirmationDialog.as::_suggestionContainer
    private _suggestionContainer: IWindowContainer | null = null;

    // AS3: PurchaseConfirmationDialog.as::_suggestionItemTemplate
    private _suggestionItemTemplate: IWindowContainer | null = null;

    // AS3: PurchaseConfirmationDialog.as::_stuffTypes
    private _stuffTypes: number[] = [];

    // AS3: PurchaseConfirmationDialog.as::_boxTypes
    private _boxTypes: number[] = [];

    // AS3: PurchaseConfirmationDialog.as::_ribbonTypes
    private _ribbonTypes: number[] = [];

    /** The free "default" box, drawn at random from the configuration's default set. */
    // AS3: PurchaseConfirmationDialog.as::_defaultStuffType
    private _defaultStuffType: number = 0;

    // AS3: PurchaseConfirmationDialog.as::_selectedStuffType
    private _selectedStuffType: number = 0;

    // AS3: PurchaseConfirmationDialog.as::_selectedRibbonIndex
    private _selectedRibbonIndex: number = 0;

    // AS3: PurchaseConfirmationDialog.as::_selectedBoxIndex
    private _selectedBoxIndex: number = 0;

    /** True once `turnIntoGifting()` has repointed the buy button at the gift dialog. */
    // AS3: PurchaseConfirmationDialog.as::_isGifting
    private _isGifting: boolean = false;

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::_disposed
    private _disposed: boolean = false;

    constructor(catalog: HabboCatalog, windowManager: IHabboWindowManager)
    {
        this._catalog = catalog;
        this._windowManager = windowManager;
    }

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: PurchaseConfirmationDialog.as::get productType()
    get productType(): string
    {
        return this._productType;
    }

    // AS3: PurchaseConfirmationDialog.as::isGiftPurchase()
    isGiftPurchase(): boolean
    {
        return this._purchaseWillBeGift;
    }

    // AS3: PurchaseConfirmationDialog.as::getIconWrapper()
    getIconWrapper(): IBitmapWrapperWindow | null
    {
        return (this._window?.findChildByName('product_image') as unknown as IBitmapWrapperWindow | null) ?? null;
    }

    /**
     * The sender's head, for the "from" corner of the gift card.
     *
     * Cropped to `"head"` rather than rendered full: the card shows a face, not an avatar.
     *
     * DEVIATION: AS3 returns the BitmapData synchronously. Here the render lands on a PixiJS
     *   `Texture` and reaching pixels is asynchronous, so this returns a promise and the two
     *   callers await it — the same bridge `renderBotImage()` already uses.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::getAvatarFaceBitmap()
    async getAvatarFaceBitmap(figure: string): Promise<ImageBitmap | null>
    {
        const renderManager = this._catalog?.avatarRenderManager ?? null;

        if(renderManager === null) return null;

        const avatarImage = renderManager.createAvatarImage(figure, 'h', null, this, null);

        if(avatarImage === null) return null;

        const texture = avatarImage.getCroppedImage('head');
        const image = texture === null ? null : await textureToBitmap(texture);

        avatarImage.dispose();

        return image;
    }

    /**
     * Repoints the buy button at the gift dialog.
     *
     * Called by `HabboCatalog.showPurchaseConfirmation()` right after `showOffer()`, so the
     * listener this removes is the one that method has just attached.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::turnIntoGifting()
    turnIntoGifting(): void
    {
        const buyButton = this._window?.findChildByName('buy_button') ?? null;

        if(buyButton === null || this._window === null) return;

        this._isGifting = true;

        buyButton.removeEventListener(WindowMouseEvent.CLICK, this._onBuyButtonClick);
        buyButton.addEventListener(WindowMouseEvent.CLICK, this._onGiftButtonClick);
        buyButton.caption = '${catalog.purchase_confirmation.gift}';
        this._window.caption = '${catalog.purchase_confirmation.gift.title}';
    }

    /**
     * AS3: PurchaseConfirmationDialog.as::showOffer()
     *
     * TS deviation from the AS3 signature: AS3 takes `(catalog, roomEngine, offer, pageId,
     * extraParam, quantity, stuffData, giftData, userName, previewImage)` because its dialog is
     * constructed with only a localization manager. This port's dialog is handed the catalog in its
     * constructor (see HabboCatalog.showPurchaseConfirmation()), so the first two are already known.
     */
    // DEVIATION: AS3 also stores the habbicon id (`_SafeStr_6120`) off a `habbicon` offer's
    //   `extraParam`; the RPG fork removed Habbicons. AS3 also admits the mint-token and NFT store
    //   offers of the collectibles hub; the RPG fork removed collectibles and NFT.
    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::showOffer()
    showOffer(
        offer: IPurchasableOffer,
        pageId: number,
        extraParam: string,
        quantity: number,
        stuffData: IStuffData | null,
        isGift: boolean,
        previewImage: ImageBitmap | null = null,
        friendNames: string[] = [],
        userName: string | null = null
    ): void
    {
        if(!this._catalog) return;

        this._friendNames = friendNames;
        this._userName = userName;
        this._offerId = offer.offerId;
        this._pageId = pageId;
        this._extraParam = extraParam;
        this._quantity = quantity;
        this._stuffData = stuffData;
        this._purchaseWillBeGift = isGift;

        if(offer instanceof Offer && offer.product != null)
        {
            this._productType = offer.product.productType;
        }
        else if(offer instanceof ClubBuyOfferData)
        {
            this._productType = 'h';
        }
        else
        {
            // AS3's remaining class is GameTokensOffer (snow-war tokens), which has no port; every
            // other offer returns here in AS3 too.
            log.warn(`Unsupported offer class for the purchase confirmation: ${offer.localizationId}`);

            return;
        }

        this.showConfirmationDialog(offer, previewImage);
        this._catalog.syncPlacedOfferWithPurchase(offer);
    }

    // DEVIATION: AS3 tints the window dark and shows the `nft_image` widget instead of the product
    //   image for a mint-token or NFT purchase; the RPG fork removed collectibles and NFT. The
    //   widget stays in the layout until Task 10, so it is still hidden here as AS3 does for every
    //   other offer.
    // AS3: PurchaseConfirmationDialog.as::showConfirmationDialog()
    private showConfirmationDialog(offer: IPurchasableOffer, previewImage: ImageBitmap | null = null): void
    {
        const catalog = this._catalog;

        if(!catalog) return;

        this._window?.dispose();
        this._window = catalog.utils.createWindow('purchase_confirmation', 2) as unknown as IWindowContainer | null;

        if(!this._window) return;

        this._window.color = PurchaseConfirmationDialog.WINDOW_COLOR;

        this.updateLocalizations(offer);

        const priceBox = this._window.findChildByName('purchase_cost_box') as unknown as IWindowContainer | null;

        if(priceBox) catalog.utils.showPriceInContainer(priceBox, offer, this._quantity);

        this.addClickListener('buy_button', this._onBuyButtonClick);
        this.addClickListener('cancel_button', this._onClose);
        this.addClickListener('header_button_close', this._onClose);

        this.hideRaffle();
        this._window.center();

        if(catalog.getBoolean('disclaimer.credit_spending.enabled'))
        {
            const disclaimer = this._window.findChildByName('spending_disclaimer');

            disclaimer?.addEventListener(WindowMouseEvent.CLICK, this._onSpendingDisclaimerClicked);
            disclaimer?.addEventListener(WindowMouseEvent.DOUBLE_CLICK, this._onSpendingDisclaimerClicked);
            this.setDisclaimerAccepted(false);
        }
        else
        {
            this._window.findChildByName('disclaimer')?.dispose();
            this.setDisclaimerAccepted(true);
        }

        const productName = this._window.findChildByName('product_name');

        if(productName)
        {
            // AS3 writes `getProductData(localizationId)?.name` here, which is `null` when
            // productdata carries no row for the offer - and an unset caption leaves the layout's
            // own design placeholder ("001 lorem ipsum title that wraps around") on screen.
            //
            // Deviation, stated: fall back to `offer.localizationName`, which is AS3's own accessor
            // for this same string (`Offer.as::get localizationName()`) and answers `${<id>}` for a
            // missing row - so the dialog then shows exactly what the catalog page behind it shows
            // for the same offer, instead of a placeholder or a blank. Only the fallback differs;
            // when productdata has the row both paths return the identical name.
            productName.caption = catalog.getProductData(offer.localizationId)?.name || offer.localizationName;
        }

        const quantity = this._window.findChildByName('quantity');

        if(quantity)
        {
            if(catalog.multiplePurchaseEnabled && this._quantity > 1)
            {
                quantity.caption = `X ${this._quantity}`;
            }
            else
            {
                const properties = this._window.findChildByName('properties_itemlist') as unknown as IItemListWindow | null;

                properties?.removeListItem(quantity as unknown as IWindow);
            }
        }

        const freeQuantity = this._window.findChildByName('freeQuantity');

        if(freeQuantity) freeQuantity.visible = false;

        if(catalog.bundleDiscountEnabled)
        {
            const discountItemsCount = catalog.utils.getDiscountItemsCount(this._quantity);

            if(freeQuantity) freeQuantity.visible = discountItemsCount > 0;

            catalog.localization?.registerParameter('shop.bonus.items.count', 'amount', discountItemsCount.toString());
        }

        // The layout stacks the `nft_image` widget on top of the product bitmap; hide it.
        const nftImage = this._window.findChildByName('nft_image') as unknown as IWidgetWindow | null;
        const nftWidget = (nftImage?.widget as unknown as ProductImageWidget | null) ?? null;

        if(nftImage) (nftImage as unknown as IWindow).visible = false;

        nftWidget?.clearPreviewer();

        this.showProductImage(offer, previewImage);

        RentUtils.updateBuyCaption(offer, this._window.findChildByName('buy_button'));
    }

    /**
     * AS3: PurchaseConfirmationDialog.as::showConfirmationDialog() — the `getIconWrapper()` tail.
     *
     * Both halves of the ImageResult contract have to be honoured, exactly as AS3 does it
     * (`if(_loc6_ != null) { _loc13_ = _loc6_.data; _SafeStr_6872 = _loc6_.id; }`): a request whose
     * content is already loaded comes back **synchronously** with `id === 0` and `data` filled and
     * never calls `imageReady()`, while one that still has to load returns `id > 0` and answers
     * later. Reading only the callback is why the preview stayed blank for every cached furni — i.e.
     * essentially always, since the catalog has just rendered the same item in its grid.
     *
     * `ImageResult`'s own header still describes the old always-async behaviour; the body of
     * `RoomEngine.getGenericRoomObjectImage()` is what actually holds (it was changed to return
     * synchronously so the pet widgets' imageReady->updateImage chain would terminate).
     */
    // DEVIATION: AS3 also previews a `habbicon` offer from the habbicon spritesheet; the RPG fork
    //   removed Habbicons, so that type now takes the unknown-type warning. AS3 also shows the
    //   mint-token icon for a `MINT_TOKEN` purchase; the RPG fork removed collectibles.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::showConfirmationDialog()
    private showProductImage(offer: IPurchasableOffer, previewImage: ImageBitmap | null = null): void
    {
        const catalog = this._catalog;

        if(!catalog || this.getIconWrapper() == null) return;

        // A caller that already rendered the item hands its own bitmap over, and the whole
        // per-product-type switch below is skipped. The pet widgets are the ones that do it: they
        // have a rendered pet portrait on screen already and the dialog has no way to make one.
        if(previewImage !== null)
        {
            this.setImage(previewImage, true);

            return;
        }

        // A named picture wins over any rendered preview, for the handful of offers that have one.
        // AS3 falls through to the render when the asset is missing rather than showing nothing.
        if(CatalogProductImages.hasProductImage(offer.localizationId))
        {
            const named = this._windowManager?.getAsset(
                CatalogProductImages.PRODUCT_IMAGES[offer.localizationId]
            ) ?? null;

            if(named !== null)
            {
                // AS3 passes `false` here alone: the bitmap is the asset library's, not ours.
                this.setImage(named, false);

                return;
            }
        }

        const product = offer instanceof Offer ? offer.product : null;

        if(product == null) return;

        const roomEngine = catalog.roomEngine;
        const classId = product.productClassId;
        const extraParam = product.extraParam;
        let image: ImageBitmap | null = null;

        switch(this.productType)
        {
            case 's':
                if(roomEngine)
                {
                    const result = roomEngine.getFurnitureImage(
                        classId, new Vector3d(90, 0, 0), 64, this, 0, extraParam, -1, -1, this._stuffData);

                    image = result.data;
                    this._pendingImageId = result.id;
                }

                break;
            case 'i':
                if(roomEngine)
                {
                    const result = roomEngine.getWallItemImage(
                        classId, new Vector3d(90, 0, 0), 64, this, 0, extraParam);

                    image = result.data;
                    this._pendingImageId = result.id;
                }

                break;
            case 'e':
                image = catalog.getPixelEffectIcon(classId);

                break;
            case 'h':
                image = catalog.getSubscriptionProductIcon(classId);

                break;
            case 'r':
                // A bot offer: `extraParam` is the bot's figure. The render lands through the
                // promise (and again through avatarImageReady() if the figure had to download), so
                // nothing is assigned to `image` here.
                void this.renderBotImage(extraParam);

                break;
            case 'chat_style':
                // `extraParam` is the style id. The library owns the bitmap — AS3 clones it because
                // assigning a BitmapData transfers ownership; the port's wrapper does not take it.
                image = catalog.freeFlowChat?.chatStyleLibrary?.getStyle(parseInt(extraParam))?.selectorPreview ?? null;

                break;
            default:
                log.warn(`No purchase-confirmation preview for product type "${this.productType}"`);
        }

        // AS3 calls setImage() unconditionally at the end of the branch; setImage() is null-guarded,
        // so the pending case falls through to imageReady() without clearing what is there.
        this.setImage(image, true);
    }

    /**
     * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::avatarImageReady()
     *
     * The figure's assets have arrived; AS3 re-renders the preview from them, whatever figure it
     * was — the dialog only ever asks for one.
     *
     * The player's own figure arriving means the gift card's sender face can be drawn, which is a
     * different picture from the offer preview — hence the two branches rather than one.
     */
    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::avatarImageReady()
    avatarImageReady(figureString: string): void
    {
        if(this._catalog === null || this._window === null || this._window.disposed || this.disposed) return;

        if(figureString === this._catalog.sessionDataManager?.figure)
        {
            this.updateGiftDialogAvatarImage();

            return;
        }

        void this.renderBotImage(figureString);
    }

    /**
     * AS3: PurchaseConfirmationDialog.as::updateImage() ("r" branch) and ::avatarImageReady() —
     * both build the same picture: body facing 3, waving, smiling, and the highlighted "full"
     * image rather than the cropped one.
     *
     * The render is asynchronous here for the reason `AvatarImageSnapshot` documents.
     */
    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::updateImage() ("r" branch)
    private async renderBotImage(figureString: string): Promise<void>
    {
        const avatarImage = this._catalog?.avatarRenderManager?.createAvatarImage(
            figureString, 'h', null, this, null
        ) ?? null;

        if(avatarImage === null) return;

        avatarImage.setDirection('full', 3);
        avatarImage.appendAction(AvatarAction.EXPRESSION_WAVE);
        avatarImage.appendAction(AvatarAction.GESTURE, AvatarAction.GESTURE_SMILE);

        const bitmap = await textureToBitmap(avatarImage.getImage('full', true));

        avatarImage.dispose();

        if(this.disposed) return;

        this.setImage(bitmap, true);
    }

    // AS3: PurchaseConfirmationDialog.as::imageReady()
    imageReady(id: number, data: ImageBitmap | null): void
    {
        if(id !== this._pendingImageId) return;

        this._pendingImageId = 0;
        this.setImage(data, true);
    }

    // AS3: PurchaseConfirmationDialog.as::imageFailed()
    imageFailed(_id: number): void
    {
    }

    /**
     * AS3: PurchaseConfirmationDialog.as::setImage()
     *
     * AS3 allocates a BitmapData the size of the wrapper and blits the preview into its centre;
     * the wrapper is a fixed 126x152 slot in the layout, so a small icon must not stretch to fill
     * it. The OffscreenCanvas here is the same operation — the port's bitmap wrappers take an
     * ImageBitmap, and assigning the raw preview would let fitSize() scale it.
     *
     * `disposeSource` is AS3's second parameter, and it is not cosmetic: the source is blitted, so
     * whoever rendered it hands ownership over (`true`), while a library asset must survive
     * (`false`). The port had dropped the parameter and always closed — which detaches the shared
     * `ImageBitmap`, and every later `drawImage` of it throws `InvalidStateError: The image source
     * is detached` mid-paint. See `@habbo/notifications/utils/copyBitmap` for the same failure.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::setImage()
    private setImage(image: ImageBitmap | null, disposeSource: boolean): void
    {
        if(this._disposed || image == null) return;

        const wrapper = this.getIconWrapper();

        if(wrapper == null) return;

        const width = Math.max(1, wrapper.width);
        const height = Math.max(1, wrapper.height);
        const canvas = new OffscreenCanvas(width, height);
        const context = canvas.getContext('2d');

        if(context == null) return;

        context.drawImage(image, Math.floor((width - image.width) * 0.5), Math.floor((height - image.height) * 0.5));

        wrapper.bitmap = canvas.transferToImageBitmap();

        if(disposeSource) image.close();
    }

    // AS3: PurchaseConfirmationDialog.as::updateLocalizations()
    private updateLocalizations(offer: IPurchasableOffer): void
    {
        const name = this._catalog?.getProductData(offer.localizationId)?.name ?? '';

        this._windowManager?.registerLocalizationParameter('catalog.purchase.confirmation.dialog.costs', 'offer_name', name);
    }

    // AS3: PurchaseConfirmationDialog.as::addClickListener()
    private addClickListener(name: string, listener: (event: WindowEvent) => void): void
    {
        this._window?.findChildByName(name)?.addEventListener(WindowMouseEvent.CLICK, listener);
    }

    /**
     * AS3: PurchaseConfirmationDialog.as::hideRaffle()
     *
     * The notification fires on the *timer*, not on the container: this runs from `dispose()` too,
     * and a player who closes the dialog mid-draw is still in the raffle — the notice is what tells
     * them so. A finished draw has already cleared the timer in `ltdRaffleEnded()`, so it stays
     * quiet there.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::hideRaffle()
    private hideRaffle(): void
    {
        const raffle = this._window?.findChildByName('raffle_container');

        if(raffle != null && raffle.visible)
        {
            raffle.visible = false;

            if(this._raffleTimer !== null) this._catalog?.notifications?.addItem('${notification.raffle.ongoing}', 'ltd');
        }
    }

    // AS3: PurchaseConfirmationDialog.as::_raffleTimer
    // Name DERIVED (`_SafeStr_5045`): obfuscated in every tree, named after what it drives. AS3
    // holds a repeating `Timer(150)`, which is `setInterval` here.
    private _raffleTimer: ReturnType<typeof setInterval> | null = null;

    // AS3: PurchaseConfirmationDialog.as::_raffleDotCount
    // Name DERIVED (`_SafeStr_5961`): the number of dots currently trailing the "raffling" caption.
    private _raffleDotCount: number = 0;

    /**
     * The server has taken the entry: show the "raffling…" panel and start its dots.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::ltdRaffleStarted()
    ltdRaffleStarted(): void
    {
        if(this._disposed || this._window == null) return;

        const raffle = this._window.findChildByName('raffle_container');

        if(raffle != null) raffle.visible = true;

        this._raffleDotCount = 1;
        this.updateDots();

        if(this._raffleTimer === null) this._raffleTimer = setInterval(this.onRaffleTimerTick, 150);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::onRaffleTimerTick()
    private onRaffleTimerTick = (): void =>
    {
        if(this._disposed) return;

        this._raffleDotCount += 1;

        // AS3 wraps back to 1, not to 0 — the caption never shows with no dot at all.
        if(this._raffleDotCount > 14) this._raffleDotCount = 1;

        this.updateDots();
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::updateDots()
    private updateDots(): void
    {
        const text = this._window?.findChildByName('raffle_text') as ITextWindow | null;

        if(text == null) return;

        const caption = this._catalog?.localization?.getLocalization('catalog.purchase.confirmation.dialog.raffling') ?? '';

        text.text = caption + '.'.repeat(this._raffleDotCount);
    }

    // AS3: PurchaseConfirmationDialog.as::setDisclaimerAccepted()
    private setDisclaimerAccepted(accepted: boolean): void
    {
        const button = this._window?.findChildByName('buy_button');

        if(button == null) return;

        if(accepted) button.enable();
        else button.disable();
    }

    // AS3: PurchaseConfirmationDialog.as::onSpendingDisclaimerClicked()
    // AS3 reads the checkbox off `param1.target`; this port's dispatcher hands listeners the event
    // only (no second `window` argument), so the target is the sole way to reach it.
    private _onSpendingDisclaimerClicked = (event: WindowEvent): void =>
    {
        const checkbox = event.target as unknown as ISelectableWindow | null;

        if(checkbox != null) this.setDisclaimerAccepted(checkbox.isSelected);
    };

    // DEVIATION: AS3 first returns on a `habbicon` offer when `habbicons.enabled` is off or the
    //   habbicon is already owned (with an alert); the RPG fork removed Habbicons. AS3 also sends
    //   the mint-token and NFT store purchases on their own composers; the RPG fork removed them.
    // AS3: PurchaseConfirmationDialog.as::onBuyButtonClick()
    private _onBuyButtonClick = (): void =>
    {
        const catalog = this._catalog;

        if(!catalog) return;

        // AS3 disables all three before sending, so a second click cannot double-buy while the
        // server answer is in flight. `publish_check` belongs to the room-ad variant of the layout.
        this.safeDisable('buy_button');
        this.safeDisable('cancel_button');
        this.safeDisable('publish_check');

        catalog.purchaseProduct(this._pageId, this._offerId, this._extraParam, this._quantity);
        catalog.currentPage?.dispatchWidgetEvent(new CatalogWidgetEvent('PURCHASE'));
    };

    // AS3: PurchaseConfirmationDialog.as::onClose()
    private _onClose = (): void =>
    {
        this._catalog?.resetPlacedOfferData();
        this.dispose();
    };

    // AS3: PurchaseConfirmationDialog.as::safeDisable()
    private safeDisable(name: string): void
    {
        this._window?.findChildByName(name)?.disable();
    }

    // AS3: PurchaseConfirmationDialog.as::safeEnable()
    private safeEnable(name: string): void
    {
        this._window?.findChildByName(name)?.enable();
    }

    /**
     * Enable or disable the gift dialog's send button
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::enableGiftButton()
    private enableGiftButton(enabled: boolean): void
    {
        if(this._window == null) return;

        if(enabled) this.safeEnable('give_gift_button');
        else this.safeDisable('give_gift_button');
    }

    /**
     * The server could not find the player this gift was addressed to
     *
     * Re-enables the send button so the name can be corrected and tried again — a rejected gift
     * is recoverable, unlike a rejected purchase.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::receiverNotFound()
    receiverNotFound(): void
    {
        if(this._disposed) return;

        this.enableGiftButton(true);

        this._windowManager?.alert(
            '${catalog.gift_wrapping.receiver_not_found.title}',
            '${catalog.gift_wrapping.receiver_not_found.info}',
            0,
            this.onReceiverNotFoundAlert
        );
    }

    /**
     * Dismissing the not-found alert leaves the dialog usable
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::alertHandler()
    // AS3 re-enables the button a second time here, after `receiverNotFound()` already did; kept,
    // because the alert is modal and the dialog behind it can be reached in between.
    private onReceiverNotFoundAlert = (dialog: IDisposable): void =>
    {
        dialog.dispose();

        this.enableGiftButton(true);
    };

    /**
     * AS3: PurchaseConfirmationDialog.as::notEnoughCredits()
     *
     * Note what AS3 does NOT do here: it never re-enables `buy_button`/`cancel_button`. A rejected
     * purchase leaves them dead on purpose and the close button is the way out - which is why the
     * one call that matters in the non-gift path is the `header_button_close` re-enable.
     *
     * The `use_free_checkbox` re-select puts the gift dialog back on the free default box, which
     * is the one choice a rejected purchase can still afford.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::notEnoughCredits()
    notEnoughCredits(): void
    {
        if(this._disposed || this._window == null) return;

        (this._window.findChildByName('use_free_checkbox') as unknown as ISelectableWindow | null)?.select();
        this.enableGiftButton(true);
        this.safeEnable('header_button_close');
    }

    /**
     * AS3: PurchaseConfirmationDialog.as::ltdRaffleEnded()
     *
     * Hides the panel directly rather than through `hideRaffle()`: the draw is over, so the
     * "you are still in the raffle" notice would be wrong. Clearing the timer first is what keeps
     * a later `dispose()` quiet too.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::ltdRaffleEnded()
    ltdRaffleEnded(): void
    {
        if(this._disposed) return;

        const raffle = this._window?.findChildByName('raffle_container');

        if(raffle != null) raffle.visible = false;

        if(this._raffleTimer !== null)
        {
            clearInterval(this._raffleTimer);
            this._raffleTimer = null;
        }
    }

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::dispose()
    /**
     * Replaces the confirmation window with the gift-wrapping one.
     *
     * The old window is disposed first — this is a replacement, not a second dialog — so
     * everything below re-resolves its children against the new `gift_wrapping` layout.
     */
    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::showGiftDialog()
    showGiftDialog(): void
    {
        const catalog = this._catalog;

        if(catalog === null) return;

        this._window?.dispose();

        const configuration = catalog.giftWrappingConfiguration;
        const window = catalog.utils.createWindow('gift_wrapping') as IWindowContainer | null;

        if(window === null || configuration === null) return;

        this._window = window;
        this._suggestionContainer = null;
        window.center();

        this.addClickListener('give_gift_button', this._onGiveGiftButtonClick);
        this.addClickListener('cancel_link_region', this._onCancelGift);
        this.addClickListener('header_button_close', this._onCancelGift);

        const nameInput = window.findChildByName('name_input');

        if(nameInput !== null)
        {
            if(this._userName !== null) this.setReceiverName(this._userName);
            else this.focusNameField();

            this.updateNameHint();
            nameInput.addEventListener(WindowEvent.WE_CHANGE, this._onNameInputChange);
            nameInput.addEventListener(WindowMouseEvent.DOWN, this._onNameInputMouseDown);
            nameInput.addEventListener(WindowKeyboardEvent.KEY_UP, this._onNameInputKeyUp);
            nameInput.addEventListener(WindowEvent.WE_FOCUSED, this._onNameInputFocus);
            nameInput.addEventListener(WindowEvent.WE_UNFOCUSED, this._onNameInputUnfocus);
        }

        // The card art is fetched over HTTP rather than out of the asset library, which is why
        // this is an `assetUri` and not a `bitmap`; an empty property leaves the slot as authored.
        const giftCard = window.findChildByName('gift_card') as unknown as {assetUri?: string} | null;
        const cardName = catalog.getProperty('catalog.gift_wrapping_new.gift_card');

        if(giftCard !== null && cardName !== '')
        {
            giftCard.assetUri = `\${image.library.url}Giftcards/${cardName}.png`;
        }

        // Only a moderator may send anonymously, so only a moderator gets the checkbox — for
        // everyone else `isShowPurchaserName()` answers true unconditionally.
        const showFaceCheckbox = window.findChildByName('show_face_checkbox') as unknown as ISelectableWindow | null;
        const isModerator = this.isModerator();

        if(showFaceCheckbox !== null)
        {
            const asWindow = showFaceCheckbox as unknown as IWindow;

            asWindow.visible = isModerator;

            if(isModerator)
            {
                showFaceCheckbox.select();
                asWindow.addEventListener(WindowEvent.WE_SELECT, this._onShowFaceSelected);
                asWindow.addEventListener(WindowEvent.WE_UNSELECT, this._onShowFaceUnselected);
            }
        }

        const showFaceTitle = window.findChildByName('show_face_checkbox_title');

        if(showFaceTitle !== null && !isModerator) showFaceTitle.visible = false;

        this.updateGiftDialogAvatarImage();

        const messageInput = window.findChildByName('message_input');

        if(messageInput !== null)
        {
            this.updateMessageHint();
            messageInput.addEventListener(WindowEvent.WE_CHANGE, this._onMessageInputChange);
            messageInput.addEventListener(WindowEvent.WE_FOCUSED, this._onMessageInputFocus);
            messageInput.addEventListener(WindowEvent.WE_UNFOCUSED, this._onMessageInputUnfocus);
        }

        const messageFrom = window.findChildByName('message_from');

        if(messageFrom !== null)
        {
            const senderName = catalog.sessionDataManager?.userName ?? '';
            const key = 'catalog.gift_wrapping_new.message_from';

            this._windowManager?.registerLocalizationParameter(key, 'name', senderName);
            messageFrom.caption = catalog.localization?.getLocalization(key, senderName) ?? senderName;
        }

        this.addClickListener('ribbon_prev', this._onPreviousGiftWrap);
        this.addClickListener('ribbon_next', this._onNextGiftWrap);
        this.addClickListener('box_prev', this._onPreviousGiftBox);
        this.addClickListener('box_next', this._onNextGiftBox);

        this._windowManager?.registerLocalizationParameter(
            'catalog.gift_wrapping_new.price', 'price', configuration.price.toString());

        // The free box is picked at random per dialog, so two openings in a row are not
        // necessarily offered the same one.
        if(configuration.defaultStuffTypes.length > 0)
        {
            const index = Math.floor(Math.random() * configuration.defaultStuffTypes.length);

            this._defaultStuffType = configuration.defaultStuffTypes[index]!;
        }

        this._stuffTypes = configuration.stuffTypes;
        this._boxTypes = this._boxTypes.concat(configuration.boxTypes);
        this._boxTypes.push(this._defaultStuffType);
        this._ribbonTypes = configuration.ribbonTypes;
        this._selectedStuffType = this._stuffTypes[0] ?? 0;
        this._selectedRibbonIndex = 0;
        this._selectedBoxIndex = catalog.getInteger('catalog.purchase.gift_wrapping.default_box_index', 0);

        if(this._selectedBoxIndex < 0 || this._selectedBoxIndex > this._boxTypes.length - 1)
        {
            this._selectedBoxIndex = 0;
        }

        this.initColorGrid();
        this.updateColorGrid();
        this.updatePreview();
    }

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::isModerator()
    private isModerator(): boolean
    {
        return this._catalog?.sessionDataManager?.hasSecurity(5) ?? false;
    }

    /** The free box is the one appended past the configuration's own list. */
    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::isDefaultBoxSelected()
    private isDefaultBoxSelected(): boolean
    {
        return this._boxTypes[this._selectedBoxIndex] === this._defaultStuffType;
    }

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::isValentinesBox()
    private static isValentinesBox(boxType: number): boolean
    {
        return boxType === 8;
    }

    /**
     * Re-renders the wrapped preview and re-enables whichever selectors the current box allows.
     *
     * Both indices wrap rather than clamp, which is what makes prev/next cycle. Three boxes take
     * away choices: the free one has no wrapping at all, the valentines box forces ribbon 10, and
     * boxes 3-6 fix their own colour.
     */
    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::updatePreview()
    private updatePreview(): void
    {
        if(this._selectedRibbonIndex < 0) this._selectedRibbonIndex = this._ribbonTypes.length - 1;
        if(this._selectedRibbonIndex > this._ribbonTypes.length - 1) this._selectedRibbonIndex = 0;
        if(this._selectedBoxIndex < 0) this._selectedBoxIndex = this._boxTypes.length - 1;
        if(this._selectedBoxIndex > this._boxTypes.length - 1) this._selectedBoxIndex = 0;

        const boxType = this._boxTypes[this._selectedBoxIndex] ?? 0;

        if(PurchaseConfirmationDialog.isValentinesBox(boxType))
        {
            this._selectedRibbonIndex = 10;

            if(this._selectedRibbonIndex > this._ribbonTypes.length - 1) this._selectedRibbonIndex = 0;
        }

        const roomEngine = this._catalog?.roomEngine ?? null;

        if(this._window === null || roomEngine === null) return;

        const isDefaultBox = this.isDefaultBoxSelected();
        let extra = (boxType * 1000 + (this._ribbonTypes[this._selectedRibbonIndex] ?? 0)).toString();
        let stuffType = this._selectedStuffType;

        if(isDefaultBox)
        {
            this.enableBoxColorAndRibbonSelectors(false);
            stuffType = this._defaultStuffType;
            extra = '';
        }
        else if(PurchaseConfirmationDialog.isValentinesBox(boxType))
        {
            this.enableBoxColorAndRibbonSelectors(false);
        }
        else
        {
            this.enableBoxColorAndRibbonSelectors(true);

            if(boxType >= 3 && boxType <= 6) this.enableBoxColorSelectors(false);
        }

        const result = roomEngine.getFurnitureImage(stuffType, new Vector3d(180), 64, this, 0, extra);

        if(result === null) return;

        this._pendingImageId = result.id;
        this.setImage(result.data, true);
        this.showSuggestions(false);
        this.updateGiftDialogLabels();
    }

    /** One clickable swatch per stuff type, tinted from the furniture's own first colour. */
    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::initColorGrid()
    private initColorGrid(): void
    {
        if(this._window === null) return;

        const grid = this._window.findChildByName('color_grid') as unknown as IItemGridWindow | null;

        if(grid === null) return;

        grid.destroyGridItems();

        const template = this._catalog?.utils.createWindow('gift_palette_item') as IWindowContainer | null;

        if(template == null) return;

        for(const stuffType of this._stuffTypes)
        {
            const furnitureData = this._catalog?.getFurnitureData(stuffType, 's') ?? null;
            const item = template.clone() as IWindowContainer | null;

            if(furnitureData === null || item == null) continue;

            item.addEventListener(WindowMouseEvent.CLICK, this._onColorItemClick);

            const colorChild = item.findChildByName('color');

            if(colorChild !== null) colorChild.color = furnitureData.colours?.[0] ?? 0;

            item.id = stuffType;
            grid.addGridItem(item as unknown as IWindow);
        }
    }

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::updateColorGrid()
    private updateColorGrid(): void
    {
        if(this._window === null) return;

        const grid = this._window.findChildByName('color_grid') as unknown as IItemGridWindow | null;

        if(grid === null) return;

        for(let i = 0; i < grid.numGridItems; i++)
        {
            const item = grid.getGridItemAt(i) as unknown as IWindowContainer | null;
            const selection = item?.findChildByName('selection') ?? null;

            if(item != null && selection !== null) selection.visible = item.id === this._selectedStuffType;
        }
    }

    /**
     * Sends the purchase.
     *
     * The free box sends zeroes for the box and ribbon rather than the selected indices — the
     * server reads that triple as "unwrapped", so passing the greyed-out selectors' values would
     * charge for wrapping that was never offered.
     */
    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::giveGift()
    private giveGift(): void
    {
        const nameInput = this._window?.findChildByName('name_input') ?? null;

        if(nameInput === null) return;

        const messageInput = this._window?.findChildByName('message_input') ?? null;
        const isDefaultBox = this.isDefaultBoxSelected();

        this._catalog?.purchaseProductAsGift(
            this._pageId,
            this._offerId,
            this._extraParam,
            nameInput.caption,
            messageInput?.caption ?? null,
            isDefaultBox ? this._defaultStuffType : this._selectedStuffType,
            isDefaultBox ? 0 : (this._boxTypes[this._selectedBoxIndex] ?? 0),
            isDefaultBox ? 0 : (this._ribbonTypes[this._selectedRibbonIndex] ?? 0),
            this.isShowPurchaserName()
        );
    }

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::isShowPurchaserName()
    private isShowPurchaserName(): boolean
    {
        if(!this.isModerator()) return true;

        const checkbox = this._window?.findChildByName('show_face_checkbox') as unknown as ISelectableWindow | null;

        return checkbox?.isSelected ?? false;
    }

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::enableBoxColorAndRibbonSelectors()
    private enableBoxColorAndRibbonSelectors(enabled: boolean): void
    {
        this.enableBoxColorSelectors(enabled);
        this.enableRibbonSelectors(enabled);
    }

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::enableBoxColorSelectors()
    private enableBoxColorSelectors(enabled: boolean): void
    {
        if(this._window === null) return;

        this.enableWindow(this._window.findChildByName('box_color_title'), enabled);
        this.enableWindow(this._window.findChildByName('color_picker_container'), enabled);
    }

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::enableRibbonSelectors()
    private enableRibbonSelectors(enabled: boolean): void
    {
        if(this._window === null) return;

        this.enableWindow(this._window.findChildByName('ribbon_prev'), enabled);
        this.enableWindow(this._window.findChildByName('ribbon_next'), enabled);
        this.enableWindow(this._window.findChildByName('pick_ribbon_title'), enabled);
    }

    /** Enable/disable a window and, when it has children, each of them too. */
    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::enableWindow()
    private enableWindow(window: IWindow | null, enabled: boolean): void
    {
        if(window === null) return;

        if(enabled) window.enable();
        else window.disable();

        // `iterator` is a method returning an IIterator here, not the AS3 Proxy array — iterating
        // it with for...of threw "is not iterable" on every gift-wrap change.
        const iterable = window as unknown as Partial<IIterable>;

        if(typeof iterable.iterator !== 'function') return;

        const iterator = iterable.iterator();

        if(iterator === null) return;

        for(let child = iterator.next(); child !== null; child = iterator.next())
        {
            this.enableWindow(child, enabled);
        }
    }

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::updateGiftDialogLabels()
    private updateGiftDialogLabels(): void
    {
        const window = this._window;

        if(window === null || window.disposed) return;

        const isDefaultBox = this.isDefaultBoxSelected();

        this.setLabelFromKey('pick_box_title', isDefaultBox
            ? 'catalog.gift_wrapping_new.box.default'
            : `catalog.gift_wrapping_new.box.${this._boxTypes[this._selectedBoxIndex]}`);

        this.setLabelFromKey('pick_box_price_title', isDefaultBox
            ? 'catalog.gift_wrapping_new.freeprice'
            : 'catalog.gift_wrapping_new.price');

        // The coin icon comes and goes with the price, and the list has to re-arrange because
        // removing it from view leaves a hole otherwise.
        const priceContainer = window.findChildByName('price_box_container') as unknown as IItemListWindow | null;
        const coin = priceContainer?.getListItemByName('small_coin') ?? null;

        if(priceContainer != null && coin !== null)
        {
            coin.visible = !isDefaultBox;
            priceContainer.arrangeListItems();
        }

        this.setLabelFromKey('pick_ribbon_title', `catalog.gift_wrapping_new.ribbon.${this._selectedRibbonIndex}`);
    }

    /**
     * TS-only: AS3 repeats this getLocalizationRaw/fall-back-to-the-key block three times inside
     * `updateGiftDialogLabels()`. The behaviour is AS3's — an unknown key shows as itself.
     */
    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::updateGiftDialogLabels()
    private setLabelFromKey(childName: string, key: string): void
    {
        const label = this._window?.findChildByName(childName) as unknown as ITextWindow | null;

        if(label == null) return;

        label.text = this._catalog?.localization?.getLocalizationRaw(key)?.value ?? key;
    }

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::updateGiftDialogAvatarImage()
    private updateGiftDialogAvatarImage(): void
    {
        const figure = this._catalog?.sessionDataManager?.figure ?? null;

        if(figure === null) return;

        void this.getAvatarFaceBitmap(figure).then(image => this.updateAvatarImage(image));
    }

    /** The anonymous sender's placeholder, used when a moderator unticks "show face". */
    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::updateUnknownSenderAvatarImage()
    private updateUnknownSenderAvatarImage(): void
    {
        const asset = this._catalog?.assets?.getAssetByName('gift_incognito') ?? null;

        this.updateAvatarImage((asset?.content as ImageBitmap | null) ?? null);
    }

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::updateAvatarImage()
    private updateAvatarImage(image: ImageBitmap | null): void
    {
        if(image === null) return;

        const target = this._window?.findChildByName('avatar_image') as (IWindow & {bitmap: ImageBitmap | null}) | null;

        if(target === null) return;

        target.bitmap = image;
        target.width = image.width;
        target.height = image.height;
    }

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::enableGiftDialogAvatarImage()
    private enableGiftDialogAvatarImage(enabled: boolean): void
    {
        if(this._window?.findChildByName('avatar_image') != null)
        {
            if(enabled) this.updateGiftDialogAvatarImage();
            else this.updateUnknownSenderAvatarImage();
        }

        const messageFrom = this._window?.findChildByName('message_from') ?? null;

        if(messageFrom !== null) messageFrom.visible = enabled;
    }

    // ── Receiver name field and its suggestion list ──────────────────────────────────────────

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::setReceiverName()
    private setReceiverName(name: string): void
    {
        const nameInput = this._window?.findChildByName('name_input') ?? null;

        if(nameInput === null) return;

        nameInput.caption = name;
        this.updateNameHint();
        this.focusMessageField();
    }

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::focusNameField()
    private focusNameField(): void
    {
        this.focusField('name_input');
    }

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::focusMessageField()
    private focusMessageField(): void
    {
        this.focusField('message_input');
    }

    // TS-only: focusNameField() and focusMessageField() are the same three lines in AS3.
    private focusField(childName: string): void
    {
        const field = this._window?.findChildByName(childName) as unknown as (IWindow & {focus: () => void}) | null;

        if(field == null) return;

        field.visible = true;
        field.focus();
    }

    /** Alternating row tint; the highlighted row overrides it with the selection colour. */
    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::getColor()
    private static getColor(index: number): number
    {
        return (index % 2 === 0) ? 4293848814 : 4294967295;
    }

    /**
     * Rebuilds the suggestion list, bolding the part of each name the player has typed.
     *
     * `showMessageInput(names.length < 2)` is AS3's: one suggestion leaves room for the message
     * field below, more than one covers it.
     */
    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::updateSuggestions()
    private updateSuggestions(names: string[]): void
    {
        if(this._suggestionContainer === null)
        {
            this._suggestionContainer = this._window?.findChildByName('suggestion_container') as IWindowContainer | null;
        }

        if(this._suggestionItemTemplate === null)
        {
            this._suggestionItemTemplate =
                this._catalog?.utils.createWindow('suggestion_list_item_new') as IWindowContainer | null;
        }

        if(this._suggestionContainer == null || this._suggestionItemTemplate == null) return;

        const list = this._suggestionContainer.findChildByName('suggestion_list') as unknown as IItemListWindow | null;

        if(list == null) return;

        list.removeListItems();

        if(names.length === 0)
        {
            this.showSuggestions(false);

            return;
        }

        this.showSuggestions(true);

        let index = 0;

        for(const name of names)
        {
            const item = this._suggestionItemTemplate.clone() as IWindowContainer | null;

            if(item == null) continue;

            item.addEventListener(WindowMouseEvent.CLICK, this._onSuggestionsClick);
            item.addEventListener(WindowMouseEvent.OVER, this._onSuggestionsMouseOver);

            const nameText = item.findChildByName('name_text') as unknown as ITextWindow | null;

            if(nameText == null) continue;

            nameText.text = name;

            const typedLength = this._receiverName.length;

            if(typedLength > 0)
            {
                const start = name.toLowerCase().search(this._receiverName.toLowerCase());

                if(start !== -1)
                {
                    const format = nameText.getTextFormat();

                    format.bold = true;
                    nameText.setTextFormat(format, start, Math.min(start + typedLength, name.length));
                }
            }

            list.addListItem(item as unknown as IWindow);
            item.color = PurchaseConfirmationDialog.getColor(index);
            index++;
        }

        this.showMessageInput(names.length < 2);
        this.highlightSuggestion(0);
    }

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::highlightSuggestion()
    private highlightSuggestion(index: number): void
    {
        const list = this._suggestionContainer?.findChildByName('suggestion_list') as unknown as IItemListWindow | null;

        if(list == null) return;

        const previous = list.getListItemAt(this._highlightIndex) as unknown as IWindow | null;

        if(previous != null) previous.color = PurchaseConfirmationDialog.getColor(this._highlightIndex);

        this._highlightIndex = index;

        if(this._highlightIndex < 0) this._highlightIndex = list.numListItems - 1;
        if(this._highlightIndex >= list.numListItems) this._highlightIndex = 0;

        const current = list.getListItemAt(this._highlightIndex) as unknown as IWindow | null;

        if(current != null) current.color = 4291613146;
    }

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::selectHighlighted()
    private selectHighlighted(): void
    {
        if(this._suggestionContainer === null || !this._suggestionContainer.visible) return;

        const list = this._suggestionContainer.findChildByName('suggestion_list') as unknown as IItemListWindow | null;
        const item = list?.getListItemAt(this._highlightIndex) as unknown as IWindowContainer | null;
        const nameText = item?.findChildByName('name_text') ?? null;

        if(nameText === null) return;

        this.setReceiverName(nameText.caption);
        this.showSuggestions(false);
    }

    /** Every friend, capped at ten — what the down arrow opens on an empty field. */
    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::showAllFriendSuggestions()
    private showAllFriendSuggestions(): boolean
    {
        if(this._friendNames.length === 0) return false;

        this.updateSuggestions(this._friendNames.slice(0, 10));
        this.showSuggestions(true);

        return true;
    }

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::showSuggestions()
    private showSuggestions(visible: boolean): void
    {
        if(this._suggestionContainer === null) return;

        this._suggestionContainer.visible = visible;

        if(!visible) this.showMessageInput(true);
    }

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::showMessageInput()
    private showMessageInput(visible: boolean): void
    {
        const messageInput = this._window?.findChildByName('message_input') ?? null;

        if(messageInput !== null) messageInput.visible = visible;
    }

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::updateNameHint()
    private updateNameHint(): void
    {
        const nameInput = this._window?.findChildByName('name_input') ?? null;

        if(nameInput === null) return;

        this.enableHint(nameInput.caption.length === 0, 'name_input_hint', 'catalog.gift_wrapping_new.name_hint');
    }

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::updateMessageHint()
    private updateMessageHint(): void
    {
        const messageInput = this._window?.findChildByName('message_input') ?? null;

        if(messageInput === null) return;

        this.enableHint(messageInput.caption.length === 0, 'message_input_hint', 'catalog.gift_wrapping_new.message_hint');
    }

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::enableHint()
    private enableHint(visible: boolean, childName: string, localizationKey: string): void
    {
        const hint = this._window?.findChildByName(childName) as unknown as ITextWindow | null;

        if(hint == null) return;

        hint.text = this._catalog?.localization?.getLocalization(localizationKey) ?? localizationKey;
        (hint as unknown as IWindow).visible = visible;
    }

    // ── Gift dialog event handlers ──────────────────────────────────────────────────────────

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::onGiftButtonClick()
    private _onGiftButtonClick = (): void =>
    {
        this.showGiftDialog();
        // DEVIATION: AS3 reaches tracking through a HabboTracking.getInstance() singleton; the port
        //   has none by design, and exposes it on the catalog's DI dependency instead.
        this._catalog?.tracking?.trackEventLog('Catalog', 'clickConfirm', 'client.buy_as_gift.clicked');
    };

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::onGiveGiftButtonClick()
    private _onGiveGiftButtonClick = (): void =>
    {
        this.giveGift();
        this.enableGiftButton(false);

        if(this._catalog !== null) this._catalog.giftReceiver = '';

        this._catalog?.resetPlacedOfferData();
    };

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::onCancelGift()
    private _onCancelGift = (): void =>
    {
        this._catalog?.resetPlacedOfferData();
        this.dispose();
    };

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::onPreviousGiftWrap()
    private _onPreviousGiftWrap = (): void =>
    {
        this._selectedRibbonIndex--;
        this.updatePreview();
    };

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::onNextGiftWrap()
    private _onNextGiftWrap = (): void =>
    {
        this._selectedRibbonIndex++;
        this.updatePreview();
    };

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::onPreviousGiftBox()
    private _onPreviousGiftBox = (): void =>
    {
        this._selectedBoxIndex--;
        this.updatePreview();
    };

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::onNextGiftBox()
    private _onNextGiftBox = (): void =>
    {
        this._selectedBoxIndex++;
        this.updatePreview();
    };

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::onColorItemClick()
    private _onColorItemClick = (event: WindowEvent): void =>
    {
        this._selectedStuffType = event.target?.id ?? 0;
        this.updateColorGrid();
        this.updatePreview();
    };

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::onShowFaceSelected()
    private _onShowFaceSelected = (): void =>
    {
        this.enableGiftDialogAvatarImage(true);
        this.updateGiftDialogAvatarImage();
    };

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::onShowFaceUnselected()
    private _onShowFaceUnselected = (): void =>
    {
        this.enableGiftDialogAvatarImage(false);
    };

    /** Filters the friend list to at most ten names containing what has been typed. */
    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::onNameInputChange()
    private _onNameInputChange = (event: WindowEvent): void =>
    {
        const target = event.target;

        if(target === null) return;

        this.updateNameHint();

        if(this._receiverName === target.caption) return;

        const typed = target.caption.toLowerCase();
        const matches: string[] = [];

        for(const name of this._friendNames)
        {
            if(name.toLowerCase().search(typed) !== -1) matches.push(name);
            if(matches.length >= 10) break;
        }

        this._receiverName = target.caption;
        this.updateSuggestions(matches);
    };

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::onNameInputMouseDown()
    private _onNameInputMouseDown = (): void =>
    {
        this.showSuggestions(false);
    };

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::onNameInputKeyUp()
    private _onNameInputKeyUp = (event: WindowEvent): void =>
    {
        const keyCode = (event as WindowKeyboardEvent).keyCode;

        switch(keyCode)
        {
            case 38:
                this.highlightSuggestion(this._highlightIndex - 1);
                break;

            case 40:
                this.highlightSuggestion(this._highlightIndex + 1);

                // Down on an empty field with the list closed opens the whole friend list.
                if((event.target?.caption.length ?? 0) === 0
                    && (this._suggestionContainer === null || !this._suggestionContainer.visible)
                    && this.showAllFriendSuggestions())
                {
                    this.highlightSuggestion(0);
                }

                break;

            case 13:
                this.selectHighlighted();
                break;

            case 9:
                this.focusMessageField();
                break;
        }
    };

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::onNameInputFocus()
    private _onNameInputFocus = (): void => this.updateNameHint();

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::onNameInputUnfocus()
    private _onNameInputUnfocus = (): void => this.updateNameHint();

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::onMessageInputChange()
    private _onMessageInputChange = (): void => this.updateMessageHint();

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::onMessageInputFocus()
    private _onMessageInputFocus = (): void =>
    {
        this.updateMessageHint();
        this.showSuggestions(false);
    };

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::onMessageInputUnfocus()
    private _onMessageInputUnfocus = (): void => this.updateMessageHint();

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::onSuggestionsClick()
    private _onSuggestionsClick = (event: WindowEvent): void =>
    {
        const item = event.target as unknown as IWindowContainer | null;
        const nameText = item?.findChildByName('name_text') ?? null;

        if(nameText == null) return;

        this.setReceiverName(nameText.caption);
        this.showSuggestions(false);
    };

    // AS3: .../src/com/sulake/habbo/catalog/purchase/PurchaseConfirmationDialog.as::onSuggestionsMouseOver()
    private _onSuggestionsMouseOver = (event: WindowEvent): void =>
    {
        const item = event.target;
        const list = this._suggestionContainer?.findChildByName('suggestion_list') as unknown as IItemListWindow | null;

        if(item === null || list == null) return;

        this.highlightSuggestion(list.getListItemIndex(item));
    };

    dispose(): void
    {
        if(this._disposed) return;

        // hideRaffle() first, so a dialog closed mid-draw still raises the "still in the raffle"
        // notice. Then kill the interval: AS3 leaves its Timer running here — harmless enough in
        // Flash, a permanent 150ms wake-up in a browser tab.
        this.hideRaffle();

        if(this._raffleTimer !== null)
        {
            clearInterval(this._raffleTimer);
            this._raffleTimer = null;
        }

        this._disposed = true;
        this._catalog = null;
        this._windowManager = null;
        this._offerId = -1;
        this._pageId = -1;
        this._extraParam = '';
        this._stuffData = null;
        this._pendingImageId = 0;
        this._friendNames = [];
        this._userName = null;
        this._receiverName = '';
        this._suggestionContainer = null;
        this._suggestionItemTemplate?.dispose();
        this._suggestionItemTemplate = null;
        this._stuffTypes = [];
        this._boxTypes = [];
        this._ribbonTypes = [];
        this._isGifting = false;
        this._window?.dispose();
        this._window = null;
    }
}
