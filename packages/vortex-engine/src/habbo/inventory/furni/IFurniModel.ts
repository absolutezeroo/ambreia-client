import type {GroupItem} from '../items/GroupItem';
import type {FurnitureItem} from '../items/FurnitureItem';
import type {IFurnitureItemData} from '../items/FurnitureItemData';
import type {IWindowContainer} from '@core/window/IWindowContainer';

/**
 * Interface for FurniModel
 *
 * Based on AS3 com.sulake.habbo.inventory.furni.FurniModel (ENGINE only)
 * No events of its own: the ported `FurniView` window reads the model when a message updates it.
 */
export interface IFurniModel
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::get disposed()
    readonly disposed: boolean;
    readonly isListInitialized: boolean;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::get furniData()
    readonly furniData: GroupItem[];
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::get showingRentedFurni()
    readonly showingRentedFurni: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::dispose()
    dispose(): void;

    /**
	 * Insert furniture from server message (full list)
	 * Returns info about what changed for the store to update signals
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::insertFurniture()
    insertFurniture(items: Map<number, IFurnitureItemData>): {
        addedCount: number;
        removedCount: number;
        isFirstLoad: boolean;
    };

    /**
	 * Add or update a single item
	 * Returns the group item affected and if it's new
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::addOrUpdateItem()
    addOrUpdateItem(item: FurnitureItem, isInitializing: boolean): {
        groupItem: GroupItem;
        isNewGroup: boolean;
    };

    /**
	 * Remove a furniture item by ID
	 * Returns the affected group item if found
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::removeFurni()
    removeFurni(itemId: number): GroupItem | null;

    /**
	 * Remove multiple furniture items by ID.
	 * Returns true if any item was actually removed.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::removeFurnis()
    removeFurnis(itemIds: number[]): boolean;

    /**
	 * Clear all furniture
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::clearFurniList()
    clearFurniList(): void;

    /**
	 * Get currently selected group item
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::getSelectedItem()
    getSelectedItem(): GroupItem | null;

    /**
	 * Remove all selections
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::removeSelections()
    removeSelections(): void;

    /**
	 * Select the first available item
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::selectFirstItem()
    selectFirstItem(): GroupItem | null;

    /**
	 * Select a specific group item
	 */
    selectItem(groupItem: GroupItem): void;

    /**
	 * Find group item containing a furniture with this ID
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::getItemById()
    getItemById(itemId: number): GroupItem | null;

    /**
	 * Alias for getItemById (AS3 compatibility)
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::getItemWithStripId()
    getItemWithStripId(stripId: number): GroupItem | null;

    /**
	 * Find group item by furniture type ID
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::getGroupItemByItemTypeId()
    getGroupItemByItemTypeId(typeId: number, isWallItem: boolean): GroupItem | null;

    /**
	 * Update item locks based on list of locked reference IDs
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::updateItemLocks()
    updateItemLocks(): void;

    /**
	 * Lock a specific item
	 */
    // AS3: sources/win63_version/habbo/inventory/furni/FurniModel.as::addLockTo()
    addLockTo(itemId: number): void;

    /**
	 * Unlock a specific item
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::removeLockFrom()
    removeLockFrom(itemId: number): void;

    /**
	 * Reserve every sellable copy in a group and hand them back — the marketplace locks the whole
	 * stack before opening its offer dialog.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::lockAllSellable()
    lockAllSellable(groupItem: GroupItem): FurnitureItem[];

    /**
	 * Give back a set of reserved items, matched by item **id** (not ref).
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::removeLocksFor()
    removeLocksFor(groupItem: GroupItem, itemIds: Set<number>): void;

    /**
	 * Remove all locks
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::removeAllLocks()
    removeAllLocks(): void;

    /**
	 * Turn the recycle badge on or off across the whole grid. Driven by `RecyclerModel`, which
	 * calls it on start and stop.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::showRecyclable()
    showRecyclable(show: boolean): void;

    /**
	 * Take one unlocked, recyclable copy out of the selected group. It comes back already locked.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::requestSelectedFurniToRecycler()
    requestSelectedFurniToRecycler(): FurnitureItem | null;

    /**
	 * Switch category (furni / rentables)
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::categorySwitch()
    categorySwitch(category: 'furni' | 'rentables'): void;

    /**
	 * Reset unseen flags for current category
	 * Returns IDs to send to server
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::resetUnseenItems()
    resetUnseenItems(): number[];

    /**
	 * Update unseen flags on items based on tracker
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::updateUnseenItemsThumbs()
    updateUnseenItemsThumbs(unseenIds: number[], refresh?: boolean): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::getWindowContainer()
    getWindowContainer(): IWindowContainer | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::requestInitialization()
    requestInitialization(): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::subCategorySwitch()
    subCategorySwitch(category: string): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::closingInventoryView()
    closingInventoryView(): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::updateView()
    updateView(): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::selectItemById()
    selectItemById(itemId: string): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::roomEntered()
    roomEntered(): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniModel.as::roomLeft()
    roomLeft(): void;
}
