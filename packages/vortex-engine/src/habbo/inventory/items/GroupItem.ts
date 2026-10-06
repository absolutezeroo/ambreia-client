import type {IFurnitureItem} from './IFurnitureItem';
import type {IFurnitureData} from '@habbo/session/furniture/IFurnitureData';
import type {IStuffData} from '@habbo/room/object/data/IStuffData';
import type {FurniModel} from '../furni/FurniModel';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IWindow} from '@core/window/IWindow';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import type {IBitmapWrapperWindow} from '@core/window/components/IBitmapWrapperWindow';
import type {IStaticBitmapWrapperWindow} from '@core/window/components/IStaticBitmapWrapperWindow';
import type {ITextWindow} from '@core/window/components/ITextWindow';
import type {IWidgetWindow} from '@core/window/components/IWidgetWindow';
import type {ILimitedItemGridOverlayWidget} from '@habbo/window/widgets/ILimitedItemGridOverlayWidget';
import type {IRarityItemGridOverlayWidget} from '@habbo/window/widgets/IRarityItemGridOverlayWidget';
import type {IGetImageListener} from '@habbo/room/IGetImageListener';
import type {ImageResult} from '@habbo/room/ImageResult';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import type {FurnitureItem} from './FurnitureItem';
import {FurnitureCategory} from '../enum';

/**
 * Groups identical furniture items together
 *
 * Based on AS3 com.sulake.habbo.inventory.items.GroupItem
 * This is the ENGINE-only version; UI is the ported window system.
 */
export class GroupItem implements IGetImageListener 
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/items/GroupItem.as::THUMB_COLOR_NORMAL
    private static readonly THUMB_COLOR_NORMAL = 13421772;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/items/GroupItem.as::THUMB_COLOR_UNSEEN
    private static readonly THUMB_COLOR_UNSEEN = 10275685;

    /**
	 * Opacity of the group thumbnail: full when at least one item can still be placed, faded to a
	 * fifth once every copy is locked into a trade.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/items/GroupItem.as::THUMB_BLEND_ITEMS_AVAILABLE
    public static readonly THUMB_BLEND_ITEMS_AVAILABLE = 1;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/items/GroupItem.as::THUMB_BLEND_ITEMS_NOT_AVAILABLE
    public static readonly THUMB_BLEND_ITEMS_NOT_AVAILABLE = 0.2;

    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::_items
    private _items: Map<number, FurnitureItem> = new Map();
    // `protected`, not private: AS3's CreditTradingItem reads `_SafeStr_4570` (the model) and
    // assigns `_window` from its own `createWindow()` override.
    protected _model: FurniModel;
    private _windowInitialized: boolean = false;
    private _presetIcon: ImageBitmap | null;
    private _isNoAutoRequestImage: boolean;
    private _iconImage: ImageBitmap | null = null;
    private _iconCallbackId: number = -1;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/items/GroupItem.as::get iconImage()
    get iconImage(): ImageBitmap | null
    {
        return this._iconImage;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/items/GroupItem.as::set iconImage()
    // Public in AS3 because TradingView assigns it directly when a late icon arrives for an item
    // that is already sitting in a trade grid.
    set iconImage(value: ImageBitmap | null)
    {
        this._iconImage = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/items/GroupItem.as::get iconCallbackId()
    get iconCallbackId(): number
    {
        return this._iconCallbackId;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/items/GroupItem.as::_SafeStr_7581 (name derived: read back by previewCallbackId)
    private _previewCallbackId: number = 0;

    /**
	 * The id of the *large preview* image request, which is not the thumbnail's
	 *
	 * `iconCallbackId` above tracks the grid thumbnail and is compared inside imageReady();
	 * this one is written and read only from outside, by whichever view is showing the group at
	 * full size. Two separate requests, two separate ids — AS3 keeps both fields for that reason.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/items/GroupItem.as::get previewCallbackId()
    get previewCallbackId(): number
    {
        return this._previewCallbackId;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/items/GroupItem.as::set previewCallbackId()
    set previewCallbackId(value: number)
    {
        this._previewCallbackId = value;
    }

    private _isImageInitAttempted: boolean = false;
    private _bgColorWindow: IWindow | null = null;
    private _wasDragCandidate: boolean = false;

    constructor(
        model: FurniModel,
        type: number,
        category: number,
        stuffData: IStuffData | null,
        extra: number,
        icon: ImageBitmap | null = null,
        isNoAutoRequestImage: boolean = false,
        alignment: string = 'center',
        showRecyclable: boolean = false
    ) 
    {
        this._model = model;
        this._type = type;
        this._category = category;
        this._stuffData = stuffData;
        this._extra = extra;
        this._presetIcon = icon;
        this._isNoAutoRequestImage = isNoAutoRequestImage;
        this._alignment = alignment;
        this._showRecyclable = showRecyclable;

        switch(this._category) 
        {
            case FurnitureCategory.WALL_PAPER:
                this._name = model.localization.getLocalization('inventory.furni.item.wallpaper.name');
                this._description = model.localization.getLocalization('inventory.furni.item.wallpaper.desc');
                break;
            case FurnitureCategory.FLOOR:
                this._name = model.localization.getLocalization('inventory.furni.item.floor.name');
                this._description = model.localization.getLocalization('inventory.furni.item.floor.desc');
                break;
            case FurnitureCategory.LANDSCAPE:
                this._name = model.localization.getLocalization('inventory.furni.item.landscape.name');
                this._description = model.localization.getLocalization('inventory.furni.item.landscape.desc');
                break;
        }
    }

    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::_window
    protected _window: IWindowContainer | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/items/GroupItem.as::get window()
    get window(): IWindowContainer | null 
    {
        if(!this._windowInitialized) 
        {
            this.initWindow();
        }

        return this._window;
    }

    private _alignment: string;

    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::get alignment()
    get alignment(): string 
    {
        return this._alignment;
    }

    private _showRecyclable: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/items/GroupItem.as::set showRecyclable()
    set showRecyclable(value: boolean) 
    {
        if(this._showRecyclable !== value) 
        {
            this._showRecyclable = value;
            this.updateRecycleStatusVisual();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/items/GroupItem.as::get isImageInited()
    get isImageInited(): boolean 
    {
        return this._windowInitialized && this._isImageInitAttempted;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/items/GroupItem.as::get isImageFinished()
    get isImageFinished(): boolean 
    {
        return this._iconCallbackId === -1;
    }

    private _type: number;

    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::get type()
    get type(): number 
    {
        return this._type;
    }

    private _category: number;

    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::get category()
    get category(): number 
    {
        return this._category;
    }

    private _stuffData: IStuffData | null;

    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::get stuffData()
    get stuffData(): IStuffData | null 
    {
        return this._stuffData;
    }

    private _extra: number;

    get extra(): number 
    {
        return this._extra;
    }

    private _isLocked: boolean = false;

    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::get isLocked()
    get isLocked(): boolean 
    {
        return this._isLocked;
    }

    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::set isLocked()
    set isLocked(value: boolean) 
    {
        this._isLocked = value;
    }

    private _isSelected: boolean = false;

    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::get isSelected()
    get isSelected(): boolean 
    {
        return this._isSelected;
    }

    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::set isSelected()
    set isSelected(value: boolean) 
    {
        if(this._isSelected !== value) 
        {
            this._isSelected = value;
            this.updateSelectionVisual();
        }
    }

    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::_hasUnseenItems
    private _hasUnseenItems: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/items/GroupItem.as::get hasUnseenItems()
    get hasUnseenItems(): boolean
    {
        return this._hasUnseenItems;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/items/GroupItem.as::set hasUnseenItems()
    set hasUnseenItems(value: boolean)
    {
        if(this._hasUnseenItems !== value) 
        {
            this._hasUnseenItems = value;
            this.updateBackgroundVisual();
        }
    }

    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::_name
    private _name: string = '';

    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::get name()
    get name(): string 
    {
        return this._name;
    }

    set name(value: string) 
    {
        this._name = value;
    }

    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::_description
    private _description: string = '';

    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::get description()
    get description(): string 
    {
        return this._description;
    }

    set description(value: string) 
    {
        this._description = value;
    }

    private _selectedItemIndex: number = -1;

    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::get selectedItemIndex()
    get selectedItemIndex(): number 
    {
        if(this._selectedItemIndex >= this._items.size) 
        {
            this._selectedItemIndex = Math.max(0, this._items.size - 1);
        }

        return this._selectedItemIndex;
    }

    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::set selectedItemIndex()
    set selectedItemIndex(value: number) 
    {
        if(value >= this._items.size) 
        {
            value = 0;
        }

        this._selectedItemIndex = value;
    }

    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::get isWallItem()
    get isWallItem(): boolean 
    {
        const item = this.getAt(0);

        return item?.isWallItem ?? false;
    }

    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::get flatId()
    get flatId(): number 
    {
        const item = this.getAt(0);

        return item?.flatId ?? -1;
    }

    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::get isGroupable()
    get isGroupable(): boolean 
    {
        const item = this.getAt(0);

        return item?.groupable ?? true;
    }

    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::get isRented()
    get isRented(): boolean 
    {
        const item = this.getAt(0);

        return item?.isRented ?? false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/items/GroupItem.as::initImage()
    initImage(setLoadingImage: boolean = true): boolean 
    {
        if(this._iconImage !== null) return false;

        if(this._isImageInitAttempted) return false;

        let result: ImageResult;

        if(this.isWallItem) 
        {
            result = this._model.roomEngine.getWallItemIcon(this._type, this, this._stuffData?.getLegacyString() ?? null);
        }
        else 
        {
            result = this._model.roomEngine.getFurnitureIcon(this._type, this, String(this._extra), this._stuffData);
        }

        if(result.id > 0) 
        {
            if(setLoadingImage) 
            {
                this.setLoadingImage(result.data);
            }

            this._iconCallbackId = result.id;
        }
        else 
        {
            this.setFinalImage(result.data);
            this._iconCallbackId = -1;
        }

        this._isImageInitAttempted = true;

        return result.id > 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/items/GroupItem.as::imageReady()
    imageReady(id: number, data: ImageBitmap | null): void 
    {
        if(!this._window) return;

        if(this._iconCallbackId !== id) return;

        this._iconImage = data;
        this._iconCallbackId = -1;
        this.updateItemImageVisual();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/items/GroupItem.as::imageFailed()
    imageFailed(_id: number): void 
    {
        // Intentional no-op, matches AS3.
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/items/GroupItem.as::removeIntervalProcedure()
    removeIntervalProcedure(): void 
    {
        if(this._window) 
        {
            this._window.procedure = null;
        }
    }

    /**
	 * Adds an item at the *front* of the group
	 *
	 * The distinction from push() is the position, and it is what makes a just-acquired item show
	 * as the group's thumbnail. AS3 gets it from its ordered map's own `unshift`; a `Map` has no
	 * such thing, so the entries are rebuilt with the newcomer first — the group holds a handful
	 * of items, not a list worth optimising.
	 */
    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::unshift()
    unshift(item: FurnitureItem): void
    {
        const existing = this._items.get(item.id);

        if(existing)
        {
            existing.locked = false;
        }
        else
        {
            const entries = Array.from(this._items.entries());

            this._items.clear();
            this._items.set(item.id, item);

            for(const [id, existingItem] of entries) this._items.set(id, existingItem);
        }

        this.updateAllThumbDataVisuals();
    }

    /**
     * Add an item to the group
     */
    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::push()
    push(item: FurnitureItem, isUnseen: boolean = false): void
    {
        const existing = this._items.get(item.id);

        if(!existing) 
        {
            this._items.set(item.id, item);
        }
        else 
        {
            existing.locked = false;
        }

        this.updateItemCountVisual();
        this.updateSelectionVisual();
        this.updateRentStateVisual();

        if(!this._name) 
        {
            this._name = this.getFurniItemName();
        }

        if(!this._description) 
        {
            this._description = this.getFurniItemDesc();
        }

        if(isUnseen !== this._hasUnseenItems) 
        {
            this._hasUnseenItems = isUnseen;
            this.updateBackgroundVisual();
        }
    }

    /**
     * Remove and return the last item
     */
    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::pop()
    pop(): FurnitureItem | null 
    {
        if(this._items.size === 0) 
        {
            return null;
        }

        const items = Array.from(this._items.values());
        const item = items[items.length - 1];

        this._items.delete(item.id);
        this.updateAllThumbDataVisuals();

        return item;
    }

    /**
     * Get the last item without removing it
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/items/GroupItem.as::peek()
    peek(): FurnitureItem | null
    {
        if(this._items.size === 0)
        {
            return null;
        }

        const items = Array.from(this._items.values());

        return items[items.length - 1];
    }

    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::_furniDataCache
    private _furniDataCache: IFurnitureData | null = null;

    /**
	 * The furniture data for this group, resolved once and cached.
	 *
	 * Every item in a group shares a type, so the lookup is stable for the group's
	 * lifetime — AS3 never invalidates the cache either.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/items/GroupItem.as::get furniData()
    get furniData(): IFurnitureData | null
    {
        if(this._furniDataCache !== null)
        {
            return this._furniDataCache;
        }

        const item = this.peek();

        if(item === null)
        {
            return null;
        }

        const type = item.isWallItem ? 'i' : 's';

        this._furniDataCache = this._model.controller.getFurnitureData(item.type, type);

        return this._furniDataCache;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/items/GroupItem.as::get className()
    get className(): string
    {
        return this.furniData?.className ?? '';
    }

    /**
     * Get item at index
     */
    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::getAt()
    getAt(index: number): FurnitureItem | null 
    {
        const items = Array.from(this._items.values());

        return items[index] ?? null;
    }

    /**
     * Get item by ID
     */
    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::getItem()
    getItem(itemId: number): FurnitureItem | null 
    {
        return this._items.get(itemId) ?? null;
    }

    /**
     * Remove item by ID
     */
    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::remove()
    remove(itemId: number): FurnitureItem | null 
    {
        const item = this._items.get(itemId);

        if(item) 
        {
            this._items.delete(itemId);
            this.updateAllThumbDataVisuals();
        }

        return item ?? null;
    }

    /**
     * Replace item
     */
    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::replaceItem()
    replaceItem(itemId: number, item: FurnitureItem): void 
    {
        this._items.set(itemId, item);
        this.updateAllThumbDataVisuals();
    }

    /**
     * Get total item count
     * For POST_IT items, returns sum of quantities
     */
    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::getTotalCount()
    getTotalCount(): number 
    {
        if(this._category === FurnitureCategory.POST_IT) 
        {
            let count = 0;

            for(const item of this._items.values()) 
            {
                const quantity = parseInt(item.stuffData?.getLegacyString() ?? '0', 10);

                count += quantity || 0;
            }

            return count;
        }

        return this._items.size;
    }

    /**
     * Get count of unlocked items
     */
    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::getUnlockedCount()
    getUnlockedCount(): number 
    {
        if(this._category === FurnitureCategory.POST_IT) 
        {
            return this.getTotalCount();
        }

        let count = 0;

        for(const item of this._items.values()) 
        {
            if(!item.locked) 
            {
                count++;
            }
        }

        return count;
    }

    /**
     * Get count of tradeable items (unlocked and tradeable by default)
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/items/GroupItem.as::getTradeableCount()
    // AS3's param name isn't recoverable (obfuscated locals); named for what it does, matching
    // `!param1 || !locked` exactly - true (the default) excludes locked items, false counts every
    // tradeable item regardless of lock state.
    getTradeableCount(excludeLocked: boolean = true): number
    {
        let count = 0;

        for(const item of this._items.values())
        {
            if(item.tradeable && (!excludeLocked || !item.locked))
            {
                count++;
            }
        }

        return count;
    }

    /**
     * Get count of recyclable items (unlocked and recyclable)
     */
    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::getRecyclableCount()
    getRecyclableCount(): number 
    {
        let count = 0;

        for(const item of this._items.values()) 
        {
            if(!item.locked && item.recyclable) 
            {
                count++;
            }
        }

        return count;
    }

    /**
     * Lock an item by ID
     */
    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::addLockTo()
    addLockTo(itemId: number): boolean 
    {
        const item = this._items.get(itemId);

        if(item) 
        {
            item.locked = true;
            this.updateItemCountVisual();
            return true;
        }

        return false;
    }

    /**
     * Unlock an item by ID
     */
    /**
     * Reserves every sellable, not-already-locked item in the group and hands them back. The
     * marketplace locks the whole stack up front so the user can pick a quantity without the grid
     * shifting under them; `removeLocks()` gives back whatever was not sold.
     */
    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::lockAllSellable()
    lockAllSellable(): FurnitureItem[]
    {
        const locked: FurnitureItem[] = [];

        for(const item of this._items.values())
        {
            if(item.sellable && !item.locked)
            {
                item.locked = true;
                locked.push(item);
            }
        }

        this.updateItemCountVisual();

        return locked;
    }

    /**
     * Note AS3 matches on the item's **id**, not its ref, and only repaints when something actually
     * changed — a release for an empty set must not redraw the grid.
     */
    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::removeLocks()
    removeLocks(itemIds: Set<number>): void
    {
        let changed = false;

        for(const item of this._items.values())
        {
            if(itemIds.has(item.id))
            {
                item.locked = false;
                changed = true;
            }
        }

        if(changed)
        {
            this.updateItemCountVisual();
            this.updateRecycleStatusVisual();
        }
    }

    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::removeLockFrom()
    removeLockFrom(itemId: number): boolean 
    {
        const item = this._items.get(itemId);

        if(item) 
        {
            item.locked = false;
            this.updateItemCountVisual();
            this.updateRecycleStatusVisual();
            return true;
        }

        return false;
    }

    /**
     * Unlock all items
     */
    removeAllLocks(): void 
    {
        let changed = false;

        for(const item of this._items.values()) 
        {
            if(item.locked) 
            {
                item.locked = false;
                changed = true;
            }
        }

        if(changed) 
        {
            this.updateItemCountVisual();
        }
    }

    /**
     * Update locks based on reference IDs (items in trade)
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/items/GroupItem.as::updateLocks()
    updateLocks(lockedRefIds: number[]): void
    {
        let changed = false;

        for(const item of this._items.values())
        {
            const shouldBeLocked = lockedRefIds.includes(item.ref);

            if(item.locked !== shouldBeLocked)
            {
                item.locked = shouldBeLocked;
                changed = true;
            }
        }

        // AS3 redraws the count/lock overlay only when a lock actually flipped. Without
        // this the visual kept showing the old locked/unlocked state after a trade.
        if(changed)
        {
            this.updateItemCountVisual();
        }
    }

    /**
     * Get one item available for trade
     */
    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::getOneForTrade()
    getOneForTrade(): FurnitureItem | null 
    {
        // Try selected item first
        if(this._selectedItemIndex >= 0) 
        {
            const selected = this.getAt(this._selectedItemIndex);

            if(selected && !selected.locked && selected.tradeable) 
            {
                return selected;
            }
        }

        // Find any tradeable item
        for(const item of this._items.values()) 
        {
            if(!item.locked && item.tradeable) 
            {
                return item;
            }
        }

        return null;
    }

    /**
     * Get multiple items for trade
     */
    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::getItemsForTrade()
    getItemsForTrade(count: number): IFurnitureItem[] 
    {
        const result: IFurnitureItem[] = [];
        const tradeItem = this.getOneForTrade();

        if(!tradeItem) 
        {
            return result;
        }

        for(const item of this._items.values()) 
        {
            if(result.length >= count) 
            {
                break;
            }

            if(!item.locked && item.tradeable && item.type === tradeItem.type) 
            {
                result.push(item);
            }
        }

        return result;
    }

    /**
     * Get one item for recycling (locks it)
     */
    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::getOneForRecycle()
    getOneForRecycle(): FurnitureItem | null 
    {
        for(const item of this._items.values()) 
        {
            if(!item.locked && item.recyclable) 
            {
                this.addLockTo(item.id);
                return item;
            }
        }

        return null;
    }

    /**
     * Get one item for selling on marketplace
     */
    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::getOneForSelling()
    getOneForSelling(): FurnitureItem | null 
    {
        for(const item of this._items.values()) 
        {
            if(!item.locked && item.sellable) 
            {
                return item;
            }
        }

        return null;
    }

    /**
     * Get all furniture IDs in this group
     */
    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::getFurniIds()
    getFurniIds(): number[] 
    {
        return Array.from(this._items.keys());
    }

    /**
     * Get all non-rented furniture IDs
     */
    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::getNonRentedFurnitureIds()
    getNonRentedFurnitureIds(): number[] 
    {
        const ids: number[] = [];

        for(const item of this._items.values()) 
        {
            if(!item.isRented) 
            {
                ids.push(item.id);
            }
        }

        return ids;
    }

    /**
     * Minimum items to show counter in UI
     */
    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::getMinimumItemsToShowCounter()
    getMinimumItemsToShowCounter(): number 
    {
        return 2;
    }

    /**
     * Dispose the group
     */
    // DEVIATION: AS3 also stops listening for song info (`onSongInfoReceivedEvent()`); the RPG fork
    //   removed jukebox music, so a song disk is named like any other furni.
    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::dispose()
    dispose(): void
    {
        this._items.clear();
        this._stuffData = null;

        if(this._window) 
        {
            this._window.dispose();
            this._window = null;
        }
    }

    // TS deviation: uses the generic buildWidgetLayout() cache-per-call mechanism
    // instead of AS3's own template+clone cache (FurniModel.createItemWindow()) —
    // both build the same layout per new thumbnail; no functional difference.
    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::createWindow()
    protected createWindow(): void 
    {
        this._window = this._model.windowManager.buildWidgetLayout('inventory_thumb_xml') as IWindowContainer | null;
    }

    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::setFinalImage()
    private setFinalImage(data: ImageBitmap | null): void 
    {
        this._iconImage = data;
        this._isImageInitAttempted = true;
        this._iconCallbackId = -1;
        this.updateItemImageVisual();
    }

    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::setLoadingImage()
    private setLoadingImage(data: ImageBitmap | null): void 
    {
        this._iconImage = data;
        this._isImageInitAttempted = true;
        this.updateItemImageVisual();
    }

    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::initWindow()
    private initWindow(): void 
    {
        this.createWindow();

        if(this._presetIcon !== null) 
        {
            this.setFinalImage(this._presetIcon);
        }
        else if(!this._isNoAutoRequestImage) 
        {
            this.initImage();
        }

        if(this._window) 
        {
            this._window.procedure = this.itemEventProc;

            let name = `${this._model.roomEngine.getFurnitureType(this._type) ?? ''}.${this._category}`;

            if(this._stuffData && this._stuffData.getLegacyString() !== '') 
            {
                name += `.s${this._stuffData.getLegacyString()}`;
            }

            if(!isNaN(this._extra)) 
            {
                name += `.e${this._extra}`;
            }

            this._window.name = name;
        }

        this.updateBackgroundVisual();
        this.updateItemCountVisual();
        this.updateItemImageVisual();
        this.updateRecycleStatusVisual();
        this.updateSelectionVisual();
        this.updateRentStateVisual();

        this._windowInitialized = true;
    }

    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::updateAllThumbDataVisuals()
    private updateAllThumbDataVisuals(): void 
    {
        if(!this._window) return;

        this.updateItemImageVisual();
        this.updateBackgroundVisual();
        this.updateItemCountVisual();
        this.updateRecycleStatusVisual();
        this.updateSelectionVisual();
        this.updateRentStateVisual();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/items/GroupItem.as::updateRentStateVisual()
    private updateRentStateVisual(): void 
    {
        if(!this._window) return;

        const item = this.getAt(0);
        const rentState = this._window.findChildByName('rent_state') as IStaticBitmapWrapperWindow | null;

        if(!rentState) return;

        if(!item || !this.isRented) 
        {
            rentState.visible = false;

            return;
        }

        rentState.visible = true;

        const warningDuration = this._model.controller.getInteger('purchase.rent.warning_duration_seconds', 172800);

        rentState.assetUri = !item.hasRentPeriodStarted
            ? 'inventory_thumb_rent_not_started'
            : (item.secondsToExpiration < warningDuration ? 'inventory_thumb_rent_ending' : 'inventory_thumb_rent_started');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/items/GroupItem.as::updateItemCountVisual()
    private updateItemCountVisual(): void 
    {
        if(!this._window) return;

        const count = this.getUnlockedCount();
        const showCounter = count >= this.getMinimumItemsToShowCounter();
        const numberContainer = this._window.findChildByName('number_container');

        if(numberContainer) 
        {
            numberContainer.visible = showCounter;
        }

        if(showCounter) 
        {
            const numberText = this._window.findChildByName('number') as ITextWindow | null;

            if(numberText) 
            {
                numberText.text = String(count);
            }
        }

        const bitmap = this._window.findChildByName('bitmap') as IBitmapWrapperWindow | null;

        if(bitmap) 
        {
            bitmap.alpha = count <= 0 ? 0.2 : 1;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/items/GroupItem.as::updateBackgroundVisual()
    private updateBackgroundVisual(): void 
    {
        if(!this._window) return;

        if(!this._bgColorWindow) 
        {
            this._bgColorWindow = this._window.findChildByTag('BG_COLOR');
        }

        if(this._bgColorWindow) 
        {
            this._bgColorWindow.color = this._hasUnseenItems ? GroupItem.THUMB_COLOR_UNSEEN : GroupItem.THUMB_COLOR_NORMAL;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/items/GroupItem.as::updateSelectionVisual()
    private updateSelectionVisual(): void 
    {
        if(!this._window) return;

        const outline = this._window.findChildByName('outline');

        if(outline) 
        {
            outline.visible = this._isSelected;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/items/GroupItem.as::updateRecycleStatusVisual()
    private updateRecycleStatusVisual(): void 
    {
        if(!this._window) return;

        const container = this._window.findChildByName('recyclable_container');

        if(container) 
        {
            container.visible = this._showRecyclable && this.getRecyclableCount() > 0;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/items/GroupItem.as::updateItemImageVisual()
    private updateItemImageVisual(): void 
    {
        if(!this._window) return;

        if(this._stuffData && this._stuffData.uniqueSerialNumber > 0)
        {
            const container = this._window.findChildByName('unique_item_overlay_container') as IWidgetWindow | null;

            if(container)
            {
                const widget = container.widget as ILimitedItemGridOverlayWidget | null;

                if(widget)
                {
                    widget.serialNumber = this._stuffData.uniqueSerialNumber;
                    widget.animated = true;
                }

                // AS3 makes the overlay container visible; without it the limited-item
                // plaque stayed hidden even when its widget was configured.
                container.visible = true;
            }

            const background = this._window.findChildByName('unique_item_background_bitmap');

            if(background)
            {
                background.visible = true;
            }
        }
        else if(this._stuffData && this._stuffData.rarityLevel >= 0)
        {
            const container = this._window.findChildByName('rarity_item_overlay_container') as IWidgetWindow | null;

            if(container)
            {
                const widget = container.widget as IRarityItemGridOverlayWidget | null;

                if(widget)
                {
                    widget.rarityLevel = this._stuffData.rarityLevel;
                }

                // AS3 makes the overlay container visible; without it the rarity plaque
                // stayed hidden.
                container.visible = true;
            }
        }
        // AS3 has a third branch here for coins/furni chests: a coloured plaque with the contents
        // count, drawn by the `chest_overlay_grid` widget. The RPG fork removed the wired chests.

        const bitmap = this._window.findChildByName('bitmap') as IBitmapWrapperWindow | null;

        if(bitmap) 
        {
            bitmap.bitmap = this._iconImage;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/items/GroupItem.as::itemEventProc()
    private itemEventProc = (event: WindowEvent, _window: IWindow): void =>
    {
        switch(event.type)
        {
            case WindowMouseEvent.UP:
                this._wasDragCandidate = false;
                this._model.cancelFurniInMover();
                break;
            case WindowMouseEvent.DOWN:
                this._model.removeSelections();
                this.isSelected = true;
                this._wasDragCandidate = true;
                this._model.updateActionView();
                this._model.selectItem(this);
                break;
            case WindowMouseEvent.OUT:
                if(!this._wasDragCandidate || this._model.isTradingOpen) return;

                // AS3 passes true here (GroupItem.as:985) and only here: a drag out of the grid
                // refuses wallpaper/floor/landscape outright instead of turning into a room-property
                // request, which is what the two buttons in FurniView do.
                if(this._model.requestSelectedFurniPlacement(true))
                {
                    this._wasDragCandidate = false;
                }

                break;
            case WindowMouseEvent.CLICK:
                this._wasDragCandidate = false;
                break;
            case WindowMouseEvent.DOUBLE_CLICK:
                this._model.requestCurrentActionOnSelection();
                this._wasDragCandidate = false;
                break;
        }
    };

    // DEVIATION: AS3 names a song disk after its song (`getSongInfo()`); the RPG fork removed
    //   jukebox music, so a song disk takes its furni name.
    // AS3: .../src/com/sulake/habbo/inventory/items/GroupItem.as::getFurniItemName()
    private getFurniItemName(): string
    {
        const item = this.peek();

        if(item === null) return '';

        if(this._category === FurnitureCategory.POSTER)
        {
            return this._model.localization.getLocalization(`poster_${item.stuffData?.getLegacyString() ?? ''}_name`);
        }

        const key = this.isWallItem ? `wallItem.name.${item.type}` : `roomItem.name.${item.type}`;

        return this._model.localization.getLocalization(key);
    }

    // DEVIATION: AS3 describes a song disk by its song's creator; the RPG fork removed jukebox
    //   music, so a song disk takes its furni description.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/items/GroupItem.as::getFurniItemDesc()
    private getFurniItemDesc(): string
    {
        const item = this.peek();

        if(item === null) return '';

        if(this._category === FurnitureCategory.POSTER)
        {
            return this._model.localization.getLocalization(`poster_${item.stuffData?.getLegacyString() ?? ''}_desc`);
        }

        const key = this.isWallItem ? `wallItem.desc.${item.type}` : `roomItem.desc.${item.type}`;

        return this._model.localization.getLocalization(key);
    }
}
