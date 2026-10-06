import {EventEmitter} from 'eventemitter3';
import {Logger} from '@core/utils/Logger';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {ITextFieldWindow} from '@core/window/components/ITextFieldWindow';
import type {ISessionDataManager} from '@habbo/session/ISessionDataManager';
import type {HabboCatalog} from '../HabboCatalog';
import type {IPurchasableOffer} from '../IPurchasableOffer';
import type {ICatalogPage} from './ICatalogPage';
import type {ICatalogViewer} from './ICatalogViewer';
import type {IPageLocalization} from './IPageLocalization';
import type {ICatalogWidget} from './widgets/ICatalogWidget';
import {ItemGridCatalogWidget} from './widgets/ItemGridCatalogWidget';
import {SimplePriceCatalogWidget} from './widgets/SimplePriceCatalogWidget';
import {ProductViewCatalogWidget} from './widgets/ProductViewCatalogWidget';
import {PurchaseCatalogWidget} from './widgets/PurchaseCatalogWidget';
import {LocalizationCatalogWidget} from './widgets/LocalizationCatalogWidget';
import {SpinnerCatalogWidget} from './widgets/SpinnerCatalogWidget';
import {TotalPriceCatalogWidget} from './widgets/TotalPriceCatalogWidget';
import {UniqueLimitedItemWidget} from './widgets/UniqueLimitedItemWidget';
import {SpecialInfoWidget} from './widgets/SpecialInfoWidget';
import {WarningCatalogWidget} from './widgets/WarningCatalogWidget';
import {TextInputCatalogWidget} from './widgets/TextInputCatalogWidget';
import {FirstProductSelectorCatalogWidget} from './widgets/FirstProductSelectorCatalogWidget';
import {SingleViewCatalogWidget} from './widgets/SingleViewCatalogWidget';
import {RoomPreviewCatalogWidget} from './widgets/RoomPreviewCatalogWidget';
import {TrophyCatalogWidget} from './widgets/TrophyCatalogWidget';
import {UserBadgeSelectorCatalogWidget} from './widgets/UserBadgeSelectorCatalogWidget';
import {MadMoneyCatalogWidget} from './widgets/MadMoneyCatalogWidget';
import {AddOnBadgeViewCatalogWidget} from './widgets/AddOnBadgeViewCatalogWidget';
import {FeaturedItemsCatalogWidget} from './widgets/FeaturedItemsCatalogWidget';
import {ColourGridCatalogWidget} from './widgets/ColourGridCatalogWidget';
import {BundleGridViewCatalogWidget} from './widgets/BundleGridViewCatalogWidget';
import {ActivityPointDisplayCatalogWidget} from './widgets/ActivityPointDisplayCatalogWidget';
import {SpacesNewCatalogWidget} from './widgets/SpacesNewCatalogWidget';
import {BundlePurchaseExtraInfoWidget} from './widgets/BundlePurchaseExtraInfoWidget';
import {ClubBuyCatalogWidget} from './widgets/ClubBuyCatalogWidget';
import {VipBuyCatalogWidget} from './widgets/VipBuyCatalogWidget';
import {LoyaltyVipBuyCatalogWidget} from './widgets/LoyaltyVipBuyCatalogWidget';
import {MarketPlaceCatalogWidget} from './widgets/MarketPlaceCatalogWidget';
import {MarketPlaceOwnItemsCatalogWidget} from './widgets/MarketPlaceOwnItemsCatalogWidget';
import {RecyclerCatalogWidget} from './widgets/RecyclerCatalogWidget';
import {RecyclerPrizesCatalogWidget} from './widgets/RecyclerPrizesCatalogWidget';
import {RoomAdsCatalogWidget} from './widgets/RoomAdsCatalogWidget';
import {BuyGuildWidget} from './widgets/BuyGuildWidget';
import {GuildBadgeViewCatalogWidget} from './widgets/GuildBadgeViewCatalogWidget';
import {GuildSelectorCatalogWidget} from './widgets/GuildSelectorCatalogWidget';
import {GuildForumSelectorCatalogWidget} from './widgets/GuildForumSelectorCatalogWidget';
import {PetsCatalogWidget} from './widgets/PetsCatalogWidget';
import {NewPetsCatalogWidget} from './widgets/NewPetsCatalogWidget';
import {PetPreviewCatalogWidget} from './widgets/PetPreviewCatalogWidget';
import {ClubGiftWidget} from './widgets/ClubGiftWidget';
import {CatalogWidgetName} from './widgets/CatalogWidgetName';
import {ProductOfferUpdatedEvent} from './widgets/events/ProductOfferUpdatedEvent';
import {CatalogWidgetEvent} from './widgets/events/CatalogWidgetEvent';

const log = Logger.getLogger('habbo.catalog.viewer.CatalogPage');

/**
 * A single loaded catalog page: its window, offers, localization, and widgets.
 *
 * @see sources/win63_version/habbo/catalog/viewer/CatalogPage.as
 */
export class CatalogPage implements ICatalogPage
{
    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogPage.as::LAYOUT_MAGIC_PREFIX
    protected static readonly LAYOUT_MAGIC_PREFIX: string = 'layout_';

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogPage.as::MODE_NORMAL
    static readonly MODE_NORMAL: number = 0;
    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogPage.as::MODE_SEARCH
    static readonly MODE_SEARCH: number = 1;

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogPage.as::_window
    protected _window: IWindowContainer | null = null;

    private _viewer: ICatalogViewer | null;

    private _pageId: number;

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogPage.as::_layoutCode
    private _layoutCode: string;

    // DEVIATION: AS3 stores the raw XML between `assets.getAssetByName(...).content` and the
    //   immediately-following `windowManager.buildFromXML(_layout)` call in createWindow() — never
    //   read anywhere else, by this class or a subclass. This port's window manager builds directly
    //   from a compiled widget-layout registry (see createWindow() below), so there is no raw XML
    //   value to hold; `_window` already keeps the one thing `_layout` ever fed.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/CatalogPage.as::_layout

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogPage.as::_offers
    private _offers: IPurchasableOffer[];

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogPage.as::_localization
    private _localization: IPageLocalization;

    /**
     * Every widget this page built, in the order `createWidgetsRecursion()` walked the layout.
     *
     * `createWidget()`'s switch covers all 48 names `CatalogWidgetName` declares, which is the
     * same 48 the AS3 switch has. There is no default case in either: a layout naming something
     * else leaves that slot inert rather than throwing.
     */
    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogPage.as::_widgets
    private _widgets: ICatalogWidget[] = [];

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogPage.as::_widgetEvents
    private _widgetEvents: EventEmitter | null = new EventEmitter();

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogPage.as::_catalog
    private _catalog: HabboCatalog | null;

    private _acceptSeasonCurrencyAsCredits: boolean;

    private _searchPageId: number = 0;

    private _itemGridWidget: ItemGridCatalogWidget | null = null;

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogPage.as::_mode
    private _mode: number;

    constructor(
        viewer: ICatalogViewer,
        pageId: number,
        layoutCode: string,
        localization: IPageLocalization,
        offers: IPurchasableOffer[],
        catalog: HabboCatalog,
        acceptSeasonCurrencyAsCredits: boolean,
        mode: number = -1
    )
    {
        this._viewer = viewer;
        this._pageId = pageId;
        this._layoutCode = layoutCode;
        this._localization = localization;
        this._offers = offers;
        this._catalog = catalog;

        for(const offer of offers)
        {
            offer.page = this;
        }

        this._acceptSeasonCurrencyAsCredits = acceptSeasonCurrencyAsCredits;
        this._mode = mode === -1 ? 0 : mode;

        this.init();
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogPage.as::get window()
    get window(): IWindowContainer
    {
        return this._window!;
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogPage.as::get viewer()
    get viewer(): ICatalogViewer
    {
        return this._viewer!;
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogPage.as::get pageId()
    get pageId(): number
    {
        return this._mode === CatalogPage.MODE_SEARCH ? -12345678 : this._pageId;
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogPage.as::get layoutCode()
    get layoutCode(): string
    {
        return this._layoutCode;
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogPage.as::get offers()
    get offers(): IPurchasableOffer[]
    {
        return this._offers;
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogPage.as::get localization()
    get localization(): IPageLocalization
    {
        return this._localization;
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogPage.as::get links()
    get links(): string[]
    {
        return this._localization.getLinks(this._layoutCode);
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogPage.as::get hasLinks()
    get hasLinks(): boolean
    {
        return this._localization.hasLinks(this._layoutCode);
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogPage.as::get acceptSeasonCurrencyAsCredits()
    get acceptSeasonCurrencyAsCredits(): boolean
    {
        return this._acceptSeasonCurrencyAsCredits;
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogPage.as::get allowDragging()
    get allowDragging(): boolean
    {
        return this._layoutCode !== 'sold_ltd_items';
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogPage.as::set searchPageId()
    set searchPageId(pageId: number)
    {
        this._searchPageId = pageId;
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogPage.as::get mode()
    get mode(): number
    {
        return this._mode;
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogPage.as::selectOffer()
    selectOffer(offerId: number): void
    {
        if(this._itemGridWidget != null && offerId > -1)
        {
            log.debug(`selecting offer ${offerId}`);

            for(const offer of this._offers)
            {
                if(offer.offerId === offerId)
                {
                    this._itemGridWidget.select(offer.gridItem, true);
                }
            }
        }

        if(this._window && this._window.findChildByName('trophyWidget') != null)
        {
            const input = this._window.findChildByName('input_text') as unknown as ITextFieldWindow;

            input.focus();
            input.activate();
        }
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogPage.as::dispose()
    dispose(): void
    {
        for(const widget of this._widgets)
        {
            widget.dispose();
        }

        this._widgets = [];
        this._localization.dispose();

        for(const offer of this._offers)
        {
            offer.dispose();
        }

        this._offers = [];

        if(this._window != null)
        {
            this._window.dispose();
            this._window = null;
        }

        if(this._widgetEvents != null)
        {
            this._widgetEvents.removeAllListeners();
            this._widgetEvents = null;
        }

        this._viewer = null;
        this._catalog = null;
        this._pageId = 0;
        this._layoutCode = '';
        this._acceptSeasonCurrencyAsCredits = false;
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogPage.as::init()
    init(): void
    {
        if(this.createWindow(this.layoutCode))
        {
            this.createWidgets();
        }
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogPage.as::closed()
    closed(): void
    {
        for(const widget of this._widgets)
        {
            widget.closed?.();
        }
    }

    // AS3's own literal rename: createWindow() maps "frontpage4" -> "frontpage_featured" before
    // building the "layout_"/"old_layout_" asset name. (A previous "default_3x3" ->
    // "default_ubuntu" entry here was a workaround for a compiled-asset naming bug - see
    // build-asset-name-manifest.mjs - now fixed at the source instead.)
    private static readonly NEW_NAMING_RENAMES: Record<string, string> = {
        frontpage4: 'frontpage_featured',
    };

    // AS3 loads this via assets.getAssetByName("layout_" + name / "old_layout_" + name).content +
    // buildFromXML(), picking the prefix via assets.hasAsset() ahead of time. This port's compiled
    // window-layout registry is keyed by whatever name the original Flash source file had, which
    // for catalog pages is inconsistently "layout_<code>" (newer/UBUNTU pages) or "ctlg_<code>"
    // (older pages, compiled from a different source tree) - so the hasWidgetLayout() probe checks
    // both prefixes (plus the bare code) instead of AS3's single hasAsset(assetName) check.
    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogPage.as::createWindow()
    protected createWindow(layoutCode: string): boolean
    {
        const preferNewNaming = this._viewer!.viewerTags.indexOf('UBUNTU') > -1;
        const renamedCode = (preferNewNaming ? CatalogPage.NEW_NAMING_RENAMES[layoutCode] : null) ?? layoutCode;
        const windowManager = this._catalog!.windowManager!;

        const candidates = preferNewNaming
            ? [CatalogPage.LAYOUT_MAGIC_PREFIX + renamedCode, 'ctlg_' + layoutCode]
            : ['ctlg_' + layoutCode, CatalogPage.LAYOUT_MAGIC_PREFIX + renamedCode];

        candidates.push(CatalogPage.LAYOUT_MAGIC_PREFIX + layoutCode, layoutCode);

        const assetName = candidates.find((candidate) => windowManager.hasWidgetLayout(candidate));

        this._window = (assetName ? windowManager.buildWidgetLayout(assetName) : null) as unknown as IWindowContainer | null;

        if(this._window == null)
        {
            log.warn(`Could not create layout ${layoutCode}`);

            return false;
        }

        return true;
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogPage.as::createWidgets()
    private createWidgets(): void
    {
        this.createWidgetsRecursion(this._window);
        this.initializeWidgets();
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogPage.as::createWidgetsRecursion()
    private createWidgetsRecursion(window: IWindowContainer | null): void
    {
        if(window == null) return;

        for(let i = 0; i < window.numChildren; i++)
        {
            const child = window.getChildAt(i) as unknown as IWindowContainer | null;

            if(child != null)
            {
                this.createWidget(child);
                this.createWidgetsRecursion(child);
            }
        }
    }

    // All 48 of the AS3 switch's cases are ported. Like AS3 it has no default arm, so a layout
    // naming a widget that does not exist is silently skipped rather than throwing.
    // DEVIATION: AS3 also builds `songDiskProductViewWidget` and `traxPreviewWidget`; the RPG fork
    //   removed jukebox music, so a layout naming either leaves that slot inert.
    // DEVIATION: AS3 builds the sold-out LTD banner widget on `soldLtdItemsWidget` (which hid its
    //   slot until a sold-out limited offer was selected, then hid the purchase widget); the RPG
    //   fork removed LTD sales, so the slot is only hidden and the purchase widget always stays.
    // DEVIATION: AS3 builds the voucher-code widget on `redeemItemCodeWidget`; the RPG fork removed
    //   vouchers, so the slot (its code field and redeem button are inline in the front-page
    //   layouts) is hidden.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/CatalogPage.as::createWidget()
    private createWidget(window: IWindowContainer): void
    {
        switch(window.name)
        {
            case CatalogWidgetName.ITEM_GRID:
                if(this._itemGridWidget == null)
                {
                    this._itemGridWidget = new ItemGridCatalogWidget(
                        window,
                        this._catalog!.sessionDataManager as ISessionDataManager,
                        this._catalog!.catalogType
                    );
                    this._widgets.push(this._itemGridWidget);
                }

                break;
            case CatalogWidgetName.SIMPLE_PRICE:
                this._widgets.push(new SimplePriceCatalogWidget(window, this._catalog!));
                break;
            case CatalogWidgetName.PRODUCT_VIEW:
                this._widgets.push(new ProductViewCatalogWidget(window, this._catalog!));
                break;
            case CatalogWidgetName.SINGLE_VIEW:
                this._widgets.push(new SingleViewCatalogWidget(window, this._catalog!));
                break;
            case CatalogWidgetName.PURCHASE:
                this._widgets.push(new PurchaseCatalogWidget(window, this._catalog!));
                break;
            case CatalogWidgetName.SPINNER:
                this._widgets.push(new SpinnerCatalogWidget(window, this._catalog!));
                break;
            case CatalogWidgetName.TOTAL_PRICE:
                this._widgets.push(new TotalPriceCatalogWidget(window, this._catalog!));
                break;
            case CatalogWidgetName.LIMITED_ITEM:
                this._widgets.push(new UniqueLimitedItemWidget(window, this._catalog!));
                break;
            case CatalogWidgetName.TEXT_INPUT:
                this._widgets.push(new TextInputCatalogWidget(window));
                break;
            case CatalogWidgetName.SPECIAL_INFO:
                this._widgets.push(new SpecialInfoWidget(window));
                break;
            case CatalogWidgetName.WARNING:
                this._widgets.push(new WarningCatalogWidget(window));
                break;
            case CatalogWidgetName.FIRST_PRODUCT_AUTO_SELECTOR:
                this._widgets.push(new FirstProductSelectorCatalogWidget(window));
                break;
            case CatalogWidgetName.TROPHY:
                this._widgets.push(new TrophyCatalogWidget(window, this._catalog!));
                break;
            case CatalogWidgetName.USER_BADGE_SELECTOR:
                this._widgets.push(new UserBadgeSelectorCatalogWidget(window, this._catalog!));
                break;
            case CatalogWidgetName.ROOM_PREVIEW:
                this._widgets.push(new RoomPreviewCatalogWidget(window));
                break;
            case CatalogWidgetName.SOLD_LTD_ITEMS:
                window.visible = false;
                break;
            case CatalogWidgetName.MAD_MONEY:
                this._widgets.push(new MadMoneyCatalogWidget(window));
                break;
            case CatalogWidgetName.ADD_ON_BADGE_VIEW:
                this._widgets.push(new AddOnBadgeViewCatalogWidget(window));
                break;
            case CatalogWidgetName.FEATURED_ITEMS:
                this._widgets.push(new FeaturedItemsCatalogWidget(window, this._catalog!));
                break;
            case CatalogWidgetName.COLOUR_GRID:
                this._widgets.push(new ColourGridCatalogWidget(window));
                break;
            case CatalogWidgetName.BUNDLE_GRID_SCROLL:
                this._widgets.push(new BundleGridViewCatalogWidget(window));
                break;
            case CatalogWidgetName.ACTIVITY_POINT_DISPLAY:
                this._widgets.push(new ActivityPointDisplayCatalogWidget(window));
                break;
            case CatalogWidgetName.REDEEM_ITEM_CODE:
                window.visible = false;
                break;
            case CatalogWidgetName.SPACES_NEW:
                this._widgets.push(new SpacesNewCatalogWidget(
                    window,
                    this._catalog!.sessionDataManager as ISessionDataManager,
                    this._catalog!.catalogType
                ));

                break;
            case CatalogWidgetName.BUNDLE_PURCHASE_EXTRA_INFO:
                this._widgets.push(new BundlePurchaseExtraInfoWidget(window, this._catalog!));
                break;
            case CatalogWidgetName.CLUB_GIFT:
                this._widgets.push(new ClubGiftWidget(window, this._catalog!.getClubGiftController()!, this._catalog!));
                break;
            case CatalogWidgetName.CLUB_BUY:
                this._widgets.push(new ClubBuyCatalogWidget(window));
                break;
            case CatalogWidgetName.VIP_BUY:
                this._widgets.push(new VipBuyCatalogWidget(window, this._catalog!));
                break;
            case CatalogWidgetName.LOYALTY_VIP_BUY:
                this._widgets.push(new LoyaltyVipBuyCatalogWidget(window, this._catalog!));
                break;
            case CatalogWidgetName.VIP_GIFT:
                this._widgets.push(new VipBuyCatalogWidget(window, this._catalog!, true));
                break;
            case CatalogWidgetName.MARKET_PLACE:
                this._widgets.push(new MarketPlaceCatalogWidget(window));
                break;
            case CatalogWidgetName.MARKET_PLACE_OWN_ITEMS:
                this._widgets.push(new MarketPlaceOwnItemsCatalogWidget(window));
                break;
            case CatalogWidgetName.RECYCLER:
                this._widgets.push(new RecyclerCatalogWidget(window));
                break;
            case CatalogWidgetName.RECYCLER_PRIZES:
                this._widgets.push(new RecyclerPrizesCatalogWidget(window));
                break;
            case CatalogWidgetName.ROOM_ADS_CATALOG:
                this._widgets.push(new RoomAdsCatalogWidget(window, this._catalog!));
                break;
            case CatalogWidgetName.BUY_GUILD:
                this._widgets.push(new BuyGuildWidget(window));
                break;
            case CatalogWidgetName.GUILD_BADGE_VIEW:
                this._widgets.push(new GuildBadgeViewCatalogWidget(window, this._catalog!.getGroupMembershipsController()!));
                break;
            case CatalogWidgetName.GUILD_SELECTOR:
                this._widgets.push(new GuildSelectorCatalogWidget(window, this._catalog!.getGroupMembershipsController()!));
                break;
            case CatalogWidgetName.GUILD_FORUM_SELECTOR:
                this._widgets.push(new GuildForumSelectorCatalogWidget(window, this._catalog!.getGroupMembershipsController()!));
                break;
            case CatalogWidgetName.PETS:
                this._widgets.push(new PetsCatalogWidget(window, this._catalog!));
                break;
            case CatalogWidgetName.NEW_PETS:
                this._widgets.push(new NewPetsCatalogWidget(window, this._catalog!));
                break;
            case CatalogWidgetName.PET_PREVIEW:
                this._widgets.push(new PetPreviewCatalogWidget(window, this._catalog!));
                break;
        }
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogPage.as::initializeWidgets()
    private initializeWidgets(): void
    {
        // The 3x3 colour-grouping layout is the one page shape whose colour grid is
        // not declared in the layout XML: the window exists but ships hidden and
        // unsized, and the page positions it under the item grid and adds its widget
        // here. Every number below is AS3's, including the item grid's flat height of
        // 64 - 3 — it is not derived from anything.
        if(this._layoutCode === 'default_3x3_color_grouping' && this._window)
        {
            const itemGrid = this._window.findChildByName('itemGridWidget') as unknown as IWindowContainer | null;
            const colourGrid = this._window.findChildByName('colourGridWidget') as unknown as IWindowContainer | null;

            if(itemGrid && colourGrid)
            {
                const spacing = 3;

                itemGrid.height = 64 - spacing;

                colourGrid.visible = true;
                colourGrid.width = 360;
                colourGrid.x = itemGrid.x;
                colourGrid.y = itemGrid.y + itemGrid.height + spacing;
                colourGrid.height = 91;

                this._widgets.push(new ColourGridCatalogWidget(colourGrid));
            }
        }

        const failed: ICatalogWidget[] = [];

        for(const widget of this._widgets)
        {
            widget.page = this;
            widget.events = this._widgetEvents!;

            if(!widget.init())
            {
                failed.push(widget);
            }
        }

        this.removeWidgets(failed);
        this.initializeLocalizations();

        this._widgetEvents!.emit(CatalogWidgetEvent.WIDGETS_INITIALIZED, new CatalogWidgetEvent(CatalogWidgetEvent.WIDGETS_INITIALIZED));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/CatalogPage.as::initializeLocalizations()
    private initializeLocalizations(): void
    {
        const widget = new LocalizationCatalogWidget(this._window!, this._catalog!);

        this._widgets.push(widget);
        widget.page = this;
        widget.events = this._widgetEvents!;
        widget.init();
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogPage.as::removeWidgets()
    private removeWidgets(widgets: ICatalogWidget[]): void
    {
        if(widgets == null || widgets.length === 0) return;

        // AS3 cascades: any widget whose window lives inside an already-removed widget's window
        // gets removed too (its own init() may have succeeded, but its parent window is going away).
        for(const widget of this._widgets)
        {
            if(widget.window == null) continue;

            for(const removed of widgets)
            {
                if(removed.window != null && removed.window.getChildIndex(widget.window) >= 0)
                {
                    if(widgets.indexOf(widget) < 0)
                    {
                        widgets.push(widget);
                    }

                    break;
                }
            }
        }

        for(const widget of widgets)
        {
            if(widget.window != null)
            {
                this._window!.removeChild(widget.window);
                widget.window.dispose();
            }

            const index = this._widgets.indexOf(widget);

            if(index >= 0)
            {
                this._widgets.splice(index, 1);
            }

            widget.dispose();
        }
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogPage.as::dispatchWidgetEvent()
    dispatchWidgetEvent(event: unknown): boolean
    {
        if(this._widgetEvents != null)
        {
            const typed = event as {type: string};

            this._widgetEvents.emit(typed.type, event);

            return true;
        }

        return false;
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogPage.as::replaceOffers()
    replaceOffers(offers: IPurchasableOffer[], disposeOld: boolean = false): void
    {
        if(disposeOld)
        {
            for(const offer of this._offers)
            {
                offer.dispose();
            }
        }

        this._offers = offers;
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/CatalogPage.as::updateLimitedItemsLeft()
    updateLimitedItemsLeft(offerId: number, itemsLeft: number): void
    {
        for(const offer of this._offers)
        {
            if(offer.offerId === offerId)
            {
                offer.product!.uniqueLimitedItemsLeft = itemsLeft;

                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/CatalogPage.as::updateLimitedItemsLeft()
                // UniqueLimitedItemWidget listens for this to redraw its "X left of Y" overlay, and
                // it polls the server every 20s while visible. Without the dispatch the reply
                // landed on the offer and stopped there, so the count never moved on screen.
                this._widgetEvents?.emit(
                    ProductOfferUpdatedEvent.CWE_PRODUCT_OFFER_UPDATED,
                    new ProductOfferUpdatedEvent(offer)
                );

                return;
            }
        }
    }
}
