import {OpenFlatConnectionMessageComposer} from '@habbo/communication/messages/outgoing/room/session/OpenFlatConnectionMessageComposer';
import {
    RequestFurniInventoryWhenNotInRoomComposer
} from '@habbo/communication/messages/outgoing/inventory/RequestFurniInventoryWhenNotInRoomComposer';
import {RequestRoomPropertySetComposer} from '@habbo/communication/messages/outgoing/inventory/RequestRoomPropertySetComposer';

import type {IFurniModel} from './IFurniModel';
import type {IStuffData} from '@habbo/room/object/data/IStuffData';
import type {LegacyStuffData} from '@habbo/room/object/data/LegacyStuffData';
import type {IFurnitureItem} from '../items/IFurnitureItem';
import type {ITextFieldWindow} from '@core/window/components/ITextFieldWindow';
import type {IFurnitureItemData} from '../items/FurnitureItemData';
import type {HabboInventory} from '../HabboInventory';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IHabboSoundManager} from '@habbo/sound/IHabboSoundManager';
import type {IRoomEngine} from '@habbo/room/IRoomEngine';
import {RoomEngineObjectEvent} from '@habbo/room/events/RoomEngineObjectEvent';
import type {IHabboCommunicationManager} from '../../communication/IHabboCommunicationManager';
import type {IHabboCatalog} from '@habbo/catalog/IHabboCatalog';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {RoomEngineObjectPlacedEvent} from '@habbo/room/events/RoomEngineObjectPlacedEvent';
import {GroupItem} from '../items/GroupItem';
import {CreditTradingItem} from '../items/CreditTradingItem';
import {HabboInventoryCategoryInitializeEvent} from '../events/HabboInventoryCategoryInitializeEvent';
import {FurnitureItem} from '../items/FurnitureItem';
import {FurnitureCategory, UnseenItemCategory} from '../enum';
import {FurniView} from './FurniView';
import {RoomObjectCategoryEnum} from '@habbo/room/object/RoomObjectCategoryEnum';

/**
 * Manages furniture inventory data
 *
 * Based on AS3 com.sulake.habbo.inventory.furni.FurniModel (ENGINE only)
 * UI is the ported FurniView window.
 */
export class FurniModel implements IFurniModel
{
    /**
     * AS3 inlines this as a bare `1500` in `requestSelectedFurniToTrading()` — the ceiling on how
     * many of your own items one trade may hold. Name DERIVED; the literal is unnamed in AS3.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::requestSelectedFurniToTrading()
    private static readonly MAX_ITEMS_IN_TRADE: number = 1500;

    private _currentCategory: 'furni' | 'rentables' = 'furni';
    private _categorySelections: Map<string, GroupItem | null> = new Map();

    private _habboInventory: HabboInventory;
    // AS3: .../src/com/sulake/habbo/inventory/furni/FurniModel.as::_windowManager
    private _windowManager: IHabboWindowManager;
    // AS3: .../src/com/sulake/habbo/inventory/furni/FurniModel.as::_roomEngine
    private _roomEngine: IRoomEngine;
    // AS3: .../src/com/sulake/habbo/inventory/furni/FurniModel.as::_communication
    private _communication: IHabboCommunicationManager;
    // AS3: .../src/com/sulake/habbo/inventory/furni/FurniModel.as::_catalog
    private _catalog: IHabboCatalog;
    // AS3: .../src/com/sulake/habbo/inventory/furni/FurniModel.as::_localization
    private _localization: IHabboLocalizationManager;
    // AS3: .../src/com/sulake/habbo/inventory/furni/FurniModel.as::_soundManager
    private _soundManager: IHabboSoundManager | null;

    /**
	 * Whether the player is standing in a room. It picks which of the two furni-inventory requests
	 * goes out, and nothing else reads it.
	 */
    // AS3: .../src/com/sulake/habbo/inventory/furni/FurniModel.as::_isInRoom
    private _isInRoom: boolean = false;

    /**
	 * The item `gotoRoom()` was called for, held until the room finishes loading so the infostand
	 * can open on it. Cleared on use, so a second entry to the same room selects nothing.
	 */
    // AS3: .../src/com/sulake/habbo/inventory/furni/FurniModel.as::_roomItemToSelect
    private _roomItemToSelect: IFurnitureItem | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::get soundManager()
    get soundManager(): IHabboSoundManager | null
    {
        return this._soundManager;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::controller
    get controller(): HabboInventory
    {
        return this._habboInventory;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::localization
    get localization(): IHabboLocalizationManager
    {
        return this._localization;
    }

    get windowManager(): IHabboWindowManager
    {
        return this._windowManager;
    }

    get roomEngine(): IRoomEngine
    {
        return this._roomEngine;
    }

    get catalog(): IHabboCatalog
    {
        return this._catalog;
    }

    /**
     * The primary tree admits `wired_trading` alongside `trading` — the 2023 build tests only
     * `trading`. Both ids are the *view*'s, so this holds even though `inventory/wired_trading/`
     * itself is unported: that subcategory simply never becomes the active view here.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::get isTradingOpen()
    get isTradingOpen(): boolean
    {
        const subCategoryViewId = this._habboInventory.getSubCategoryViewId();

        return subCategoryViewId === 'trading' || subCategoryViewId === 'wired_trading';
    }

    constructor(
        habboInventory: HabboInventory,
        windowManager: IHabboWindowManager,
        roomEngine: IRoomEngine,
        communication: IHabboCommunicationManager,
        catalog: IHabboCatalog,
        localization: IHabboLocalizationManager,
        soundManager: IHabboSoundManager | null
    )
    {
        this._habboInventory = habboInventory;
        this._windowManager = windowManager;
        this._roomEngine = roomEngine;
        this._communication = communication;
        this._catalog = catalog;
        this._localization = localization;
        this._soundManager = soundManager;
        this._categorySelections.set('furni', null);
        this._categorySelections.set('rentables', null);
        this._view = new FurniView(this);
        this._roomEngine.events.on(RoomEngineObjectEvent.REOE_PLACED, this.onObjectPlaced);
    }

    /** AS3's `new Timer(50)`. */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::FurniModel()
    private static readonly IMAGE_UPDATE_INTERVAL_MS = 50;

    /** AS3's `_imageUpdateCumulativeTime >= 200`. */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::onImageUpdateTimerEvent()
    private static readonly RENT_SWEEP_INTERVAL_MS = 200;

    /**
     * Name DERIVED: AS3's field is `_SafeStr_5802`, obfuscated. Named after what it drives.
     *
     * AS3 creates the `Timer` in the constructor and starts it from `initListImages()`; a browser
     * interval has no started/stopped pair, so it is created on that same first call and cleared
     * in `dispose()`.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::initListImages()
    private _imageUpdateTimer: ReturnType<typeof setInterval> | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::_imageUpdateCumulativeTime
    private _imageUpdateCumulativeTime: number = 0;

    private _view: FurniView;

    get view(): FurniView
    {
        return this._view;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::isListInited()
    isListInited(): boolean
    {
        return this._isListInitialized;
    }

    /**
	 * Marks the furniture list as built, one way only
	 *
	 * FurniView and the inventory message handler both refuse to act on an uninitialised list, so
	 * this is the gate that lets the first full inventory reply through. There is no reset — a
	 * rebuild replaces the items, not the flag.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::setListInitialized()
    setListInitialized(): void
    {
        this._isListInitialized = true;
    }

    /**
	 * Remembers which group is selected in the category currently on screen
	 *
	 * Per-category, so switching tabs and coming back restores the selection rather than clearing
	 * it — `selectItem()` writes the same map from inside.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::set categorySelection()
    set categorySelection(item: GroupItem | null)
    {
        this._categorySelections.set(this._currentCategory, item);
    }

    /**
	 * Asks the inventory to close the whole window
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::requestClose()
    requestClose(): void
    {
        this._habboInventory.closeView();
    }

    // DEVIATION: `createItemWindow()` keeps a per-layout template window and hands out clones of
    //   it. This port builds each thumbnail through `windowManager.buildWidgetLayout()` instead —
    //   same layout, same window per call, with the caching one layer down in the window manager's
    //   own layout registry rather than in a field here. See `GroupItem.createWindow()`.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::createItemWindow()

    // Not ported, and not a gap: `FurniModel.as::displayItemInfo()` forwards to
    // `FurniView.displayItemInfo()`, and BOTH are dead in AS3 itself — a repo-wide grep finds zero
    // call sites for either, as FurniView.ts's own note records. Re-checked 2026-09-01; the marker
    // here used to blame the view side for being unported, which read as owed work.

    private _showingNfts: boolean = true;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::get showingNfts()
    get showingNfts(): boolean
    {
        return this._showingNfts;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::get isPrivateRoom()
    get isPrivateRoom(): boolean
    {
        if(!this._habboInventory || !this._habboInventory.roomSession) return false;

        return this._habboInventory.roomSession.isPrivateRoom;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::canUserOfferToTrade()
    canUserOfferToTrade(): boolean
    {
        return this._habboInventory?.canUserOfferToTrade() ?? false;
    }

    /**
     * Jumps to the room the selected item is standing in, stashing the item so
     * {@link roomEntered} can open the infostand on it once the room has loaded.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::gotoRoom()
    gotoRoom(): void
    {
        const groupItem = this.getSelectedItem();

        if(groupItem === null) return;

        const item = groupItem.peek();

        if(item === null) return;

        this._communication.connection?.send(new OpenFlatConnectionMessageComposer(item.flatId));
        this._roomItemToSelect = item;
    }

    /**
     * The category constants are AS3's inline 20 (wall) and 10 (floor), and the id is taken as an
     * absolute value because a wall item's inventory id is stored negative.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::roomEntered()
    roomEntered(): void
    {
        this._isInRoom = true;

        const item = this._roomItemToSelect;

        if(item === null) return;

        this._roomEngine.selectRoomObject(item.flatId, Math.abs(item.id), item.isWallItem ? 20 : 10);
        this._roomItemToSelect = null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::roomLeft()
    roomLeft(): void
    {
        this._isInRoom = false;
    }

    /**
     * The whole batch rides on the *first* item's description — AS3 sends one composer for the
     * group, so type/category/groupable/stuffData all come from `coreItem`, not from each item.
     *
     * On overflow the count field is reset to "1" rather than left showing the rejected number,
     * and the same reset happens when there is no active trade at all.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::requestSelectedFurniToTrading()
    requestSelectedFurniToTrading(count: number = 1, offerInTradingCountButton: ITextFieldWindow | null = null): void
    {
        const groupItem = this.getSelectedItem();

        if(groupItem === null) return;

        const itemsInTrade = groupItem.getItemsForTrade(count);

        if(itemsInTrade.length === 0) return;

        const itemIds: number[] = [];
        let coreItem: IFurnitureItem | null = null;

        for(const furnitureItem of itemsInTrade)
        {
            itemIds.push(furnitureItem.id);

            if(coreItem === null) coreItem = furnitureItem;
        }

        if(coreItem === null) return;

        const trading = this._habboInventory.activeTradingModel;

        if(trading !== null)
        {
            const ownItemCount = trading.getOwnItemIdsInTrade().length;

            if(ownItemCount + itemIds.length <= FurniModel.MAX_ITEMS_IN_TRADE)
            {
                if(offerInTradingCountButton !== null) offerInTradingCountButton.text = String(itemIds.length);

                trading.requestAddItemsToTrading(
                    itemIds,
                    coreItem.isWallItem,
                    coreItem.type,
                    coreItem.category,
                    coreItem.groupable,
                    coreItem.stuffData
                );
            }
            else
            {
                if(offerInTradingCountButton !== null) offerInTradingCountButton.text = '1';

                this._windowManager.alert(
                    '${trading.items.too_many_items.title}',
                    '${trading.items.too_many_items.desc}',
                    0,
                    (dialog) => dialog.dispose()
                );
            }
        }
        else if(offerInTradingCountButton !== null)
        {
            offerInTradingCountButton.text = '1';
        }

        this._view.updateActionView();
    }

    /**
     * The inventory's Sell button. Note the `getOneForSelling()` probe before handing over: a group
     * whose every copy is already locked or unsellable must not open the offer dialog at all.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::requestSelectedFurniSelling()
    requestSelectedFurniSelling(): void
    {
        const groupItem = this.getSelectedItem();

        if(groupItem === null || groupItem.getOneForSelling() === null) return;

        this._habboInventory.marketplaceModel?.startOfferMaking(groupItem);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::showUseProductSelection()
    // The inventory's "use" button on a pet product: hands the group's top item to the room
    // engine, which raises ROSM_USE_PRODUCT_FROM_INVENTORY for AvatarInfoWidgetHandler to turn
    // into one bubble per pet the product applies to.
    showUseProductSelection(): void
    {
        const groupItem = this.getSelectedItem();
        const item = groupItem?.peek() ?? null;

        if(!item) return;

        this._roomEngine?.showUseProductSelection(item.ref, item.type);
    }

    /**
     * The two rent actions differ by one boolean — the server decides the price either way, and the
     * dialog only opens once it has answered. Both pass the item's *strip* id, which is what tells
     * the window it is acting on an inventory item rather than one standing in a room.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::extendRentPeriod()
    extendRentPeriod(): void
    {
        this.openRentConfirmation(false);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::buyRentedItem()
    buyRentedItem(): void
    {
        this.openRentConfirmation(true);
    }

    // TS-only: the two methods above are identical but for the buyout flag; AS3 repeats the body.
    private openRentConfirmation(buyout: boolean): void
    {
        const groupItem = this.getSelectedItem();

        if(groupItem === null) return;

        const item = groupItem.peek();

        if(item === null) return;

        const furnitureData = this._habboInventory.getFurnitureData(item.type, item.isWallItem ? 'i' : 's');

        this._catalog.openRentConfirmationWindow(furnitureData, buyout, -1, item.id);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::updateActionView()
    updateActionView(): void
    {
        this._view.updateActionView();
    }

    private _pendingPlacementRef: number = -1;
    private _isPlacing: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::cancelFurniInMover()
    cancelFurniInMover(): void
    {
        if(this._pendingPlacementRef > -1)
        {
            this._roomEngine.cancelRoomObjectInsert();
            this._isPlacing = false;
            this._pendingPlacementRef = -1;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::requestSelectedFurniPlacement()
    // AS3 takes TWO booleans, in this order. The port had only the second one, so
    // attemptPlaceNextFurni()'s `(false)` — AS3's `refuseRoomProperties = false` — was landing on
    // `useLastSelectedIndex` instead. Harmless in that path (the index is set just before the call)
    // but wrong, and it hid the fact that the first argument was never ported at all.
    //
    // `refuseRoomProperties` is what tells the three decoration categories apart from everything
    // else: with it set the call simply fails for them (the caller wants a *placement*, and a
    // wallpaper cannot be placed), and without it they are applied to the room instead.
    requestSelectedFurniPlacement(refuseRoomProperties: boolean = false, useLastSelectedIndex: boolean = true): boolean
    {
        const groupItem = this.getSelectedItem();

        if(groupItem === null) return false;

        if(groupItem.getUnlockedCount() === 0) return false;

        if(groupItem.selectedItemIndex < 0 && useLastSelectedIndex)
        {
            groupItem.selectedItemIndex = groupItem.getTotalCount() - 1;
        }

        const item = groupItem.getAt(groupItem.selectedItemIndex);

        if(item === null) return false;

        if(item.isRented && item.flatId > -1) return false;

        if(([FurnitureCategory.WALL_PAPER, FurnitureCategory.FLOOR, FurnitureCategory.LANDSCAPE] as number[]).includes(item.category))
        {
            if(refuseRoomProperties) return false;

            this._communication.connection?.send(new RequestRoomPropertySetComposer(item.id));
        }
        else
        {
            this.requestSelectedFurniToMover(item);
        }

        this._view.updateActionView();

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::requestSelectedFurniToMover()
    private requestSelectedFurniToMover(item: FurnitureItem): void
    {
        const category = item.isWallItem ? RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL : RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE;

        // AS3 places posters and external-image items with the stuff-data legacy string
        // as the "extra" argument and no stuff-data object; everything else passes the
        // item's own extra and its stuff data. The old body always took the second path,
        // so a poster went to the mover with the wrong placement payload.
        let success: boolean;

        // AS3 passes `true` as the last argument on BOTH calls — repeated placement. Without it the
        // engine re-arms the next item of a stack but never builds its ghost, so placing stopped
        // after one item unless you jiggled the mouse. AS3 also passes the stuff data's own state
        // in the second call, where the port was letting it default to -1.
        if(item.category === FurnitureCategory.POSTER || this.isExternalImageItem(item))
        {
            success = this._roomEngine.initializeRoomObjectInsert(
                'inventory', item.id, category, item.type, item.stuffData?.getLegacyString() ?? '',
                null, -1, -1, null, true
            );
        }
        else
        {
            success = this._roomEngine.initializeRoomObjectInsert(
                'inventory', item.id, category, item.type, item.extra.toString(),
                item.stuffData, item.stuffData?.state ?? -1, -1, null, true
            );
        }

        if(success)
        {
            this._pendingPlacementRef = item.ref;
            this._isPlacing = true;

            // The inventory stays open while the recycler is running: the player is loading the
            // machine, not furnishing a room, and closing the grid under them would end the run.
            if(!this._habboInventory.recyclerModel?.running)
            {
                this._habboInventory.closeView();
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::isExternalImageItem()
    private isExternalImageItem(item: FurnitureItem): boolean
    {
        const furniData = this._habboInventory.getFurnitureData(item.type, 'i');

        return furniData !== null && furniData.isExternalImageType;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::onObjectPlaced()
    onObjectPlaced = (event: RoomEngineObjectPlacedEvent): void =>
    {
        if(!this._isPlacing || event.type !== RoomEngineObjectEvent.REOE_PLACED) return;

        this._isPlacing = false;

        if(!event.placedInRoom)
        {
            this._habboInventory.showView();
            this.cancelFurniInMover();
        }
        else if(this._currentCategory === 'rentables')
        {
            this._habboInventory.showView();
        }
        else if((event.placedOnFloor && -event.objectId === this._pendingPlacementRef) || (event.placedOnWall && event.objectId === this._pendingPlacementRef))
        {
            this.attemptPlaceNextFurni();
        }
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::attemptPlaceNextFurni()
    private attemptPlaceNextFurni(): void
    {
        const groupItem = this.getSelectedItem();

        if(groupItem === null) return;

        let nextIndex = -1;

        if(groupItem.category === FurnitureCategory.POST_IT)
        {
            if(groupItem.getTotalCount() > 1) nextIndex = 0;
        }
        else
        {
            for(let i = groupItem.selectedItemIndex - 1; i >= 0; i--)
            {
                const item = groupItem.getAt(i);

                if(item && !item.locked)
                {
                    nextIndex = i;
                    break;
                }
            }
        }

        let stop = true;

        if(nextIndex !== -1)
        {
            groupItem.selectedItemIndex = nextIndex;
            stop = !this.requestSelectedFurniPlacement(false);
        }

        if(stop)
        {
            groupItem.selectedItemIndex = -1;
            this.cancelFurniInMover();
            this._habboInventory.showView();
        }
    }

    /**
     * What the grid's main button does, which depends entirely on what is open elsewhere: load the
     * recycler if the machine is running, add to the offer if a trade is open, otherwise place the
     * item in the room.
     *
     * The recycler test comes first in AS3 and is kept first here — the two can be open at once,
     * and the machine wins.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::requestCurrentActionOnSelection()
    requestCurrentActionOnSelection(): void
    {
        if(this._habboInventory.recyclerModel?.running)
        {
            this._habboInventory.recycleSelectedFurni();
        }
        else if(this.isTradingOpen)
        {
            this.requestSelectedFurniToTrading();
        }
        else
        {
            this.requestSelectedFurniPlacement(false);
        }
    }

    /**
     * Turns the recycle badge on or off across every group, then repaints the action panel.
     *
     * The badge is per-group state rather than a model flag, which is why this walks the whole
     * grid: `GroupItem` only shows it when the group actually holds something recyclable.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::showRecyclable()
    showRecyclable(show: boolean): void
    {
        for(const groupItem of this._furniData)
        {
            groupItem.showRecyclable = show;
        }

        this._view.updateActionView();
    }

    /**
     * Hands one item from the selected stack to the recycler, locked.
     *
     * `getOneForRecycle()` does the locking itself, so there is no separate `addLockTo()` here —
     * the item comes back already reserved.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::requestSelectedFurniToRecycler()
    requestSelectedFurniToRecycler(): FurnitureItem | null
    {
        const groupItem = this.getSelectedItem();

        if(groupItem == null) return null;

        const item = groupItem.getOneForRecycle();

        if(item == null) return null;

        this._view.updateActionView();

        return item;
    }

    // AS3: .../src/com/sulake/habbo/inventory/furni/FurniModel.as::_disposed
    private _disposed: boolean = false;

    // AS3: .../src/com/sulake/habbo/inventory/furni/FurniModel.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    private _isListInitialized: boolean = false;

    get isListInitialized(): boolean
    {
        return this._isListInitialized;
    }

    private _furniData: GroupItem[] = [];
    private _furniDataSet: Set<GroupItem> = new Set();

    // AS3: .../src/com/sulake/habbo/inventory/furni/FurniModel.as::get furniData()
    get furniData(): GroupItem[]
    {
        return this._furniData;
    }

    private _showingRentedFurni: boolean = false;

    // AS3: .../src/com/sulake/habbo/inventory/furni/FurniModel.as::get showingRentedFurni()
    get showingRentedFurni(): boolean
    {
        return this._showingRentedFurni;
    }

    // AS3: .../src/com/sulake/habbo/inventory/furni/FurniModel.as::dispose()
    dispose(): void
    {
        if(this._disposed) return;

        this._roomEngine.events.off(RoomEngineObjectEvent.REOE_PLACED, this.onObjectPlaced);

        if(this._imageUpdateTimer !== null)
        {
            clearInterval(this._imageUpdateTimer);
            this._imageUpdateTimer = null;
        }

        for(const group of this._furniData)
        {
            group.dispose();
        }

        this._furniData.length = 0;
        this._furniDataSet.clear();
        this._categorySelections.clear();
        this._view.dispose();
        this._disposed = true;
    }

    // AS3: .../src/com/sulake/habbo/inventory/furni/FurniModel.as::insertFurniture()
    insertFurniture(items: Map<number, IFurnitureItemData>): {
        addedCount: number;
        removedCount: number;
        isFirstLoad: boolean;
    }
    {
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::insertFurniture()
        // Claim the category up-front; this returns true exactly once. Without it
        // _initializedCategories stays empty, so checkCategoryInitilization() never sees the furni
        // list as loaded and re-requests the whole inventory on every tab switch.
        const categoryWasInitialized = this._habboInventory.setInventoryCategoryInit('furni');

        const existingIds = this.getAllStripIds();
        const newIds = new Set(items.keys());
        const isFirstLoad = existingIds.size === 0;

        // Find IDs to add and remove
        const idsToAdd: number[] = [];
        const idsToRemove: number[] = [];

        for(const id of newIds)
        {
            if(!existingIds.has(id))
            {
                idsToAdd.push(id);
            }
        }

        for(const id of existingIds)
        {
            if(!newIds.has(id))
            {
                idsToRemove.push(id);
            }
        }

        // Remove items no longer in list
        for(const id of idsToRemove)
        {
            this.removeFurni(id);
        }

        // Add new items
        for(const id of idsToAdd)
        {
            const data = items.get(id);

            if(data)
            {
                const item = new FurnitureItem(data);

                this.addOrUpdateItem(item, true);
            }
        }

        this._isListInitialized = true;
        this._view.addItems(this._furniData);

        // Select first item if needed
        if(isFirstLoad || this.getSelectedItem() === null)
        {
            this.selectFirstItem();
        }

        this._view.setViewToState();

        // Starts the paced loader. Every group built above was created with `isInitializing`, so
        // none of them requested its own icon — this is what makes them arrive, one per 50 ms.
        this.initListImages();

        // AS3 dispatches this at the tail of insertFurniture(), only on the pass that actually
        // claimed the category. Its only AS3 consumer is CollectiblesController, which is not
        // ported — the event is raised anyway so the chain is complete rather than silently absent.
        if(categoryWasInitialized)
        {
            this._habboInventory.events.emit(
                HabboInventoryCategoryInitializeEvent.HABBO_INVENTORY_CATEGORY_INITIALIZED,
                new HabboInventoryCategoryInitializeEvent('furni')
            );
        }

        return {
            addedCount: idsToAdd.length,
            removedCount: idsToRemove.length,
            isFirstLoad,
        };
    }

    // AS3: .../src/com/sulake/habbo/inventory/furni/FurniModel.as::addOrUpdateItem()
    addOrUpdateItem(item: FurnitureItem, isInitializing: boolean): {
        groupItem: GroupItem;
        isNewGroup: boolean;
    }
    {
        let result: { groupItem: GroupItem; isNewGroup: boolean };

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::addOrUpdateItem()
        // Non-groupable items get their own group, except monsterplant seeds and the two chest
        // categories — AS3 sends those down the groupable path even when not groupable, because
        // addOrUpdateGroupableItem() has a chest-specific matching rule.
        if(!item.groupable
            && item.category !== FurnitureCategory.MONSTERPLANT_SEED
            && item.category !== FurnitureCategory.FURNI_CHEST
            && item.category !== FurnitureCategory.COINS_CHEST)
        {
            result = this.addOrUpdateNonGroupableItem(item, isInitializing);
        }
        else
        {
            result = this.addOrUpdateGroupableItem(item, isInitializing);
        }

        // Mark as unseen if not initializing
        if(!isInitializing)
        {
            result.groupItem.hasUnseenItems = true;
        }

        if(result.groupItem.isSelected)
        {
            this._view.updateActionView();
        }

        this._catalog.itemAddedToInventory(item.type, item.id, item.category);
        this._catalog.collectorHub?.itemAddedToInventory(item.type, item.id, item.isWallItem);

        return result;
    }

    // AS3: .../src/com/sulake/habbo/inventory/furni/FurniModel.as::removeFurni()
    removeFurni(itemId: number): GroupItem | null
    {
        for(let i = 0; i < this._furniData.length; i++)
        {
            const groupItem = this._furniData[i];
            const removedItem = groupItem.remove(itemId);

            if(removedItem)
            {
                // If group is empty, remove it
                if(groupItem.getTotalCount() <= 0)
                {
                    this._furniDataSet.delete(groupItem);
                    this._furniData.splice(i, 1);

                    // AS3: `if(_view && _view.grid) _view.grid.itemWasUpdated(groupItem)`. Dropping
                    // the group from the model does not touch the grid window — without this the
                    // last copy of a placed item left its cell behind, empty, and the rest of the
                    // page never reflowed around it.
                    this._view?.grid?.itemWasUpdated(groupItem);

                    // If this was selected, select first item
                    if(groupItem.isSelected)
                    {
                        this.selectFirstItem();
                    }

                    groupItem.dispose();
                }
                else
                {
                    this._view.updateActionView();
                }

                this._view.setViewToState();

                this._catalog.collectorHub?.itemRemovedFromInventory(
                    removedItem.type, removedItem.id, removedItem.isWallItem);

                return groupItem;
            }
        }

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::removeFurnis()
    removeFurnis(itemIds: number[]): boolean
    {
        let removedAny = false;

        for(const itemId of itemIds)
        {
            if(this.removeFurni(itemId) !== null)
            {
                removedAny = true;
            }
        }

        return removedAny;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::clearFurniList()
    clearFurniList(): void
    {
        for(const group of this._furniData)
        {
            group.dispose();
        }

        this._furniData.length = 0;
        this._furniDataSet.clear();
        this._isListInitialized = false;
        this._view.clearViews();
    }

    // AS3: .../src/com/sulake/habbo/inventory/furni/FurniModel.as::getSelectedItem()
    getSelectedItem(): GroupItem | null
    {
        for(const groupItem of this._furniData)
        {
            if(groupItem.isSelected)
            {
                return groupItem;
            }
        }

        return null;
    }

    // AS3: .../src/com/sulake/habbo/inventory/furni/FurniModel.as::removeSelections()
    removeSelections(): void
    {
        for(const groupItem of this._furniData)
        {
            groupItem.isSelected = false;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::selectFirstItem()
    // AS3 does not write _categorySelections here - only selectItem() (the user-driven path)
    // does. Writing it here too meant the per-category saved selection was never null again once
    // a category had been opened once, so updateCategorySelection() could never fall back to
    // selectFirstItem() a second time.
    selectFirstItem(): GroupItem | null
    {
        this.removeSelections();

        // Find first item matching current category filter
        for(const groupItem of this._furniData)
        {
            if(this._showingRentedFurni === groupItem.isRented)
            {
                groupItem.isSelected = true;
                groupItem.selectedItemIndex = -1;

                // AS3 selectFirstItem() ends with updateActionView(), which renders the selected
                // item into the preview panel. The port omitted it, so on the data-load open path
                // (selectFirstItem() + setViewToState(), and setViewToState() does NOT render the
                // preview) the inventory opened with the first item selected in the model but a
                // blank preview — no item shown.
                this._view.updateActionView();

                return groupItem;
            }
        }

        return null;
    }

    selectItem(groupItem: GroupItem): void
    {
        this.removeSelections();
        groupItem.isSelected = true;
        groupItem.selectedItemIndex = -1;
        this._categorySelections.set(this._currentCategory, groupItem);
    }

    // AS3: .../src/com/sulake/habbo/inventory/furni/FurniModel.as::getItemById()
    getItemById(itemId: number): GroupItem | null
    {
        for(const groupItem of this._furniData)
        {
            if(groupItem.getItem(itemId) !== null)
            {
                return groupItem;
            }
        }

        return null;
    }

    // AS3: .../src/com/sulake/habbo/inventory/furni/FurniModel.as::getItemWithStripId()
    getItemWithStripId(stripId: number): GroupItem | null
    {
        return this.getItemById(stripId);
    }

    // AS3: .../src/com/sulake/habbo/inventory/furni/FurniModel.as::getGroupItemByItemTypeId()
    getGroupItemByItemTypeId(typeId: number, isWallItem: boolean): GroupItem | null
    {
        for(const groupItem of this._furniData)
        {
            if(groupItem.type === typeId && groupItem.isWallItem === isWallItem)
            {
                return groupItem;
            }
        }

        return null;
    }

    /**
     * Takes no argument: it asks each model that can hold your furniture hostage which items it is
     * holding, and all three sources are live now — an item offered in a trade, loaded into the
     * recycler, or put up on the marketplace shows as locked in the grid, and unlocks when that
     * changes.
     *
     * Note the early return: with nothing locked AS3 clears the locks and stops — it does *not*
     * refresh the action view, where the port used to refresh it on both paths.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::updateItemLocks()
    updateItemLocks(): void
    {
        const lockedRefIds: number[] = [
            ...(this._habboInventory.activeTradingModel?.getOwnItemIdsInTrade() ?? []),
            ...(this._habboInventory.recyclerModel?.getOwnItemsInRecycler() ?? []),
            ...(this._habboInventory.marketplaceModel?.getOfferItemRefs() ?? []),
        ];

        if(lockedRefIds.length === 0)
        {
            this.removeAllLocks();

            return;
        }

        for(const groupItem of this._furniData)
        {
            groupItem.updateLocks(lockedRefIds);
        }

        this._view.updateActionView();
    }

    /**
     * Both of these are thin: the group does the locking, the model exists only to repaint the
     * action panel afterwards — which is what greys the Sell/Trade buttons while a stack is
     * reserved.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::lockAllSellable()
    lockAllSellable(groupItem: GroupItem): FurnitureItem[]
    {
        const locked = groupItem.lockAllSellable();

        this._view.updateActionView();

        return locked;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::removeLocksFor()
    removeLocksFor(groupItem: GroupItem, itemIds: Set<number>): void
    {
        groupItem.removeLocks(itemIds);

        this._view.updateActionView();
    }

    // AS3: sources/win63_version/habbo/inventory/furni/FurniModel.as::addLockTo()
    addLockTo(itemId: number): void
    {
        for(const groupItem of this._furniData)
        {
            if(groupItem.addLockTo(itemId))
            {
                return;
            }
        }
    }

    // AS3: .../src/com/sulake/habbo/inventory/furni/FurniModel.as::removeLockFrom()
    removeLockFrom(itemId: number): void
    {
        for(const groupItem of this._furniData)
        {
            if(groupItem.removeLockFrom(itemId))
            {
                return;
            }
        }
    }

    // AS3: .../src/com/sulake/habbo/inventory/furni/FurniModel.as::removeAllLocks()
    removeAllLocks(): void
    {
        for(const groupItem of this._furniData)
        {
            groupItem.removeAllLocks();
        }
    }

    // AS3: .../src/com/sulake/habbo/inventory/furni/FurniModel.as::categorySwitch()
    categorySwitch(category: 'furni' | 'rentables'): void
    {
        if(!this._habboInventory.isVisible) return;

        this._currentCategory = category;
        this._showingRentedFurni = category === 'rentables';
        this._view.resetFilters(category);
        this.updateCategorySelection();
        this.updateItemLocks();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::getWindowContainer()
    getWindowContainer(): IWindowContainer | null
    {
        return this._view.getWindowContainer();
    }

    /**
     * Two requests, one meaning. AS3 branches on {@link _isInRoom}: 41 in a room, 3862 outside one.
     * The port used to send 41 unconditionally, because nothing tracked the flag.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::requestInitialization()
    requestInitialization(): void
    {
        if(this._isInRoom)
        {
            this._habboInventory.requestFurni();

            return;
        }

        this._communication.connection?.send(new RequestFurniInventoryWhenNotInRoomComposer());
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::subCategorySwitch()
    /**
	 * **NFTs are hidden for the duration of a trade and come back when it ends.** They cannot be
	 * traded through the normal window, so opening one flips `_showingNfts` off and re-filters the
	 * grid; going back to `empty` — no sub-view, i.e. the trade closed — flips it back. Both are
	 * gated on `web3tradeEnabled`, so a hotel without the feature never hides anything.
	 *
	 * Only the wired branch resets the filter option: a plain trade shows the same inventory the
	 * player was just browsing, while a wired contract is about specific items a leftover filter
	 * may be hiding.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::subCategorySwitch()
    subCategorySwitch(category: string): void
    {
        switch(category)
        {
            case 'wired_trading':
                this.cancelFurniInMover();
                this._view.resetFilterOption();
                this._view.updateActionView();
                break;
            case 'trading':
                this.cancelFurniInMover();

                if(this._showingNfts && this.controller.web3tradeEnabled)
                {
                    this._showingNfts = false;
                    this._view.updateGridFilters();
                }

                this._view.updateActionView();
                break;
            case 'empty':
                this.removeAllLocks();

                if(!this._showingNfts && this.controller.web3tradeEnabled)
                {
                    this._showingNfts = true;
                    this._view.updateGridFilters();
                }

                this._view.updateActionView();
                break;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::closingInventoryView()
    closingInventoryView(): void
    {
        if(this._view.isVisible)
        {
            this.resetUnseenItems();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::updateView()
    updateView(): void
    {
        this._view.updateActionView();
        this._view.updateGridFilters();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::setViewToState()
    setViewToState(): void
    {
        this._view.setViewToState();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::selectItemById()
    selectItemById(itemId: string): void
    {
        const groupItem = this.getItemById(-parseInt(itemId, 10));

        if(groupItem !== null)
        {
            this.selectItem(groupItem);
        }
    }

    /**
     * Clears the "new" mark on one item, and the tab badge with it when nothing is left unseen.
     *
     * Called when an item leaves the inventory into the room — placing it *is* seeing it. The
     * category is the same rentables/normal split `resetUnseenItems()` makes, because the tracker
     * counts the two tabs separately.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::removeUnseenFurniCounter()
    removeUnseenFurniCounter(itemId: number): boolean
    {
        const tracker = this._habboInventory.unseenItemTracker;

        if(tracker === null) return false;
        if(this.getItemById(itemId) === null) return false;

        const category = this._currentCategory === 'rentables' ? 2 : 1;

        if(!tracker.isUnseen(category, itemId)) return false;

        const removed = tracker.removeUnseen(category, itemId);

        if(removed) tracker.resetCategoryIfEmpty(category);

        return removed;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::resetUnseenItems()
    resetUnseenItems(): number[]
    {
        const resetIds: number[] = [];

        // AS3 resets the tracker category first — rentables → 2, otherwise → 1 — which
        // sends the server reset and clears the count, then updateUnseenItemCounts()
        // redraws the tab badges. The old body only cleared the per-group highlight
        // flags and returned ids no caller consumed, so the badge never cleared after a
        // category was viewed.
        const category = this._showingRentedFurni ? 2 : 1;

        this._habboInventory.unseenItemTracker.resetCategory(category);

        for(const groupItem of this._furniData)
        {
            if(groupItem.hasUnseenItems && groupItem.isRented === this._showingRentedFurni)
            {
                groupItem.hasUnseenItems = false;
                resetIds.push(...groupItem.getFurniIds());
            }
        }

        this._habboInventory.updateUnseenItemCounts();

        return resetIds;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::updateUnseenItemsThumbs()
    // AS3's `param2:Boolean = true` (refresh) gates the trailing
    // `_view.grid.itemsWereUpdated(changedGroups)` call — true from UnseenItemTracker's own
    // refresh, false from onFurnitureAddOrUpdate() (HabboInventory.ts's onFurniListAddOrUpdate),
    // which calls setViewToState()/updateView() itself right after.
    updateUnseenItemsThumbs(unseenIds: number[], refresh: boolean = true): void
    {
        if(unseenIds.length === 0) return;

        const unseenSet = new Set(unseenIds);
        const tracker = this._habboInventory.unseenItemTracker;
        const changedGroups: GroupItem[] = [];

        for(const groupItem of this._furniData)
        {
            const furniIds = groupItem.getFurniIds();
            const movedOwned: number[] = [];
            const movedRented: number[] = [];
            let hasUnseen = false;
            let needsMove = false;

            for(const id of furniIds)
            {
                if(unseenSet.has(id))
                {
                    hasUnseen = true;

                    if(!tracker.isUnseenItemMovedToTop(UnseenItemCategory.OWNED_FURNI, id))
                    {
                        needsMove = true;
                        movedOwned.push(id);
                    }

                    if(!tracker.isUnseenItemMovedToTop(UnseenItemCategory.RENTED_FURNI, id))
                    {
                        needsMove = true;
                        movedRented.push(id);
                    }

                    break;
                }
            }

            // AS3: `if(!(!hasUnseen || groupItem.hasUnseenItems && !needsMove))` - skip a group that
            // has no unseen item at all, or one that's already flagged and has nothing new to move.
            if(!hasUnseen || (groupItem.hasUnseenItems && !needsMove)) continue;

            groupItem.hasUnseenItems = true;
            changedGroups.push(groupItem);

            if(needsMove)
            {
                this.moveItemToTop(groupItem);
                tracker.setUnseenItemMovedToTop(UnseenItemCategory.OWNED_FURNI, movedOwned);
                tracker.setUnseenItemMovedToTop(UnseenItemCategory.RENTED_FURNI, movedRented);
            }
        }

        // AS3: `if(_loc11_.length > 0 && param2) _SafeStr_4550.grid.itemsWereUpdated(_loc11_)`.
        if(changedGroups.length > 0 && refresh)
        {
            this._view.grid?.itemsWereUpdated(changedGroups);
        }
    }

    // AS3: .../src/com/sulake/habbo/inventory/furni/FurniModel.as::getAllStripIds()
    private getAllStripIds(): Set<number>
    {
        const ids = new Set<number>();

        for(const groupItem of this._furniData)
        {
            let count = groupItem.getTotalCount();

            // POST_IT items count differently
            if(groupItem.category === FurnitureCategory.POST_IT)
            {
                count = 1;
            }

            for(let i = 0; i < count; i++)
            {
                const item = groupItem.getAt(i);

                if(item)
                {
                    ids.add(item.id);
                }
            }
        }

        return ids;
    }

    // AS3: .../src/com/sulake/habbo/inventory/furni/FurniModel.as::addOrUpdateNonGroupableItem()
    private addOrUpdateNonGroupableItem(item: FurnitureItem, isInitializing: boolean): {
        groupItem: GroupItem;
        isNewGroup: boolean;
    }
    {
        // Find existing groups with same type
        const matchingGroups: GroupItem[] = [];

        for(const groupItem of this._furniData)
        {
            if(groupItem.type === item.type)
            {
                matchingGroups.push(groupItem);
            }
        }

        // Check if item already exists in any matching group
        for(const groupItem of matchingGroups)
        {
            if(groupItem.getItem(item.id) !== null)
            {
                return {groupItem, isNewGroup: false};
            }
        }

        // Create new group for this non-groupable item
        const isUnseen = !isInitializing;
        const groupItem = this.createGroupItem(item.type, item.category, item.stuffData, item.extra, isInitializing);

        groupItem.push(item, isUnseen);

        if(isUnseen)
        {
            groupItem.hasUnseenItems = true;
            this.addItemToTop(groupItem);
        }
        else
        {
            this.addItemToBottom(groupItem);
        }

        return {groupItem, isNewGroup: true};
    }

    // AS3: .../src/com/sulake/habbo/inventory/furni/FurniModel.as::addOrUpdateGroupableItem()
    private addOrUpdateGroupableItem(item: FurnitureItem, isInitializing: boolean): {
        groupItem: GroupItem;
        isNewGroup: boolean;
    }
    {
        const isUnseen = !isInitializing;
        let existingGroup: GroupItem | null = null;

        // Find matching group
        for(const groupItem of this._furniData)
        {
            if(groupItem.type === item.type && groupItem.isWallItem === item.isWallItem)
            {
                // MONSTERPLANT_SEED - match by rarity level
                if(item.category === FurnitureCategory.MONSTERPLANT_SEED)
                {
                    if(groupItem.stuffData?.rarityLevel === item.stuffData?.rarityLevel)
                    {
                        existingGroup = groupItem;

                        break;
                    }
                }
                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::addOrUpdateGroupableItem()
                // Chests only stack while both are empty and unnamed; anything else keeps its own
                // group. Without this branch they fell through to the match-by-type default and
                // every chest of a type collapsed into one pile regardless of contents or name.
                // AS3 deliberately does not break here — the last matching chest wins.
                else if(item.category === FurnitureCategory.FURNI_CHEST
                    || item.category === FurnitureCategory.COINS_CHEST)
                {
                    if(groupItem.stuffData?.contentsCount === 0
                        && item.stuffData?.contentsCount === 0
                        && groupItem.stuffData?.chestName === ''
                        && item.stuffData?.chestName === '')
                    {
                        existingGroup = groupItem;
                    }
                }
                // Must be groupable
                else if(groupItem.isGroupable)
                {
                    // POSTER - match by legacy string (color)
                    if(item.category === FurnitureCategory.POSTER)
                    {
                        if(groupItem.stuffData?.getLegacyString() === item.stuffData?.getLegacyString())
                        {
                            existingGroup = groupItem;

                            break;
                        }
                    }
                    // GUILD_FURNI - match by stuffData compare
                    else if(item.category === FurnitureCategory.GUILD_FURNI)
                    {
                        if(groupItem.stuffData && item.stuffData?.compare(groupItem.stuffData))
                        {
                            existingGroup = groupItem;

                            break;
                        }
                    }
                    // Default - just match by type
                    else
                    {
                        existingGroup = groupItem;

                        break;
                    }
                }
            }
        }

        // Add to existing group
        if(existingGroup)
        {
            existingGroup.push(item, isUnseen);

            if(isUnseen)
            {
                existingGroup.hasUnseenItems = true;
                this.moveItemToTop(existingGroup);
            }

            return {groupItem: existingGroup, isNewGroup: false};
        }

        // Create new group
        const groupItem = this.createGroupItem(item.type, item.category, item.stuffData, item.extra, isInitializing);

        groupItem.push(item, isUnseen);

        if(isUnseen)
        {
            groupItem.hasUnseenItems = true;
            this.addItemToTop(groupItem);
        }
        else
        {
            this.addItemToBottom(groupItem);
        }

        return {groupItem, isNewGroup: true};
    }

    /**
     * The "and N credits" tile that heads a trade offer.
     *
     * It is a `GroupItem` only in shape: it holds no furniture, and carries its own tooltip text
     * and icon instead of resolving them from furni data. AS3 reads the library off the window
     * manager (`_windowManager.assets`) and also passes the room engine; this port's window
     * manager exposes no library and `CreditTradingItem` never renders a room object, so the
     * inventory's own library is used and the engine is not passed.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::createCreditGroupItem()
    createCreditGroupItem(creditValue: number): GroupItem
    {
        return new CreditTradingItem(this, this._habboInventory.assets, creditValue);
    }

    /**
	 * The furniture types whose preview sits on the tile rather than centred in its cell.
	 *
	 * DEVIATION: AS3 reads `catalog.preview.alignment.bottom` once in the constructor. Here the
	 *   configuration is not loaded yet at that point and `getProperty()` answers `''` rather
	 *   than throwing, which would freeze an empty list in for the session — so it is read on
	 *   first use and cached from the first non-empty answer.
	 */
    // Name DERIVED: the AS3 field is `_SafeStr_9587`, obfuscated in every tree. Named after the
    // configuration key it is filled from — `catalog.preview.alignment.bottom` (FurniModel.as:111).
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::FurniModel()
    private _bottomAlignedTypes: string[] | null = null;

    // TS-only: the lazy half of the deviation documented on `_bottomAlignedTypes`.
    private getBottomAlignedTypes(): string[]
    {
        if(this._bottomAlignedTypes !== null) return this._bottomAlignedTypes;

        const property = this._habboInventory.getProperty('catalog.preview.alignment.bottom');

        if(property === '') return [];

        this._bottomAlignedTypes = property.split(',');

        return this._bottomAlignedTypes;
    }

    /**
	 * Builds one inventory group — the tile that stands for every copy of a furni type.
	 *
	 * Wallpaper, floor and landscape get a fixed icon instead of a rendered preview, because
	 * there is no room object to render: they are room materials, not furniture.
	 *
	 * DEVIATION: AS3 clones the icon's BitmapData, which Flash needs because the bitmap is
	 *   mutable and its consumer disposes it. `GroupItem` here only ever hands the image to
	 *   `setFinalImage()` and never closes it, so the library's own `ImageBitmap` is shared.
	 *
	 * `isInitializing` is AS3's fifth argument, and it is the gate on the icon request: it becomes
	 * `GroupItem`'s `isNoAutoRequestImage`, so a group built during the initial bulk load does not
	 * render its own icon. `initListImages()` does it instead, one per 50 ms tick, over the current
	 * page only. Dropping the argument — as this used to — made a full inventory fire every icon
	 * render at once.
	 *
	 * AS3 declares this public — the inventory's trading handler calls it to build the group
	 * items for both sides' offers (`_SafeCls_1951.populateItemGroups()`).
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::createGroupItem()
    createGroupItem(
        type: number,
        category: number,
        stuffData: IStuffData | null,
        extra: number,
        isInitializing: boolean = false
    ): GroupItem
    {
        let iconName: string | null = null;

        switch(category)
        {
            case FurnitureCategory.WALL_PAPER:
                iconName = 'inventory_furni_icon_wallpaper';
                break;
            case FurnitureCategory.FLOOR:
                iconName = 'inventory_furni_icon_floor';
                break;
            case FurnitureCategory.LANDSCAPE:
                iconName = 'inventory_furni_icon_landscape';
                break;
        }

        let icon: ImageBitmap | null = null;

        if(iconName !== null)
        {
            icon = (this._habboInventory.assets?.getAssetByName(iconName)?.content as ImageBitmap | null) ?? null;
        }

        const furnitureType = this._roomEngine.getFurnitureType(type);
        const alignment = (furnitureType !== null && this.getBottomAlignedTypes().indexOf(furnitureType) > -1)
            ? 'bottom'
            : 'center';

        // A group built while the machine is running starts with its recycle badge already on;
        // otherwise items added mid-run would be the only ones in the grid without one.
        return new GroupItem(
            this, type, category, stuffData, extra, icon, isInitializing, alignment,
            this._habboInventory.recyclerModel?.running ?? false
        );
    }

    /**
     * Renders **one** not-yet-rendered icon on the grid's current page, and starts the pacing
     * timer if it is not already running.
     *
     * The `break` is the whole point: AS3 inits a single image per call and lets
     * `onImageUpdateTimerEvent()` come back 50 ms later for the next. Rendering an avatar or a
     * furni preview is not cheap, and a full inventory is hundreds of them — done in one pass they
     * land in a single frame and the client visibly stalls. Only the *current page* is walked, so
     * an inventory the player never scrolls costs one page's worth of renders and no more.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::initListImages()
    private initListImages(): void
    {
        if(this._imageUpdateTimer === null)
        {
            this._imageUpdateTimer = setInterval(this.onImageUpdateTimerEvent, FurniModel.IMAGE_UPDATE_INTERVAL_MS);
        }

        const items = this._view.currentPageItems;

        if(items === null) return;

        for(const item of items)
        {
            if(item.isImageInited) continue;

            // `initImage(false)` returns true when it actually started a render; a group whose
            // icon was already resolved returns false and the loop moves on to the next one.
            if(item.initImage(false)) break;
        }
    }

    /**
     * The 50 ms tick: one icon, and every fourth tick a sweep for rentals that have run out.
     *
     * AS3 counts the ticks in `_imageUpdateCumulativeTime` rather than running a second timer, and
     * 200 ms is how often an expiry can go unnoticed at worst.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::onImageUpdateTimerEvent()
    private onImageUpdateTimerEvent = (): void =>
    {
        if(this._disposed) return;

        this.initListImages();

        this._imageUpdateCumulativeTime += FurniModel.IMAGE_UPDATE_INTERVAL_MS;

        if(this._imageUpdateCumulativeTime < FurniModel.RENT_SWEEP_INTERVAL_MS) return;

        const expired: number[] = [];

        for(const group of this._furniData)
        {
            const item = group.getAt(0);

            if(item && item.isRented && item.hasRentPeriodStarted && item.secondsToExpiration <= 0)
            {
                expired.push(item.id);
            }
        }

        for(const id of expired) this.removeFurni(id);

        if(expired.length > 0) this._view.updateGridFilters();

        this._view.updateRentedItem();
        this._imageUpdateCumulativeTime = 0;
    };

    // AS3: .../src/com/sulake/habbo/inventory/furni/FurniModel.as::addItemToTop()
    private addItemToTop(groupItem: GroupItem): void
    {
        this._furniDataSet.add(groupItem);
        this._furniData.unshift(groupItem);
    }

    // AS3: .../src/com/sulake/habbo/inventory/furni/FurniModel.as::addItemToBottom()
    private addItemToBottom(groupItem: GroupItem): void
    {
        this._furniDataSet.add(groupItem);
        this._furniData.push(groupItem);
    }

    /**
     * Rewrites a post-it stack's remaining-sheet count.
     *
     * The count lives *inside* the item's stuff data as a string, not as a field of its own, which
     * is why this has to reach through `stuffData` and put the object back rather than setting a
     * property. AS3 scans every group because a single item id can only be in one of them and it
     * does not know which.
     */
    // AS3: .../src/com/sulake/habbo/inventory/furni/FurniModel.as::updatePostItCount()
    updatePostItCount(itemId: number, itemsLeft: number): void
    {
        for(const groupItem of this._furniData)
        {
            const item = groupItem.getItem(itemId);

            if(item == null) continue;

            const stuffData = item.stuffData as LegacyStuffData | null;

            if(stuffData == null) continue;

            stuffData.setString(String(itemsLeft));
            item.stuffData = stuffData;

            groupItem.replaceItem(itemId, item);
        }
    }

    // AS3: .../src/com/sulake/habbo/inventory/furni/FurniModel.as::removeItem()
    private removeItem(groupItem: GroupItem): void
    {
        if(this._furniDataSet.delete(groupItem))
        {
            const index = this._furniData.indexOf(groupItem);

            if(index > -1)
            {
                this._furniData.splice(index, 1);
            }
        }
    }

    // AS3: .../src/com/sulake/habbo/inventory/furni/FurniModel.as::moveItemToTop()
    private moveItemToTop(groupItem: GroupItem): void
    {
        this.removeItem(groupItem);
        this.addItemToTop(groupItem);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::updateCategorySelection()
    private updateCategorySelection(): void
    {
        this.removeSelections();

        const savedSelection = this._categorySelections.get(this._currentCategory);

        if(savedSelection && this._furniDataSet.has(savedSelection))
        {
            savedSelection.isSelected = true;
            savedSelection.selectedItemIndex = -1;
        }
        else
        {
            this.selectFirstItem();
        }

        // AS3 always renders the action view here (both branches), so re-opening the furni tab shows
        // the selected item's preview immediately. The port selected the item but never re-rendered,
        // so opening the inventory left the preview blank until you clicked a thumbnail.
        this._view.updateActionView();
    }
}
