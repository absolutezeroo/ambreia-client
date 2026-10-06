import type {EventEmitter} from 'eventemitter3';
import type {IFurniModel} from './furni/IFurniModel';
import type {IBadgesModel} from './badges/IBadgesModel';
import type {IEffectsModel} from './effects/IEffectsModel';
import type {Effect} from './effects/Effect';
import type {IPetsModel} from './pets/IPetsModel';
import type {IBotsModel} from './bots/IBotsModel';
import type {ITradingModel} from './trading/ITradingModel';
import type {IPurse} from './purse/IPurse';
import type {UnseenItemTracker} from './UnseenItemTracker';
import type {FurnitureItem} from './items/FurnitureItem';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IHabboCatalog} from '@habbo/catalog/IHabboCatalog';
import type {IFurnitureData} from '@habbo/session/furniture/IFurnitureData';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {InventoryMainView} from './InventoryMainView';
import type {IRoomSession} from '@habbo/session/IRoomSession';

/**
 * Inventory categories
 */
export const InventoryCategory = {
    FURNI: 'furni',
    RENTABLES: 'rentables',
    BADGES: 'badges',
    EFFECTS: 'effects',
    PETS: 'pets',
    BOTS: 'bots',
    TRADING: 'trading',
    MARKETPLACE: 'marketplace',
} as const;

export type InventoryCategoryType = typeof InventoryCategory[keyof typeof InventoryCategory];

/**
 * Interface for HabboInventory controller
 *
 * Based on AS3 com.sulake.habbo.inventory.HabboInventory (ENGINE only)
 */
export interface IHabboInventory
{
    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::get isInitialized()
    readonly isInitialized: boolean;
    readonly currentCategory: InventoryCategoryType | null;

    // Component event emitter — the me-menu EffectsWidget handler subscribes to
    // HIEE_EFFECTS_CHANGED here (AS3: container.inventory.events).
    // AS3: .../src/com/sulake/habbo/inventory/_SafeCls_588.as::get events()
    readonly events: EventEmitter;

    // Models
    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::get furniModel()
    readonly furniModel: IFurniModel;
    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::get badgesModel()
    readonly badgesModel: IBadgesModel;
    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::get effectsModel()
    readonly effectsModel: IEffectsModel | null;

    /**
	 * The effect the player last switched on, or -1.
	 *
	 * A one-line delegate to `effectsModel.lastActivatedEffect` in AS3 too — it exists so the
	 * avatar editor can restore the effect on close without reaching through the model.
	 */
    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::getLastActivatedEffect()
    getLastActivatedEffect(): number;
    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::get petsModel()
    readonly petsModel: IPetsModel;
    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::get botsModel()
    readonly botsModel: IBotsModel;
    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::get tradingModel()
    readonly tradingModel: ITradingModel;

    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::canUserOfferToTrade()
    canUserOfferToTrade(): boolean;

    // Purse & Tracking
    readonly purse: IPurse;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::get clubDays()
    readonly clubDays: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::get clubPeriods()
    readonly clubPeriods: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_588.as::get clubPastPeriods()
    readonly clubPastPeriods: number;
    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::get clubLevel()
    readonly clubLevel: number;
    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::get unseenItemTracker()
    readonly unseenItemTracker: UnseenItemTracker;

    // Room session state
    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::get hasRoomSession()
    hasRoomSession: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::get roomSession()
    readonly roomSession: IRoomSession | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::windowManager
    readonly windowManager: IHabboWindowManager | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::catalog
    readonly catalog: IHabboCatalog | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::view
    readonly view: InventoryMainView;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::get isVisible()
    readonly isVisible: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::get isMainViewActive()
    readonly isMainViewActive: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::get mergeRentFurni()
    readonly mergeRentFurni: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::get web3tradeEnabled()
    readonly web3tradeEnabled: boolean;

    // TS-only: exposed so InventoryMainView (a plain class, not a Component) can
    // read configuration without its own IContext.
    getBoolean(key: string): boolean;

    // TS-only: same rationale as getBoolean() above.
    getInteger(key: string, defaultValue: number): number;

    /**
	 * Initialize all models
	 */
    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::init()
    init(): void;

    /**
	 * Switch to a category
	 */
    switchCategory(category: InventoryCategoryType): void;

    /**
     * Every non-rented inventory id of one furni type. Declared on AS3's interface too
     * (`_SafeCls_588.as:80`); AS3's only caller is the mint tab, which the RPG fork removed.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::getNonRentedInventoryIds()
    getNonRentedInventoryIds(category: string, itemTypeId: number, isWallItem: boolean): number[] | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::getFurnitureData()
    getFurnitureData(classId: number, type: string): IFurnitureData | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::getSubCategoryViewId()
    getSubCategoryViewId(): string | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::closeView()
    closeView(): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_588.as::hasFigureSetIdInInventory()
    hasFigureSetIdInInventory(figureSetId: number): boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_588.as::hasBoundFigureSetFurniture()
    hasBoundFigureSetFurniture(className: string): boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::showView()
    showView(): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::preparingInventoryView()
    preparingInventoryView(): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::closingInventoryView()
    closingInventoryView(): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::inventoryViewOpened()
    inventoryViewOpened(category: string): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::toggleInventoryPage()
    toggleInventoryPage(category: string, itemId?: string | null, forceSwitch?: boolean): void;

    /**
     * Whether a trade is open. The catalog asks so it can refuse purchases mid-trade.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::get tradingActive()
    readonly tradingActive: boolean;

    /**
     * The three recycler entry points the catalog drives. AS3 keeps them on the inventory rather
     * than exposing `RecyclerModel` itself, so the catalog never sees the model.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::setupRecycler()
    setupRecycler(enabled: boolean): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::requestSelectedFurniToRecycler()
    requestSelectedFurniToRecycler(): number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::returnInventoryFurniFromRecycler()
    returnInventoryFurniFromRecycler(itemId: number): boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_588.as::getFloorItemById()
    getFloorItemById(itemId: number): FurnitureItem | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_588.as::getWallItemById()
    getWallItemById(itemId: number): FurnitureItem | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_588.as::requestSelectedFurniToMover()
    requestSelectedFurniToMover(item: FurnitureItem): boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_588.as::placePetToRoom()
    placePetToRoom(id: number, skipServer?: boolean): boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_588.as::removeUnseenFurniCounter()
    removeUnseenFurniCounter(itemId: number): boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_588.as::removeUnseenPetCounter()
    removeUnseenPetCounter(itemId: number): boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::toggleInventorySubPage()
    toggleInventorySubPage(category: string): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::updateSubView()
    updateSubView(): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::updateUnseenItemCounts()
    updateUnseenItemCounts(): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::getCategoryWindowContainer()
    getCategoryWindowContainer(category: string): IWindowContainer | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::getCategorySubWindowContainer()
    getCategorySubWindowContainer(category: string): IWindowContainer | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::updateView()
    updateView(category: string): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::isInventoryCategoryInit()
    isInventoryCategoryInit(category: string): boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::setInventoryCategoryInit()
    setInventoryCategoryInit(category: string, init?: boolean): boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::checkCategoryInitilization()
    checkCategoryInitilization(category: string): boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::requestInventoryCategoryInit()
    requestInventoryCategoryInit(category: string): void;

    /**
	 * Update club/subscription status
	 */
    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::setClubStatus()
    setClubStatus(
        periods: number,
        days: number,
        hasEverBeenMember: boolean,
        isVIP: boolean,
        isExpiring: boolean,
        citizenshipVipIsExpiring: boolean,
        minutesUntilExpiration: number,
        minutesSinceLastModified: number
    ): void;

    /**
	 * Request furniture inventory from server
	 */
    requestFurni(): void;

    /**
	 * Request badges from server
	 */
    requestBadges(): void;

    /**
	 * Request pets from server
	 */
    requestPets(): void;

    /**
	 * Request bots from server
	 */
    requestBots(): void;

    // AS3: HabboInventory.as::getAvatarEffects()
    getAvatarEffects(): Effect[];

    // AS3: HabboInventory.as::getActivatedAvatarEffects()
    getActivatedAvatarEffects(): Effect[];

    // AS3: HabboInventory.as::setEffectSelected()
    setEffectSelected(type: number): void;

    // AS3: HabboInventory.as::setEffectDeselected()
    setEffectDeselected(type: number): void;

    // AS3: HabboInventory.as::deselectAllEffects()
    deselectAllEffects(clearLastActivated?: boolean): void;

    // AS3: HabboInventory.as::getAvatarEffect()
    getAvatarEffect(type: number): Effect | null;

    // AS3: HabboInventory.as::notifyChangedEffects()
    notifyChangedEffects(): void;

    /**
	 * The three club facts a caller needs to word an upsell, and which are not interchangeable:
	 * whether membership has ever existed, whether it is running out, and how long is left.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_588.as::get clubHasEverBeenMember()
    readonly clubHasEverBeenMember: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_588.as::get clubIsExpiring()
    readonly clubIsExpiring: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_588.as::get clubMinutesUntilExpiration()
    readonly clubMinutesUntilExpiration: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_588.as::getAllMyBadgeIds()
    getAllMyBadgeIds(exclude: string[] | null): string[];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_588.as::setupTrading()
    setupTrading(userId: number): void;
}
