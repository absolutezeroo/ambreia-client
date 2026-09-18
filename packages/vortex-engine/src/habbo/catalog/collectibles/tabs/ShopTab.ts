import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {ITextWindow} from '@core/window/components/ITextWindow';
import type {IItemListWindow} from '@core/window/components/IItemListWindow';
import type {IItemGridWindow} from '@core/window/components/IItemGridWindow';
import type {IWidgetWindow} from '@core/window/components/IWidgetWindow';
import type {IBitmapWrapperWindow} from '@core/window/components/IBitmapWrapperWindow';
import type {IStaticBitmapWrapperWindow} from '@core/window/components/IStaticBitmapWrapperWindow';
import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import type {IUpdateReceiver} from '@core/runtime';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import type {NftStoreOffer} from '@habbo/communication/messages/parser/collectibles/NftStoreOffer';
import type {NftStoreOffersMessageParser} from '@habbo/communication/messages/parser/collectibles/NftStoreOffersMessageParser';
import {NftStoreOffersMessageEvent} from '@habbo/communication/messages/incoming/collectibles/NftStoreOffersMessageEvent';
import {NftStorePurchaseMessageEvent} from '@habbo/communication/messages/incoming/collectibles/NftStorePurchaseMessageEvent';
import {NftStorePurchaseMessageParser} from '@habbo/communication/messages/parser/collectibles/NftStorePurchaseMessageParser';
import {GetNftStoreOffersComposer} from '@habbo/communication/messages/outgoing/collectibles/GetNftStoreOffersComposer';

import type {HabboCatalog} from '../../HabboCatalog';
import type {CollectiblesController} from '../CollectiblesController';
import type {CollectiblesView} from '../CollectiblesView';
import {CollectibleProductPreviewer} from './subviews/CollectibleProductPreviewer';
import {ShopCollectibleItemRenderer} from '../renderer/ShopCollectibleItemRenderer';
import {ShopNavigationNodeRenderer} from '../renderer/collections/ShopNavigationNodeRenderer';
import {NftStorePurchaseOffer} from './NftStorePurchaseOffer';

/**
 * The NFT store: a category list down the left, a grid of offers, and a preview panel that buys.
 *
 * Offers arrive once, in a single message, and are bucketed by *localized* category name — the key
 * of `_offersByCategory` is the translated string, not the localization id, so the buckets follow
 * the player's language. `createNavigationNodes()` builds one node the first time a bucket appears,
 * which is also what fixes their order: first-seen wins.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/collectibles/tabs/ShopTab.as
 */
export class ShopTab implements IUpdateReceiver
{
    // AS3: ShopTab.as::BG_STAR_ROTATE_SPEED — degrees per second for the backdrop star.
    private static readonly BG_STAR_ROTATE_SPEED = 20;

    /**
    * AS3: ShopTab.as::_SafeStr_7248 — degrees per second for the loading spinner. This is the
    * *original* of the constant `RewardClaimsTab` and `TransferNftsTab` reach for through
    * `CollectionsTab`, which declares its own copy with the same value.
    */
    private static readonly LOADING_ICON_ROTATE_SPEED = 90;

    /** AS3: ShopTab.as::onClickBuy() — the activity-point type the not-enough alert is raised with. */
    private static readonly EMERALD_ACTIVITY_POINT_TYPE = 1001;

    // AS3: ShopTab.as::_disposed
    private _disposed: boolean = false;
    // AS3: ShopTab.as::_SafeStr_5556 (the hub view)
    private _view: CollectiblesView | null;
    // AS3: ShopTab.as::_SafeStr_4729 (the controller)
    private _controller: CollectiblesController;
    // AS3: ShopTab.as::_SafeStr_4649 (this tab's container)
    private _container: IWindowContainer | null = null;
    // AS3: ShopTab.as::_navigationList
    private _navigationList: IItemListWindow | null = null;
    // AS3: ShopTab.as::_renderableItems (the category nodes)
    private _renderableItems: ShopNavigationNodeRenderer[] = [];
    // AS3: ShopTab.as::_SafeStr_9551 (from `get navigationItemTemplate()`)
    private _navigationItemTemplate: IWindowContainer | null = null;
    // AS3: ShopTab.as::_waitingForOffers
    private _waitingForOffers: boolean = false;
    // AS3: ShopTab.as::_messageEvents
    private _messageEvents: IMessageEvent[] = [];
    // AS3: ShopTab.as::_SafeStr_5202 (the active category)
    private _activeCategory: ShopNavigationNodeRenderer | null = null;
    // AS3: ShopTab.as::_SafeStr_6510 (the rotating backdrop star)
    private _backgroundStar: IStaticBitmapWrapperWindow | null = null;
    // AS3: ShopTab.as::_loadingIcon
    private _loadingIcon: IStaticBitmapWrapperWindow | null = null;
    // AS3: ShopTab.as::_SafeStr_5861 (from `setReady()`)
    private _isReady: boolean = false;
    // AS3: ShopTab.as::_SafeStr_9580 (from `get gridItemTemplate()`)
    private _gridItemTemplate: IWindowContainer | null = null;
    // AS3: ShopTab.as::_SafeStr_10090 (from `get itemGrid()`)
    private _itemGrid: IItemGridWindow | null = null;
    // AS3: ShopTab.as::_gridItems
    private _gridItems: ShopCollectibleItemRenderer[] = [];
    // AS3: ShopTab.as::_SafeStr_4690 (the selected cell)
    private _selectedItem: ShopCollectibleItemRenderer | null = null;
    // AS3: ShopTab.as::_SafeStr_6819 (the large preview)
    private _previewer: CollectibleProductPreviewer | null = null;
    // AS3: ShopTab.as::_currentOffers
    private _currentOffers: NftStoreOffer[] = [];
    // AS3: ShopTab.as::_offersByCategory (keyed by the *localized* category name)
    private _offersByCategory: Map<string, NftStoreOffer[]> = new Map<string, NftStoreOffer[]>();
    // TS-only: what to put back on screen after a post-purchase refresh; see `onNftStorePurchase()`.
    private _restoreOnRefresh: {category: string | null; productCode: string | null} | null = null;

    // AS3: ShopTab.as::ShopTab()
    constructor(view: CollectiblesView, controller: CollectiblesController)
    {
        this._view = view;
        this._controller = controller;

        this._container = view.window?.findChildByName('shopContainer') as IWindowContainer | null ?? null;

        if(this._container === null) return;

        this._navigationList = this._container.findChildByName('navigationList') as IItemListWindow | null;

        const navTemplate = this._navigationList?.getListItemByName('item_template') ?? null;

        if(navTemplate !== null)
        {
            this._navigationItemTemplate = this._navigationList?.removeListItem(navTemplate) as IWindowContainer | null ?? null;
        }

        // The grid's *first existing cell* is the template — taken by reference and then the grid
        // is emptied, so the cell survives the clear and every later row is a clone of it.
        const grid = this._container.findChildByName('itemgrid_shop') as IItemGridWindow | null;

        this._itemGrid = grid;
        this._gridItemTemplate = grid?.getGridItemAt(0) as IWindowContainer | null ?? null;
        grid?.removeGridItems();

        // The shop's previewer gets all eight windows, unlike a grid cell's four: this is the big
        // preview, so it can show an avatar, an effect and a placeholder too.
        this._previewer = new CollectibleProductPreviewer(
            this.productPreviewBitmap,
            this.badgeImageWidget,
            this.petImageWidget,
            this.unknownImageWindow,
            this.avatarImageWidget,
            this.placeholderImage,
            this.effectImageWidget,
            controller.avatarRenderManager
        );
        this._previewer.setPlaceholder();

        this.setReady(false);
        this.addMessageEvents();
        this.requestNftStoreOffers();

        this.buyButton?.addEventListener(WindowMouseEvent.CLICK, this.onClickBuy as unknown as (...args: unknown[]) => void);

        this._backgroundStar = this._container.findChildByName('bg_star') as IStaticBitmapWrapperWindow | null;
        this._loadingIcon = this._container.findChildByName('loading_icon') as IStaticBitmapWrapperWindow | null;

        controller.registerUpdateReceiver(this, 1);
    }

    // DEVIATION: AS3 listens for the offers message alone, so its mint counter and its buy button
    //   keep the numbers they were sent when the tab opened -- a purchase only shows up after the
    //   Collectors Guild is closed and reopened. The purchase answer is listened for here as well,
    //   and a successful one asks the server for the list again.
    // AS3: ShopTab.as::addMessageEvents()
    private addMessageEvents(): void
    {
        this._messageEvents = [
            new NftStoreOffersMessageEvent(this.onNftStoreOffers),
            new NftStorePurchaseMessageEvent(this.onNftStorePurchase)
        ];

        for(const event of this._messageEvents) this._controller.addMessageEvent(event);
    }

    /**
     * Asks again rather than counting to itself: another player buying the last copy has to close
     * this tab's buy button too, and `NftStoreOffer` is a parsed wire value with no setters — a
     * locally incremented count would be this tab's opinion rather than the hotel's.
     *
     * The active category and the selected cell are carried across the round trip, because being
     * thrown back to the first category is a worse answer to "I just bought this" than a stale
     * number was.
     */
    // TS-only: AS3 never reacts to the purchase answer; only `HabboCatalog` reads it, to raise the
    //   alert or the notification.
    private onNftStorePurchase = (event: IMessageEvent): void =>
    {
        const parser = event.parser as NftStorePurchaseMessageParser | null;

        if(parser === null || parser.result === NftStorePurchaseMessageParser.RESULT_ERROR) return;

        this._restoreOnRefresh = {
            category: this._activeCategory?.category ?? null,
            productCode: this._selectedItem?.offer.productCode ?? null
        };

        this.requestNftStoreOffers();
    };

    /**
     * The double guard is AS3's and it is a de-duplicator: the reply is ignored unless this tab
     * asked for it *and* the navigation list is still empty. So a second offers message — one this
     * tab did not request, or one arriving after the list is built — is dropped rather than
     * duplicating every category.
     */
    // AS3: ShopTab.as::onNftStoreOffers()
    private onNftStoreOffers = (event: IMessageEvent): void =>
    {
        if(!this._waitingForOffers || (this._navigationList?.numListItems ?? 0) !== 0) return;

        const parser = event.parser as NftStoreOffersMessageParser | null;

        if(parser === null) return;

        this._waitingForOffers = false;
        this._currentOffers = parser.nftStoreOffers;

        this.createNavigationNodes();

        const restore = this._restoreOnRefresh;

        this._restoreOnRefresh = null;

        if(this._renderableItems.length > 0)
        {
            const previous = restore?.category == null
                ? null
                : this._renderableItems.find(node => node.category === restore.category) ?? null;

            this.activateCategory(previous ?? this._renderableItems[0]);

            if(restore?.productCode != null)
            {
                const cell = this._gridItems.find(
                    item => item.offer.productCode === restore.productCode
                );

                if(cell !== undefined) this.selectItem(cell);
            }
        }

        this.setReady(true);

        const collection = this.collectionContainer;

        if(collection !== null) collection.visible = this._renderableItems.length > 0;
    };

    // AS3: ShopTab.as::createNavigationNodes()
    private createNavigationNodes(): void
    {
        for(const offer of this._currentOffers)
        {
            if(offer === null) continue;

            const key = this._controller.localizationManager?.getLocalization(
                ShopTab.getNavigationCategory(offer.productInfo.productTypeId)
            ) ?? '';

            if(!this._offersByCategory.has(key))
            {
                this._offersByCategory.set(key, []);

                const node = new ShopNavigationNodeRenderer(this, key);

                if(node.window !== null) this._navigationList?.addListItem(node.window);

                this._renderableItems.push(node);
            }

            this._offersByCategory.get(key)?.push(offer);
        }
    }

    /** Wall (0) and floor (1) furni share one bucket; everything unrecognised lands in "other". */
    // AS3: ShopTab.as::getNavigationCategory()
    private static getNavigationCategory(productTypeId: number): string
    {
        switch(productTypeId)
        {
            case 0:
            case 1:
                return 'shop.furni.title';
            case 10:
                return 'shop.pets.title';
            case 11:
                return 'shop.clothes.title';
            default:
                return 'product.type.other';
        }
    }

    // AS3: ShopTab.as::setReady()
    private setReady(ready: boolean): void
    {
        const loaded = this.loadedContainer;
        const loading = this.loadingContainer;

        if(loaded !== null) loaded.visible = ready;
        if(loading !== null) loading.visible = !ready;

        this._isReady = ready;
    }

    // AS3: ShopTab.as::requestNftStoreOffers()
    private requestNftStoreOffers(): void
    {
        this.clearNavigationList();
        this._waitingForOffers = true;
        this._controller.send(new GetNftStoreOffersComposer());
    }

    // AS3: ShopTab.as::activateCategory()
    activateCategory(node: ShopNavigationNodeRenderer): void
    {
        if(this._activeCategory === node) return;

        this._activeCategory?.deactivate();

        this._activeCategory = node;
        this._activeCategory.activate();

        this.populateGridItems();
    }

    /**
     * AS3 selects `_gridItems[0]` unconditionally at the end. It cannot be empty there — the
     * early return above covers the empty bucket — but the port passes `?? null` so the selection
     * is explicit rather than resting on that argument.
     */
    // AS3: ShopTab.as::populateGridItems()
    populateGridItems(): void
    {
        this.clearGridItems();

        const category = this._activeCategory?.category ?? null;
        const offers = category === null ? undefined : this._offersByCategory.get(category);

        if(offers === undefined || offers.length <= 0) return;

        const template = this._gridItemTemplate;

        if(template === null) return;

        for(const offer of offers)
        {
            const cell = template.clone() as IWindowContainer;
            const renderer = new ShopCollectibleItemRenderer(this._controller, offer, cell, this);

            this._itemGrid?.addGridItem(cell);
            this._gridItems.push(renderer);
        }

        this.selectItem(this._gridItems[0] ?? null);
    }

    // AS3: ShopTab.as::clearGridItems()
    clearGridItems(): void
    {
        this._selectedItem = null;

        for(const item of this._gridItems) item.dispose();

        this._gridItems = [];
        this._itemGrid?.destroyGridItems();
    }

    // AS3: ShopTab.as::selectItem()
    selectItem(item: ShopCollectibleItemRenderer | null): void
    {
        if(this._selectedItem !== null)
        {
            this._selectedItem.deactivate();
            this._selectedItem = null;
        }

        if(item === null) return;

        this._selectedItem = item;
        this._selectedItem.activate();
        this.initItemPreview();
    }

    /**
     * The buy button's enable test is AS3's, and the `mintLimit === -1` arm is what makes an
     * unlimited offer buyable: with `mintLimit` at -1 the first comparison is false for every
     * `mintedCount`, so only the explicit -1 keeps it purchasable.
     */
    // AS3: ShopTab.as::initItemPreview()
    private initItemPreview(): void
    {
        const selected = this._selectedItem;

        if(selected === null || this._previewer === null) return;

        const offer = selected.offer;

        this._previewer.clearPreviewer();
        this._controller.previewImage(selected.renderableItem, this._previewer);

        const name = this.productNameText;
        const price = this.emeraldPriceText;

        if(name !== null) name.text = this._controller.getProductName(selected.renderableItem);
        if(price !== null) price.text = String(offer.emeraldPrice);

        const limited = offer.mintLimit > 0;
        const limitContainer = this.mintLimitContainer;

        if(limitContainer !== null) limitContainer.visible = limited;

        if(limited)
        {
            const limitText = this.mintLimitText;

            if(limitText !== null) limitText.text = `${offer.mintedCount}/${offer.mintLimit}`;
        }

        if(offer.mintedCount < offer.mintLimit || offer.mintLimit === -1)
        {
            this.buyButton?.enable();
        }
        else
        {
            this.buyButton?.disable();
        }
    }

    /**
     * Note the two different price sources: the affordability test reads
     * `NftStorePurchaseOffer.priceInEmerald`, while the confirmation is handed the offer itself.
     * And `1001` is passed to the not-enough alert even though the offer reports
     * `activityPointType` 0 — both AS3.
     */
    // AS3: ShopTab.as::onClickBuy()
    private onClickBuy = (): void =>
    {
        const selected = this._selectedItem;
        const catalog = this._controller.catalog;

        if(selected === null || catalog === null) return;

        const offer = new NftStorePurchaseOffer(selected.offer);

        if(catalog.getPurse().emeraldBalance < offer.priceInEmerald)
        {
            catalog.showNotEnoughActivityPointsAlert(ShopTab.EMERALD_ACTIVITY_POINT_TYPE);

            return;
        }

        // AS3 casts here too — `HabboCatalog(controller.catalog).showPurchaseConfirmation(...)` —
        // because `showPurchaseConfirmation()` is on the concrete class and not on IHabboCatalog.
        // The port has the same gap and mirrors the same cast, type-only so no runtime cycle forms
        // between HabboCatalog and this tab.
        (catalog as unknown as HabboCatalog).showPurchaseConfirmation(offer, -1, this.activeWallet ?? '');
    };

    // AS3: ShopTab.as::get navigationItemTemplate()
    get navigationItemTemplate(): IWindowContainer | null
    {
        return this._navigationItemTemplate;
    }

    // AS3: ShopTab.as::get collectionContainer()
    private get collectionContainer(): IWindowContainer | null
    {
        return this._container?.findChildByName('collection_content') as IWindowContainer | null ?? null;
    }

    // AS3: ShopTab.as::get loadingContainer()
    private get loadingContainer(): IWindowContainer | null
    {
        return this._container?.findChildByName('loading_contents') as IWindowContainer | null ?? null;
    }

    // AS3: ShopTab.as::get loadedContainer()
    private get loadedContainer(): IWindowContainer | null
    {
        return this._container?.findChildByName('loaded_content') as IWindowContainer | null ?? null;
    }

    // DEVIATION: AS3 leaves `_offersByCategory` behind, which is harmless there because it only
    //   ever clears the list once, on the single request it makes. Cleared here because the tab now
    //   requests twice: the surviving keys would make `createNavigationNodes()` skip every node --
    //   an empty category list and a hidden grid -- while still appending each offer to the old
    //   buckets.
    // AS3: ShopTab.as::clearNavigationList()
    private clearNavigationList(): void
    {
        this._activeCategory = null;
        this._navigationList?.removeListItems();

        for(const node of this._renderableItems) node.dispose();

        this._renderableItems = [];
        this._offersByCategory.clear();
    }

    // AS3: ShopTab.as::removeMessageEvents()
    private removeMessageEvents(): void
    {
        for(const event of this._messageEvents) this._controller.removeMessageEvent(event);

        this._messageEvents = [];
    }

    // AS3: ShopTab.as::get controller()
    get controller(): CollectiblesController
    {
        return this._controller;
    }

    // AS3: ShopTab.as::get activeWallet()
    get activeWallet(): string | null
    {
        return this._view?.activeWallet ?? null;
    }

    // AS3: ShopTab.as::get gridItemTemplate()
    get gridItemTemplate(): IWindowContainer | null
    {
        return this._gridItemTemplate;
    }

    // AS3: ShopTab.as::get itemGrid()
    get itemGrid(): IItemGridWindow | null
    {
        return this._itemGrid;
    }

    // AS3: ShopTab.as::get avatarImageWidget()
    private get avatarImageWidget(): IWidgetWindow | null
    {
        return this._container?.findChildByName('avatar_image_widget') as IWidgetWindow | null ?? null;
    }

    // AS3: ShopTab.as::get badgeImageWidget()
    private get badgeImageWidget(): IWidgetWindow | null
    {
        return this._container?.findChildByName('badge_image_widget') as IWidgetWindow | null ?? null;
    }

    // AS3: ShopTab.as::get petImageWidget()
    private get petImageWidget(): IWidgetWindow | null
    {
        return this._container?.findChildByName('pet_image_widget') as IWidgetWindow | null ?? null;
    }

    // AS3: ShopTab.as::get effectImageWidget()
    private get effectImageWidget(): IWidgetWindow | null
    {
        return this._container?.findChildByName('effect_image_widget') as IWidgetWindow | null ?? null;
    }

    // AS3: ShopTab.as::get unknownImageWindow()
    private get unknownImageWindow(): IStaticBitmapWrapperWindow | null
    {
        return this._container?.findChildByName('unknown_image') as IStaticBitmapWrapperWindow | null ?? null;
    }

    // AS3: ShopTab.as::get placeholderImage()
    private get placeholderImage(): IStaticBitmapWrapperWindow | null
    {
        return this._container?.findChildByName('placeholder_image') as IStaticBitmapWrapperWindow | null ?? null;
    }

    // AS3: ShopTab.as::get productPreviewBitmap()
    private get productPreviewBitmap(): IBitmapWrapperWindow | null
    {
        return this._container?.findChildByName('product_preview') as IBitmapWrapperWindow | null ?? null;
    }

    // AS3: ShopTab.as::get productNameText()
    private get productNameText(): ITextWindow | null
    {
        return this._container?.findChildByName('preview_furni_name') as ITextWindow | null ?? null;
    }

    // AS3: ShopTab.as::get buyButton()
    private get buyButton(): IWindow | null
    {
        return this._container?.findChildByName('buy_button') ?? null;
    }

    // AS3: ShopTab.as::get emeraldPriceText()
    private get emeraldPriceText(): ITextWindow | null
    {
        return this._container?.findChildByName('price_text') as ITextWindow | null ?? null;
    }

    // AS3: ShopTab.as::get mintLimitText()
    private get mintLimitText(): ITextWindow | null
    {
        return this._container?.findChildByName('mintlimit_text') as ITextWindow | null ?? null;
    }

    // AS3: ShopTab.as::get mintLimitContainer()
    private get mintLimitContainer(): IWindow | null
    {
        return this._container?.findChildByName('mintlimit_container') ?? null;
    }

    /**
     * Two spinners, one per state: the backdrop star turns while the shop is loaded, the loading
     * icon while it is not.
     *
     * The loaded branch also calls `_SafeStr_5458.updateBonusProgressBar(false, ms)` on a
     * `CollectionView` field — which AS3 **declares and never assigns**, so that call is dead there
     * too. It is left out rather than ported against a field that is always null; `CollectionView`
     * (596 l.) is unported anyway.
     */
    // AS3: ShopTab.as::update()
    update(elapsedMs: number): void
    {
        if(this._isReady)
        {
            if(this._backgroundStar === null) return;

            this._backgroundStar.rotation += ShopTab.BG_STAR_ROTATE_SPEED * (elapsedMs / 1000);
            this._backgroundStar.rotation %= 360;
            this._backgroundStar.invalidate();

            return;
        }

        if(this._loadingIcon === null) return;

        this._loadingIcon.rotation += ShopTab.LOADING_ICON_ROTATE_SPEED * (elapsedMs / 1000);
        this._loadingIcon.rotation %= 360;
        this._loadingIcon.invalidate();
    }

    // AS3: ShopTab.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    /**
     * AS3 disposes `_SafeStr_5202` — the *active* category — at the end, after
     * `clearNavigationList()` has already disposed every node including that one and set the field
     * to null. So the trailing block is dead there. Dropped rather than reproduced.
     */
    // AS3: ShopTab.as::dispose()
    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;

        this._controller.removeUpdateReceiver(this);
        this._previewer?.clearPreviewer();
        this._previewer?.dispose();
        this._previewer = null;

        this.clearNavigationList();
        this.clearGridItems();
        this.removeMessageEvents();

        this.buyButton?.removeEventListener(WindowMouseEvent.CLICK, this.onClickBuy as unknown as (...args: unknown[]) => void);

        this._container = null;
        this._navigationList = null;
        this._navigationItemTemplate = null;
        this._gridItemTemplate = null;
        this._itemGrid = null;
        this._backgroundStar = null;
        this._loadingIcon = null;
        this._view = null;
    }
}
