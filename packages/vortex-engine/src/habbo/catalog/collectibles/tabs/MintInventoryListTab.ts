import {Logger} from '@core/utils/Logger';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {ITextWindow} from '@core/window/components/ITextWindow';
import type {IItemGridWindow} from '@core/window/components/IItemGridWindow';
import type {IDropMenuWindow} from '@core/window/components/IDropMenuWindow';
import type {IWidgetWindow} from '@core/window/components/IWidgetWindow';
import type {IBitmapWrapperWindow} from '@core/window/components/IBitmapWrapperWindow';
import type {IStaticBitmapWrapperWindow} from '@core/window/components/IStaticBitmapWrapperWindow';
import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import type {IUpdateReceiver} from '@core/runtime';
import type {IDisposable} from '@core/runtime/IDisposable';
import {WindowEvent} from '@core/window/events/WindowEvent';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import {HabboWebTools} from '@habbo/utils/HabboWebTools';
import {FriendlyTime} from '@habbo/utils/FriendlyTime';
import type {CollectibleProductItem} from '@habbo/communication/messages/parser/collectibles/CollectibleProductItem';
import type {MintTokenOffer} from '@habbo/communication/messages/parser/collectibles/MintTokenOffer';
import type {CollectibleMintTokenCountMessageParser} from '@habbo/communication/messages/parser/collectibles/CollectibleMintTokenCountMessageParser';
import type {CollectibleMintingEnabledMessageParser} from '@habbo/communication/messages/parser/collectibles/CollectibleMintingEnabledMessageParser';
import type {CollectableMintableItemTypesMessageParser} from '@habbo/communication/messages/parser/collectibles/CollectableMintableItemTypesMessageParser';
import type {CollectibleMintTokenOffersMessageParser} from '@habbo/communication/messages/parser/collectibles/CollectibleMintTokenOffersMessageParser';
import {CollectibleMintableItemResultMessageParser} from '@habbo/communication/messages/parser/collectibles/CollectibleMintableItemResultMessageParser';
import {CollectibleMintTokenCountMessageEvent} from '@habbo/communication/messages/incoming/collectibles/CollectibleMintTokenCountMessageEvent';
import {CollectibleMintingEnabledMessageEvent} from '@habbo/communication/messages/incoming/collectibles/CollectibleMintingEnabledMessageEvent';
import {CollectableMintableItemTypesMessageEvent} from '@habbo/communication/messages/incoming/collectibles/CollectableMintableItemTypesMessageEvent';
import {CollectibleMintTokenOffersMessageEvent} from '@habbo/communication/messages/incoming/collectibles/CollectibleMintTokenOffersMessageEvent';
import {CollectibleMintableItemResultMessageEvent} from '@habbo/communication/messages/incoming/collectibles/CollectibleMintableItemResultMessageEvent';
import {GetCollectibleMintableItemTypesComposer} from '@habbo/communication/messages/outgoing/collectibles/GetCollectibleMintableItemTypesComposer';
import {GetCollectibleMintingEnabledComposer} from '@habbo/communication/messages/outgoing/collectibles/GetCollectibleMintingEnabledComposer';
import {GetCollectibleMintTokensComposer} from '@habbo/communication/messages/outgoing/collectibles/GetCollectibleMintTokensComposer';
import {GetMintTokenOffersComposer} from '@habbo/communication/messages/outgoing/collectibles/GetMintTokenOffersComposer';
import {MintItemComposer} from '@habbo/communication/messages/outgoing/collectibles/MintItemComposer';
import {CatalogEvent} from '../../event/CatalogEvent';

import type {HabboCatalog} from '../../HabboCatalog';
import type {CollectiblesController} from '../CollectiblesController';
import type {CollectiblesView} from '../CollectiblesView';
import {CollectibleProductPreviewer} from './subviews/CollectibleProductPreviewer';
import {MintInventoryItemRenderer} from '../renderer/MintInventoryItemRenderer';
import type {MintableItemWrapper} from '../renderer/model/MintableItemWrapper';
import {MintTokenPurchaseOffer} from './MintTokenPurchaseOffer';

const log = Logger.getLogger('habbo.catalog.collectibles.MintInventoryListTab');

/**
 * The minting tab: pick a furni you own, spend mint tokens, get a collectible.
 *
 * Readiness is **five** independent waits ANDed together — wallet, furni inventory, mintable types,
 * minting-enabled and token balance — each clearing its own flag as its reply lands. The first time
 * all five are clear the grid is populated; every later time only the preview is refreshed. That
 * one-shot is `_itemsPopulated`, and getting it wrong would rebuild the grid on every message.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/collectibles/tabs/MintInventoryListTab.as
 */
export class MintInventoryListTab implements IUpdateReceiver
{
    // AS3: MintInventoryListTab.as::PROGRESS_BAR_UPDATE_THRESHOLD — ms between countdown repaints.
    private static readonly PROGRESS_BAR_UPDATE_THRESHOLD = 1000;

    /** AS3: MintInventoryListTab.as::update() reads these two off CollectionsTab; both 20 and 90. */
    private static readonly BG_STAR_ROTATE_SPEED = 20;

    private static readonly LOADING_ICON_ROTATE_SPEED = 90;

    /** AS3: MintInventoryListTab.as::onCollectClicked() — the confirmation dialog's title bar. */
    private static readonly CONFIRM_TITLE_BAR_COLOR = 2763306;

    // AS3: MintInventoryListTab.as::_disposed
    private _disposed: boolean = false;
    // AS3: MintInventoryListTab.as::_messageEvents
    private _messageEvents: IMessageEvent[] = [];
    // AS3: MintInventoryListTab.as::_SafeStr_6905 (the item grid)
    private _itemGrid: IItemGridWindow | null = null;
    // AS3: MintInventoryListTab.as::_SafeStr_5556 (the hub view)
    private _view: CollectiblesView | null;
    // AS3: MintInventoryListTab.as::_SafeStr_4649 (this tab's container)
    private _container: IWindowContainer | null = null;
    // AS3: MintInventoryListTab.as::_SafeStr_4729 (the controller)
    private _controller: CollectiblesController;
    // AS3: MintInventoryListTab.as::_SafeStr_8774 (the grid cell template)
    private _gridItemTemplate: IWindowContainer | null = null;

    /** The five waits. Each is set when its request goes out and cleared when the reply lands. */
    // AS3: MintInventoryListTab.as::_SafeStr_7820 (waiting for the token balance)
    private _waitingForTokens: boolean = false;
    // AS3: MintInventoryListTab.as::_SafeStr_7988 (waiting for the mintable types)
    private _waitingForItemTypes: boolean = false;
    // AS3: MintInventoryListTab.as::_SafeStr_8252 (waiting for minting-enabled)
    private _waitingForMintingEnabled: boolean = false;
    // AS3: MintInventoryListTab.as::_SafeStr_8181 (waiting for the active wallet)
    private _waitingForWallet: boolean = false;
    // AS3: MintInventoryListTab.as::_SafeStr_8230 (waiting for the furni inventory)
    private _waitingForInventory: boolean = false;

    // AS3: MintInventoryListTab.as::_SafeStr_5861 (the ready flag)
    private _isReady: boolean = false;
    // AS3: MintInventoryListTab.as::_SafeStr_8618 (the mint-token balance)
    private _tokenBalance: number = 0;
    // AS3: MintInventoryListTab.as::_productItems
    private _productItems: CollectibleProductItem[] = [];
    // AS3: MintInventoryListTab.as::_SafeStr_9469 (minting is switched on)
    private _mintingEnabled: boolean = false;
    // AS3: MintInventoryListTab.as::_tokenOffers
    private _tokenOffers: MintTokenOffer[] = [];
    // AS3: MintInventoryListTab.as::_SafeStr_8141 (a mint is in flight)
    private _mintInFlight: boolean = false;
    // AS3: MintInventoryListTab.as::_SafeStr_4690 (the selected cell)
    private _selectedItem: MintInventoryItemRenderer | null = null;
    // AS3: MintInventoryListTab.as::_SafeStr_6819 (the large preview)
    private _previewer: CollectibleProductPreviewer | null = null;
    // AS3: MintInventoryListTab.as::_SafeStr_6510 (the rotating backdrop star)
    private _backgroundStar: IStaticBitmapWrapperWindow | null = null;
    // AS3: MintInventoryListTab.as::_loadingIcon
    private _loadingIcon: IStaticBitmapWrapperWindow | null = null;
    // AS3: MintInventoryListTab.as::_SafeStr_7449 (ms accumulated since the last countdown repaint)
    private _progressBarElapsed: number = 0;
    // AS3: MintInventoryListTab.as::_items
    private _items: MintInventoryItemRenderer[] = [];
    // AS3: MintInventoryListTab.as::_SafeStr_8036 (the grid has been populated once)
    private _itemsPopulated: boolean = false;

    // AS3: MintInventoryListTab.as::MintInventoryListTab()
    constructor(view: CollectiblesView, controller: CollectiblesController)
    {
        this._view = view;
        this._controller = controller;

        this._container = view.window?.findChildByName('mintingContainer') as IWindowContainer | null ?? null;

        if(this._container === null) return;

        const grid = this._container.findChildByName('itemgrid_inventory') as IItemGridWindow | null;

        this._itemGrid = grid;
        this._gridItemTemplate = grid?.getGridItemAt(0) as IWindowContainer | null ?? null;

        // Note `removeGridItem(template)` here, not `removeGridItems()` as the shop tab uses —
        // AS3 pulls out that one cell and leaves any others in place.
        if(this._gridItemTemplate !== null) grid?.removeGridItem(this._gridItemTemplate);

        this._backgroundStar = this._container.findChildByName('bg_star') as IStaticBitmapWrapperWindow | null;
        this._loadingIcon = this._container.findChildByName('loading_icon') as IStaticBitmapWrapperWindow | null;

        // Six of the eight windows are null here: the mint preview shows furni and avatars only, so
        // it has no badge, pet, unknown or effect surface. Compare ShopTab, which passes all eight.
        this._previewer = new CollectibleProductPreviewer(
            this.productPreviewBitmap,
            null,
            null,
            null,
            this.avatarImageWidget,
            this.placeholderImage
        );
        this._previewer.setPlaceholder();

        this.addMessageEvents();
        this.initializeData();
        this.updateReadyState(false);

        controller.registerUpdateReceiver(this, 1);

        this.createWalletButton?.addEventListener(WindowMouseEvent.CLICK, this.onClickCreateWallet as unknown as (...args: unknown[]) => void);
        this.moreInfoButton?.addEventListener(WindowMouseEvent.CLICK, this.onClickMoreInfo as unknown as (...args: unknown[]) => void);
        this.stampsPurchaseDropdown?.addEventListener(WindowEvent.WE_SELECTED, this.onSelectTokenOffer as unknown as (...args: unknown[]) => void);
        this.stampBuyButton?.addEventListener(WindowMouseEvent.CLICK, this.onBuyStampsClicked as unknown as (...args: unknown[]) => void);
        this.collectButton?.addEventListener(WindowMouseEvent.CLICK, this.onCollectClicked as unknown as (...args: unknown[]) => void);
    }

    // AS3: MintInventoryListTab.as::addMessageEvents()
    private addMessageEvents(): void
    {
        this._messageEvents = [
            new CollectibleMintTokenCountMessageEvent(this.onCollectibleMintTokensMessage),
            new CollectibleMintingEnabledMessageEvent(this.onCollectibleMintingEnabledMessage),
            new CollectableMintableItemTypesMessageEvent(this.onCollectableMintableItemTypesMessage),
            new CollectibleMintTokenOffersMessageEvent(this.onMintTokenOffersMessage),
            new CollectibleMintableItemResultMessageEvent(this.onMintItemResult),
        ];

        for(const event of this._messageEvents) this._controller.addMessageEvent(event);
    }

    /**
     * The one-shot is the point: the grid is populated the *first* time all five waits clear, and
     * from then on `refreshPreview` decides whether anything else happens. `_itemsPopulated` is
     * what survives a `_isReady` flip back to false, so a later message does not rebuild the grid.
     */
    // AS3: MintInventoryListTab.as::updateReadyState()
    private updateReadyState(refreshPreview: boolean): void
    {
        const ready = !this._waitingForWallet
            && !this._waitingForInventory
            && !this._waitingForItemTypes
            && !this._waitingForMintingEnabled
            && !this._waitingForTokens;

        // TS-only: no AS3 counterpart. Five independent waits gate this tab and a stuck one is
        // indistinguishable from the other four on screen — the spinner just never stops. Naming
        // the outstanding ones turns "Relics loads forever" into a single line that says which
        // message never came back.
        //
        // `info`, not `debug`, on purpose: Logger maps DEBUG onto `console.debug`, which Chrome
        // files under Verbose and hides unless that box is ticked — a debug probe here reads as
        // "the code never ran" when it merely never showed.
        if(!ready)
        {
            const outstanding: string[] = [];

            if(this._waitingForWallet) outstanding.push('wallet');
            if(this._waitingForInventory) outstanding.push('inventory(furni)');
            if(this._waitingForItemTypes) outstanding.push('mintableItemTypes');
            if(this._waitingForMintingEnabled) outstanding.push('mintingEnabled');
            if(this._waitingForTokens) outstanding.push('mintTokens');

            log.info(`MintInventoryListTab still waiting on: ${outstanding.join(', ')}`);
        }

        if(ready)
        {
            if(!this._isReady && !this._itemsPopulated)
            {
                this.populateItems(this._productItems);
            }
            else if(refreshPreview)
            {
                this.reloadPreview();
            }
        }

        this._isReady = ready;

        const loaded = this.loadedContainer;
        const loading = this.loadingContainer;

        if(loaded !== null) loaded.visible = this._isReady;
        if(loading !== null) loading.visible = !this._isReady;
    }

    // AS3: MintInventoryListTab.as::onCollectibleMintTokensMessage()
    private onCollectibleMintTokensMessage = (event: IMessageEvent): void =>
    {
        const parser = event.parser as CollectibleMintTokenCountMessageParser | null;

        if(parser === null) return;

        this._waitingForTokens = false;
        this._tokenBalance = parser.totalTokens;

        const balance = this.mintTokenBalanceText;

        if(balance !== null) balance.text = String(this._tokenBalance);

        this.updateReadyState(true);

        // DEVIATION: the AS3 stops at the line above, and the confirmation dialog it opened in
        // onBuyStampsClicked() is left on screen for good. `onBuyButtonClick()` disables Buy AND
        // Cancel before sending — so what remains is a dialog with two dead buttons and a close
        // cross, which the player has to dismiss by hand after every purchase.
        //
        // Not an impression: `_SafeStr_4602` (the dialog) is touched in 18 places in HabboCatalog.as
        // and none of them is a mint-token path. Its sibling purchase has one — `onNftStorePurchase`
        // disposes it on the answer — and this message is this purchase's answer, arriving with the
        // new balance. The dialog is closed here for the same reason and at the same moment.
        //
        // Only ever its own dialog: this message is also what the tab requests when it opens, and
        // closing whatever happens to be on screen then would shut a purchase somebody else started.
        (this._controller.catalog as unknown as HabboCatalog | null)?.closeMintTokenPurchaseConfirmation();
    };

    // AS3: MintInventoryListTab.as::onCollectibleMintingEnabledMessage()
    private onCollectibleMintingEnabledMessage = (event: IMessageEvent): void =>
    {
        const parser = event.parser as CollectibleMintingEnabledMessageParser | null;

        if(parser === null) return;

        this._waitingForMintingEnabled = false;
        this._mintingEnabled = parser.enabled;
        this.updateReadyState(true);
    };

    /**
     * The hub pushes the active wallet in here. A null wallet clears the wait *without* requesting
     * a balance — so the tab becomes ready with no tokens known — and swaps the purchasing panel
     * for the "you have no wallet" one.
     */
    // AS3: MintInventoryListTab.as::set activeWallet()
    set activeWallet(wallet: string | null)
    {
        this._waitingForWallet = false;

        if(wallet !== null)
        {
            this._waitingForTokens = true;
            this._controller.send(new GetCollectibleMintTokensComposer(wallet));
        }

        this.updateReadyState(true);

        const purchasing = this.stampPurchasingContainer;
        const noWallet = this.noWalletContainer;

        if(purchasing !== null) purchasing.visible = wallet !== null;
        if(noWallet !== null) noWallet.visible = wallet === null;
    }

    // AS3: MintInventoryListTab.as::onCollectableMintableItemTypesMessage()
    private onCollectableMintableItemTypesMessage = (event: IMessageEvent): void =>
    {
        const parser = event.parser as CollectableMintableItemTypesMessageParser | null;

        if(parser === null) return;

        this._waitingForItemTypes = false;
        this._productItems = parser.collectibleProductItems;
        this.updateReadyState(true);
    };

    /**
     * The dropdown lists *token counts*, not prices — AS3 pushes `amountTokens` into a
     * `Vector.<String>` and lets the int coerce.
     */
    // AS3: MintInventoryListTab.as::onMintTokenOffersMessage()
    private onMintTokenOffersMessage = (event: IMessageEvent): void =>
    {
        const parser = event.parser as CollectibleMintTokenOffersMessageParser | null;

        if(parser === null) return;

        this._tokenOffers = parser.tokenOffers;

        const captions = this._tokenOffers.map((offer) => String(offer.amountTokens));
        const dropdown = this.stampsPurchaseDropdown;

        dropdown?.populateWithVector(captions);

        if(captions.length > 0 && dropdown !== null)
        {
            dropdown.selection = 0;
            this.onSelectTokenOffer();
        }
    };

    // AS3: MintInventoryListTab.as::onSelectTokenOffer()
    private onSelectTokenOffer = (): void =>
    {
        const offer = this.selectedTokenOffer;

        // AS3 dereferences the offer unguarded and would throw on an empty dropdown; it is only
        // ever called with a selection in place. The port returns instead.
        if(offer === null) return;

        const cost = this.silverCost;

        if(cost !== null) cost.text = String(offer.silverPrice);

        const silverBalance = this._controller.catalog?.getPurse().silverBalance ?? 0;

        if(offer.silverPrice <= silverBalance)
        {
            this.stampBuyButton?.enable();
        }
        else
        {
            this.stampBuyButton?.disable();
        }
    };

    // AS3: MintInventoryListTab.as::get selectedTokenOffer()
    private get selectedTokenOffer(): MintTokenOffer | null
    {
        const index = this.stampsPurchaseDropdown?.selection ?? -1;

        if(index < 0 || index >= this._tokenOffers.length) return null;

        return this._tokenOffers[index];
    }

    // AS3: MintInventoryListTab.as::onBuyStampsClicked()
    private onBuyStampsClicked = (): void =>
    {
        const offer = this.selectedTokenOffer;
        const wallet = this._view?.activeWallet ?? null;
        const catalog = this._controller.catalog;

        if(offer === null || wallet === null || catalog === null) return;

        // AS3 casts here too — showPurchaseConfirmation() is on the concrete class, not the
        // interface. See ShopTab.onClickBuy().
        (catalog as unknown as HabboCatalog).showPurchaseConfirmation(new MintTokenPurchaseOffer(offer), -1, wallet);
    };

    /** The furni inventory finished loading — one of the five waits. Ignores every other category. */
    // AS3: MintInventoryListTab.as::onInventoryInitialize()
    onInventoryInitialize(category: string): void
    {
        if(category !== 'furni') return;

        this._waitingForInventory = false;
        this.updateReadyState(true);
    }

    /**
     * A furni was added to or removed from the inventory: find the matching cell and re-count it.
     *
     * The type test is the interesting line — `itemType === 'i' && isWallItem` OR
     * `itemType === 's' && !isWallItem`. The parser's letters and the caller's boolean have to
     * agree, so a wall item only matches an `"i"` row. Note it returns after the first match: one
     * cell per furni type.
     */
    // AS3: MintInventoryListTab.as::amountChangedForItem()
    amountChangedForItem(category: string, itemTypeId: number, isWallItem: boolean): void
    {
        if(category !== 'furni') return;

        if(!this._isReady || this._items.length === 0) return;

        for(const renderer of this._items)
        {
            const item = renderer.item;
            const typeMatches = (item.itemType === 'i' && isWallItem) || (item.itemType === 's' && !isWallItem);

            if(!typeMatches || item.itemTypeId !== itemTypeId) continue;

            (renderer.renderableItem as MintableItemWrapper).amount = this.getIdsInInventory(item).length;
            renderer.updateVisuals();

            if(renderer === this._selectedItem) this.reloadPreview();

            return;
        }
    }

    /**
     * Four requests and two locally-set waits. Note `_waitingForInventory` is only raised when the
     * furni category has *not* already initialised — an inventory that is already loaded is not
     * waited on.
     */
    // AS3: MintInventoryListTab.as::initializeData()
    private initializeData(): void
    {
        // TS-only: pairs with the wait dump in updateReadyState(). If this line is absent from the
        // console when Relics is opened, the tab was never initialized at all and the spinner is
        // just the layout's default state — a different bug from any of the five waits hanging.
        log.info(`MintInventoryListTab.initializeData(): walletsLoaded=${this._view?.walletsLoaded() === true}, activeWallet=${this._view?.activeWallet ?? 'null'}`);

        this._waitingForItemTypes = true;
        this._controller.send(new GetCollectibleMintableItemTypesComposer());

        this._waitingForMintingEnabled = true;
        this._controller.send(new GetCollectibleMintingEnabledComposer());

        if(this._controller.inventory?.checkCategoryInitilization('furni') === false)
        {
            this._waitingForInventory = true;
        }

        this._waitingForWallet = true;

        if(this._view?.walletsLoaded() === true)
        {
            this.activeWallet = this._view.activeWallet;
        }

        this.stampBuyButton?.disable();
        this._controller.send(new GetMintTokenOffersComposer());
    }

    // AS3: MintInventoryListTab.as::populateItems()
    populateItems(productItems: CollectibleProductItem[]): void
    {
        const template = this._gridItemTemplate;

        if(template !== null)
        {
            for(const productItem of productItems)
            {
                const cell = template.clone() as IWindowContainer;
                const renderer = new MintInventoryItemRenderer(
                    this._controller, productItem, cell, this, this.getIdsInInventory(productItem).length
                );

                this._itemGrid?.addGridItem(cell);
                this._items.push(renderer);
            }
        }

        this._itemsPopulated = true;

        if(this._items.length > 0)
        {
            this._selectedItem = this._items[0];
            this._selectedItem.activate();
            this.initMintItemPreview();
        }

        const preview = this.previewWindow;

        if(preview !== null) preview.visible = this._items.length > 0;
    }

    /**
     * Which inventory ids back one mintable type. `"i"` means wall, `"s"` means floor, and anything
     * else — including the `"cl"` clothing type the parser can produce — returns empty, so a
     * clothing collectible is never mintable from inventory.
     */
    // AS3: MintInventoryListTab.as::getIdsInInventory()
    private getIdsInInventory(productItem: CollectibleProductItem): number[]
    {
        const itemType = productItem.itemType;
        let isWallItem = false;

        if(itemType === 'i')
        {
            isWallItem = true;
        }
        else if(itemType !== 's')
        {
            return [];
        }

        return this._controller.inventory?.getNonRentedInventoryIds('furni', productItem.itemTypeId, isWallItem) ?? [];
    }

    // AS3: MintInventoryListTab.as::selectItem()
    selectItem(item: MintInventoryItemRenderer | null): void
    {
        if(this._selectedItem !== null)
        {
            this._selectedItem.deactivate();
            this._selectedItem = null;
        }

        if(item === null) return;

        this._selectedItem = item;
        this._selectedItem.activate();
        this.initMintItemPreview();
    }

    // AS3: MintInventoryListTab.as::reloadPreview()
    private reloadPreview(): void
    {
        this.initMintItemPreview();
    }

    /**
     * Six conditions disable the collect button, and any one of them is enough: no wallet, no copy
     * of the furni, not enough tokens, the mint window closed, minting switched off hotel-wide, or
     * a mint already in flight.
     */
    // AS3: MintInventoryListTab.as::initMintItemPreview()
    private initMintItemPreview(): void
    {
        const selected = this._selectedItem;

        if(selected === null || this._previewer === null) return;

        this._previewer.clearPreviewer();
        this._controller.previewImage(selected.renderableItem, this._previewer);

        const name = this.productNameText;

        if(name !== null) name.text = this._controller.getProductName(selected.renderableItem);

        const item = selected.item;
        const noWallet = this._view?.activeWallet === null;
        const noFurni = selected.renderableItem.amount === 0;
        const notEnoughTokens = this._tokenBalance < item.price;
        const expired = this.isMintPeriodExpired();

        const price = this.stampPricingText;

        if(price !== null) price.text = String(item.price);

        const noFurniNotice = this.noFurniNotification;

        if(noFurniNotice !== null) noFurniNotice.visible = noFurni;

        const lockText = this.mintLockedText;
        const lockClosed = this.mintLockClosedImage;
        const lockOpen = this.mintLockOpenImage;

        if(item.regionLocked)
        {
            if(lockText !== null) lockText.text = this.localization?.getLocalization('shop.minting.region_locked') ?? '';
            if(lockClosed !== null) lockClosed.visible = true;
            if(lockOpen !== null) lockOpen.visible = false;
        }
        else
        {
            if(lockText !== null) lockText.text = this.localization?.getLocalization('shop.minting.region_unlocked') ?? '';
            if(lockClosed !== null) lockClosed.visible = false;
            if(lockOpen !== null) lockOpen.visible = true;
        }

        this.updateProgressBar(true);

        if(noWallet || noFurni || notEnoughTokens || expired || !this._mintingEnabled || this._mintInFlight)
        {
            this.collectButton?.disable();
        }
        else
        {
            this.collectButton?.enable();
        }
    }

    // AS3: MintInventoryListTab.as::onCollectClicked()
    private onCollectClicked = (): void =>
    {
        this.collectButton?.disable();

        const dialog = this._controller.windowManager?.confirm(
            '${shop.minting.confirm.title}',
            '${shop.minting.confirm.description}',
            0,
            this.onCollectConfirmDialogConfirm
        ) ?? null;

        if(dialog !== null) dialog.titleBarColor = MintInventoryListTab.CONFIRM_TITLE_BAR_COLOR;
    };

    /**
     * Mints the *first* inventory copy of the selected type — `getIdsInInventory(...)[0]` — so
     * which physical furni is consumed is not the player's choice.
     *
     * Note the two early returns skip `reloadPreview()` entirely, leaving the collect button
     * disabled from `onCollectClicked()`. AS3's, and it means cancelling out of a wallet-less state
     * leaves the button dead until the next preview refresh.
     */
    // AS3: MintInventoryListTab.as::onCollectConfirmDialogConfirm()
    private onCollectConfirmDialogConfirm = (dialog: IDisposable, event: WindowEvent): void =>
    {
        dialog.dispose();

        if(event.type === 'WE_OK')
        {
            const wallet = this._view?.activeWallet ?? null;

            if(this._selectedItem === null || wallet === null) return;

            const ids = this.getIdsInInventory(this._selectedItem.item);

            if(ids.length === 0) return;

            this._mintInFlight = true;
            this._controller.send(new MintItemComposer(ids[0], wallet));
        }

        this.reloadPreview();
    };

    /**
     * Success is `mintResult === RESULT_OK`, which is **1**, not 0 — see
     * `CollectibleMintableItemResultMessageParser`, where the two shared obfuscated constants come
     * back swapped against every sibling result parser.
     */
    // AS3: MintInventoryListTab.as::onMintItemResult()
    private onMintItemResult = (event: IMessageEvent): void =>
    {
        const parser = event.parser as CollectibleMintableItemResultMessageParser | null;

        if(parser === null) return;

        const success = parser.mintResult === CollectibleMintableItemResultMessageParser.RESULT_OK;

        this._controller.catalog?.events.emit(
            success ? CatalogEvent.COLLECTIBLES_MINT_SUCCESS : CatalogEvent.COLLECTIBLES_MINT_FAIL,
            new CatalogEvent(success ? CatalogEvent.COLLECTIBLES_MINT_SUCCESS : CatalogEvent.COLLECTIBLES_MINT_FAIL)
        );

        this._mintInFlight = false;
        this.reloadPreview();
    };

    /**
     * The mint-window countdown. Repaints at most once a second unless forced — `_progressBarElapsed`
     * accumulates the frame deltas and the threshold gates the work.
     *
     * The bar is drawn as *remaining* fraction, so it empties as the window closes; at zero the
     * label switches to "ended" and the collect button is disabled outright.
     */
    // AS3: MintInventoryListTab.as::updateProgressBar()
    updateProgressBar(force: boolean = true, elapsedMs: number = 0): void
    {
        this._progressBarElapsed += elapsedMs;

        const due = force || this._progressBarElapsed >= MintInventoryListTab.PROGRESS_BAR_UPDATE_THRESHOLD;

        if(!due || this._selectedItem === null) return;

        this._progressBarElapsed = 0;

        const startMs = this._selectedItem.item.startTime * 1000;
        const endMs = this._selectedItem.item.endTime * 1000;

        if(startMs <= 0 || endMs <= 0) return;

        const now = Date.now();
        const remaining = Math.max(0, endMs - now);
        const total = endMs - startMs;
        const fractionLeft = Math.max(0, Math.min(1, remaining / total));
        const ended = fractionLeft <= 0;

        const padded = this.completionProgressBarPadded;
        const top = this.completionProgressBarTop;
        const bottom = this.completionProgressBarBottom;
        const width = Math.trunc((padded?.width ?? 0) * fractionLeft);

        if(top !== null) top.width = width;
        if(bottom !== null) bottom.width = width;

        const text = this.completionProgressBarText;

        if(text === null) return;

        if(!ended)
        {
            const friendly = FriendlyTime.getFriendlyTime(this.localization, remaining / 1000);

            // AS3 calls getLocalizationWithParams() with only the key — no default, no params — so
            // it behaves as a plain lookup. Kept as the plain lookup it amounts to.
            text.text = `${this.localization?.getLocalization('shop.minting.time_left') ?? ''}: ${friendly}`;

            return;
        }

        text.text = this.localization?.getLocalization('shop.minting.time_ended') ?? '';
        this.collectButton?.disable();
    }

    /** A tab with nothing selected reports the window expired, which keeps the button disabled. */
    // AS3: MintInventoryListTab.as::isMintPeriodExpired()
    private isMintPeriodExpired(): boolean
    {
        if(this._selectedItem === null) return true;

        return this._selectedItem.item.endTime * 1000 < Date.now();
    }

    // AS3: MintInventoryListTab.as::get localization()
    private get localization(): IHabboLocalizationManager | null
    {
        return this._controller.localizationManager;
    }

    // AS3: MintInventoryListTab.as::onClickCreateWallet()
    private onClickCreateWallet = (): void =>
    {
        HabboWebTools.openWebPageAndMinimizeClient(this._controller.getProperty('nft.wallet.create.url'));
    };

    // AS3: MintInventoryListTab.as::onClickMoreInfo()
    private onClickMoreInfo = (): void =>
    {
        HabboWebTools.openWebPageAndMinimizeClient(this._controller.getProperty('web.settings.wallet.relativeUrl'));
    };

    // AS3: MintInventoryListTab.as::removeMessageEvents()
    private removeMessageEvents(): void
    {
        for(const event of this._messageEvents) this._controller.removeMessageEvent(event);

        this._messageEvents = [];
    }

    // AS3: MintInventoryListTab.as::clearItems()
    clearItems(): void
    {
        for(const item of this._items) item.dispose();

        this._items = [];
        this._itemGrid?.destroyGridItems();
        this._itemsPopulated = false;
    }

    // AS3: MintInventoryListTab.as::update()
    update(elapsedMs: number): void
    {
        if(this._isReady)
        {
            if(this._backgroundStar !== null)
            {
                this._backgroundStar.rotation += MintInventoryListTab.BG_STAR_ROTATE_SPEED * (elapsedMs / 1000);
                this._backgroundStar.rotation %= 360;
                this._backgroundStar.invalidate();
            }

            this.updateProgressBar(false, elapsedMs);

            return;
        }

        if(this._loadingIcon === null) return;

        this._loadingIcon.rotation += MintInventoryListTab.LOADING_ICON_ROTATE_SPEED * (elapsedMs / 1000);
        this._loadingIcon.rotation %= 360;
        this._loadingIcon.invalidate();
    }

    // AS3: MintInventoryListTab.as::get loadingContainer()
    private get loadingContainer(): IWindowContainer | null
    {
        return this._container?.findChildByName('loading_contents') as IWindowContainer | null ?? null;
    }

    // AS3: MintInventoryListTab.as::get loadedContainer()
    private get loadedContainer(): IWindowContainer | null
    {
        return this._container?.findChildByName('loaded_content') as IWindowContainer | null ?? null;
    }

    // AS3: MintInventoryListTab.as::get previewWindow()
    private get previewWindow(): IWindowContainer | null
    {
        return this._container?.findChildByName('preview_container') as IWindowContainer | null ?? null;
    }

    // AS3: MintInventoryListTab.as::get productPreviewBitmap()
    private get productPreviewBitmap(): IBitmapWrapperWindow | null
    {
        return this._container?.findChildByName('product_preview') as IBitmapWrapperWindow | null ?? null;
    }

    // AS3: MintInventoryListTab.as::get avatarImageWidget()
    private get avatarImageWidget(): IWidgetWindow | null
    {
        return this._container?.findChildByName('avatar_image_widget') as IWidgetWindow | null ?? null;
    }

    // AS3: MintInventoryListTab.as::get productNameText()
    private get productNameText(): ITextWindow | null
    {
        return this._container?.findChildByName('preview_furni_name') as ITextWindow | null ?? null;
    }

    // AS3: MintInventoryListTab.as::get placeholderImage()
    private get placeholderImage(): IStaticBitmapWrapperWindow | null
    {
        return this._container?.findChildByName('placeholder_image') as IStaticBitmapWrapperWindow | null ?? null;
    }

    // AS3: MintInventoryListTab.as::get stampPricingText()
    private get stampPricingText(): ITextWindow | null
    {
        return this._container?.findChildByName('stamp_pricing') as ITextWindow | null ?? null;
    }

    // AS3: MintInventoryListTab.as::get collectButton()
    private get collectButton(): IWindow | null
    {
        return this._container?.findChildByName('collect_button') ?? null;
    }

    // AS3: MintInventoryListTab.as::get noFurniNotification()
    private get noFurniNotification(): IWindow | null
    {
        return this._container?.findChildByName('no_furni_notify') ?? null;
    }

    // AS3: MintInventoryListTab.as::get mintLockedText()
    private get mintLockedText(): ITextWindow | null
    {
        return this._container?.findChildByName('mint_lock_text') as ITextWindow | null ?? null;
    }

    // AS3: MintInventoryListTab.as::get mintLockOpenImage()
    private get mintLockOpenImage(): IStaticBitmapWrapperWindow | null
    {
        return this._container?.findChildByName('mint_lock_open_icon') as IStaticBitmapWrapperWindow | null ?? null;
    }

    // AS3: MintInventoryListTab.as::get mintLockClosedImage()
    private get mintLockClosedImage(): IStaticBitmapWrapperWindow | null
    {
        return this._container?.findChildByName('mint_lock_closed_icon') as IStaticBitmapWrapperWindow | null ?? null;
    }

    // AS3: MintInventoryListTab.as::get completionProgressBarPadded()
    private get completionProgressBarPadded(): IWindow | null
    {
        return this._container?.findChildByName('progress_padded_bar') ?? null;
    }

    // AS3: MintInventoryListTab.as::get completionProgressBarTop()
    private get completionProgressBarTop(): IWindow | null
    {
        return this._container?.findChildByName('progress_bar_top') ?? null;
    }

    // AS3: MintInventoryListTab.as::get completionProgressBarBottom()
    private get completionProgressBarBottom(): IWindow | null
    {
        return this._container?.findChildByName('progress_bar_bottom') ?? null;
    }

    // AS3: MintInventoryListTab.as::get completionProgressBarText()
    private get completionProgressBarText(): ITextWindow | null
    {
        return this._container?.findChildByName('progress_bar_text') as ITextWindow | null ?? null;
    }

    // AS3: MintInventoryListTab.as::get stampPurchasingContainer()
    private get stampPurchasingContainer(): IWindowContainer | null
    {
        return this._container?.findChildByName('stamp_purchasing_container') as IWindowContainer | null ?? null;
    }

    // AS3: MintInventoryListTab.as::get noWalletContainer()
    private get noWalletContainer(): IWindowContainer | null
    {
        return this._container?.findChildByName('no_wallet_container') as IWindowContainer | null ?? null;
    }

    // AS3: MintInventoryListTab.as::get createWalletButton()
    private get createWalletButton(): IWindow | null
    {
        return this._container?.findChildByName('create_wallet_button') ?? null;
    }

    // AS3: MintInventoryListTab.as::get moreInfoButton()
    private get moreInfoButton(): IWindow | null
    {
        return this._container?.findChildByName('more_info_button') ?? null;
    }

    // AS3: MintInventoryListTab.as::get mintTokenBalanceText()
    private get mintTokenBalanceText(): ITextWindow | null
    {
        return this._container?.findChildByName('mint_token_balance') as ITextWindow | null ?? null;
    }

    // AS3: MintInventoryListTab.as::get stampsPurchaseDropdown()
    private get stampsPurchaseDropdown(): IDropMenuWindow | null
    {
        return this._container?.findChildByName('stamps_purchase_dropdown') as IDropMenuWindow | null ?? null;
    }

    /** Note the window names: `silver_cost_text` and `silver_buy_button`, not `stamp_*`. */
    // AS3: MintInventoryListTab.as::get silverCost()
    private get silverCost(): ITextWindow | null
    {
        return this._container?.findChildByName('silver_cost_text') as ITextWindow | null ?? null;
    }

    // AS3: MintInventoryListTab.as::get stampBuyButton()
    private get stampBuyButton(): IWindow | null
    {
        return this._container?.findChildByName('silver_buy_button') ?? null;
    }

    // AS3: MintInventoryListTab.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: MintInventoryListTab.as::dispose()
    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;

        this.clearItems();
        this.removeMessageEvents();
        this._controller.removeUpdateReceiver(this);

        // AS3 leaves all five listeners attached; the port removes them, as its sibling tabs do.
        this.createWalletButton?.removeEventListener(WindowMouseEvent.CLICK, this.onClickCreateWallet as unknown as (...args: unknown[]) => void);
        this.moreInfoButton?.removeEventListener(WindowMouseEvent.CLICK, this.onClickMoreInfo as unknown as (...args: unknown[]) => void);
        this.stampsPurchaseDropdown?.removeEventListener(WindowEvent.WE_SELECTED, this.onSelectTokenOffer as unknown as (...args: unknown[]) => void);
        this.stampBuyButton?.removeEventListener(WindowMouseEvent.CLICK, this.onBuyStampsClicked as unknown as (...args: unknown[]) => void);
        this.collectButton?.removeEventListener(WindowMouseEvent.CLICK, this.onCollectClicked as unknown as (...args: unknown[]) => void);

        this._previewer?.dispose();
        this._previewer = null;

        this._container = null;
        this._itemGrid = null;
        this._gridItemTemplate = null;
        this._backgroundStar = null;
        this._loadingIcon = null;
        this._view = null;
    }
}
