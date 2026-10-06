import type {IItemGridWindow} from '@core/window/components/IItemGridWindow';
import type {IItemListWindow} from '@core/window/components/IItemListWindow';
import type {IRegionWindow} from '@core/window/components/IRegionWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {ITextWindow} from '@core/window/components/ITextWindow';
import type {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';

// TextController (the concrete ITextWindow implementation) exposes a real
// underline setter; the interface only declares it read-only.
type WritableTextWindow = ITextWindow & {underline: boolean};
import {WindowMouseEvent as WindowMouseEventClass} from '@core/window/events/WindowMouseEvent';
import type {GroupItem} from '../items/GroupItem';
import {FurniGridFilters} from './FurniGridFilters';

/**
 * Manages the paginated furniture grid (filtering, sorting, paging).
 *
 * Based on AS3 com.sulake.habbo.inventory.furni.FurniGridView
 *
 * The AS3 decompilation of changeToPage()/updatePaging() is corrupted
 * (dead `while(0 < n)` loops that never advance, `null.x` references to
 * what must be the newly-created page item) — reconstructed here from
 * evident intent: iterate the actual index range / page count.
 */
export class FurniGridView
{
    private static readonly PLACEMENT_ANYWHERE = 0;

    private static readonly PLACEMENT_IN_ROOM = 1;

    private static readonly PLACEMENT_NOT_IN_ROOM = 2;

    /**
     * The main dropdown's selection index, as the filter string AS3 works in.
     *
     * The layout's `filter.options` offers three entries in this order; AS3's fourth,
     * `room_layout`, has no entry in it — only AS3's `setFilterByWired()` (wired trading, removed
     * in the RPG fork) could reach that one.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniGridView.as::setFilter()
    private static readonly MAIN_FILTER_BY_SELECTION: readonly string[] = [
        FurniGridFilters.MAIN_ALL,
        FurniGridFilters.MAIN_FLOOR_ITEMS,
        FurniGridFilters.MAIN_WALL_ITEMS
    ];

    private static readonly PAGE_COLOR_ACTIVE = 16711680;

    private static readonly PAGE_COLOR_INACTIVE = 0;

    private _grid: IItemGridWindow;
    private _pageList: IItemListWindow | null;
    private _pageTemplate: IRegionWindow | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniGridView.as::_items
    private _items: GroupItem[] = [];
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniGridView.as::_passedItems
    private _passedItems: GroupItem[] = [];
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniGridView.as::_currentPageItems
    private _currentPageItems: GroupItem[] = [];

    /**
     * The main dropdown, as AS3's own string: all / floor_items / wall_items / room_layout.
     *
     * Replaced a `_showFloorItems`/`_showWallItems` boolean pair on 2026-09-05. Two booleans cannot
     * express `room_layout` at all, and they got `wall_items` wrong in a way that showed: AS3
     * excludes wallpaper, floor and landscape from it (`isWallItem && !isRoomLayout`), where the
     * pair let all three through.
     *
     * Name DERIVED: AS3's field is `_SafeStr_8319`, obfuscated; named after the argument
     * `setFilter()` assigns it from.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniGridView.as::setFilter()
    private _mainFilter: string = FurniGridFilters.MAIN_ALL;

    /**
     * The type dropdown — sittable, wired, tradable and the rest.
     *
     * Name DERIVED: AS3's field is `_SafeStr_7832`, obfuscated; named after what it holds.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniGridView.as::setFilter()
    private _typeFilter: string = FurniGridFilters.TYPE_ANY;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniGridView.as::_showingRentedItems
    private _showingRentedItems: boolean = false;
    private _mergeRentFurni: boolean = false;
    private _placementFilter: number = FurniGridView.PLACEMENT_ANYWHERE;
    private _searchText: string = '';

    private _itemsPerPage: number = 200;
    private _currentPage: number = -1;

    constructor(grid: IItemGridWindow, pageList: IItemListWindow | null)
    {
        this._grid = grid;
        this._grid.shouldRebuildGridOnResize = false;

        if(pageList)
        {
            this._pageList = pageList;
            this._pageTemplate = pageList.removeListItemAt(0) as IRegionWindow | null;
        }
        else
        {
            this._pageList = null;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniGridView.as::get visibleCount()
    get visibleCount(): number
    {
        return this._grid.numGridItems;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniGridView.as::get currentPageItems()
    get currentPageItems(): GroupItem[]
    {
        return this._currentPageItems;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniGridView.as::get pageCount()
    private get pageCount(): number
    {
        return Math.floor(this._passedItems.length / this._itemsPerPage) + 1;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniGridView.as::dispose()
    dispose(): void
    {
        this._items = [];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniGridView.as::clearGrid()
    clearGrid(): void
    {
        this._grid.removeGridItems();
        this._grid.destroyGridItems();
    }

    // DEVIATION: AS3 takes a last `showingNfts` flag that hides NFT furni during a trade; the RPG
    //   fork removed NFT.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniGridView.as::setFilter()
    setFilter(
        placementOrWallFilter: number,
        _filterLabel: string,
        showingRentedItems: boolean,
        mergeRentFurni: boolean,
        searchText: string,
        placementFilter: number
    ): void
    {
        this._mainFilter = FurniGridView.MAIN_FILTER_BY_SELECTION[placementOrWallFilter]
            ?? FurniGridFilters.MAIN_ALL;
        // The type dropdown AS3's second argument comes from is not in this port's layout yet, so
        // the normal path leaves it open. (AS3's other caller, `setFilterByWired()`, went with
        // wired trading in the RPG fork.)
        this._typeFilter = FurniGridFilters.TYPE_ANY;
        this._showingRentedItems = showingRentedItems;
        this._mergeRentFurni = mergeRentFurni;
        this._placementFilter = placementFilter;
        this._searchText = (searchText ?? '').toLowerCase();

        this.update();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniGridView.as::itemWasUpdated()
    itemWasUpdated(item: GroupItem): void
    {
        if(this.passFilter(item))
        {
            this.update();
        }
    }

    // The substitution this used to describe is gone as of 2026-09-05: AS3's filter strings and
    // both of its predicates are ported (`FurniGridFilters`, `passMainFilter`, `passTypeFilter`),
    // and nothing else is blocked on them. What remains of the port's
    // own model is the placement dropdown alone — `_placementFilter`, which answers "is this item
    // currently in a room", a question AS3's filters cannot ask — and it now sits *beside* AS3's
    // clauses in `passFilter()` rather than in place of them.

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniGridView.as::itemsWereUpdated()
    itemsWereUpdated(items: GroupItem[]): void
    {
        if(items.some((item) => this.passFilter(item)))
        {
            this.update();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniGridView.as::getFirstThumb()
    getFirstThumb(): unknown
    {
        if(this._grid.numGridItems === 0) return null;

        return this._grid.getGridItemAt(0);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniGridView.as::setItems()
    setItems(items: GroupItem[]): void
    {
        this._items = items;
        this.update();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniGridView.as::update()
    private update(): void
    {
        let currentItems = this._items.filter((item) => this.passFilter(item));

        if(!this._mergeRentFurni && this._showingRentedItems)
        {
            currentItems = currentItems.slice().sort((a, b) =>
            {
                const itemA = a.peek();
                const itemB = b.peek();
                const startedDiff = Number(itemB?.hasRentPeriodStarted ?? false) - Number(itemA?.hasRentPeriodStarted ?? false);

                if(startedDiff !== 0) return startedDiff;

                return (itemA?.secondsToExpiration ?? 0) - (itemB?.secondsToExpiration ?? 0);
            });
        }

        if(currentItems.length === this._passedItems.length)
        {
            let changed = false;

            for(let i = 0; i < currentItems.length; i++)
            {
                if(currentItems[i] !== this._passedItems[i])
                {
                    changed = true;
                    break;
                }
            }

            if(!changed) return;
        }

        this._passedItems = currentItems;
        this.changeToPage(this._currentPage, true);
        this.updatePaging();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniGridView.as::changeToPage()
    private changeToPage(page: number, force: boolean = false): void
    {
        if(page > -1)
        {
            if(this._currentPage === page && !force) return;
        }
        else
        {
            page = 0;
        }

        this._currentPage = page;

        if(this._currentPage >= this.pageCount)
        {
            this._currentPage = this.pageCount - 1;
        }

        this._currentPage = Math.max(this._currentPage, 0);
        this._currentPageItems = [];
        this.clearGrid();

        const start = this._currentPage * this._itemsPerPage;
        const end = Math.min(start + this._itemsPerPage, this._passedItems.length);

        for(let i = start; i < end; i++)
        {
            const item = this._passedItems[i];

            this._grid.addGridItem(item.window!);
            this._currentPageItems.push(item);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniGridView.as::updatePaging()
    private updatePaging(): void
    {
        if(!this._pageList) return;

        const count = this.pageCount;

        this._pageList.visible = count > 1;

        if(this._currentPage >= count)
        {
            this._currentPage = count - 1;
        }

        this._currentPage = Math.max(this._currentPage, 0);

        if(count !== this._pageList.numListItems)
        {
            for(let i = 0; i < this._pageList.numListItems; i++)
            {
                const existing = this._pageList.getListItemAt(i);

                existing?.removeEventListener(WindowMouseEventClass.CLICK, this.onPageEventProc as unknown as (...args: unknown[]) => void);
            }

            this._pageList.destroyListItems();

            for(let i = 0; i < count; i++)
            {
                if(!this._pageTemplate) break;

                const pageItem = this._pageTemplate.clone() as IRegionWindow;

                pageItem.addEventListener(WindowMouseEventClass.CLICK, this.onPageEventProc as unknown as (...args: unknown[]) => void);
                pageItem.addEventListener(WindowMouseEventClass.OVER, this.onPageEventProc as unknown as (...args: unknown[]) => void);
                pageItem.addEventListener(WindowMouseEventClass.OUT, this.onPageEventProc as unknown as (...args: unknown[]) => void);
                pageItem.id = i;
                pageItem.name = `page_${i}`;
                this._pageList.addListItem(pageItem);
            }
        }

        for(let i = 0; i < count; i++)
        {
            const pageItem = this._pageList.getListItemAt(i) as unknown as IWindowContainer | null;
            const pageText = pageItem?.findChildByTag('PAGE') as WritableTextWindow | null;

            if(!pageText) continue;

            pageText.text = i.toString();

            if(i === this._currentPage)
            {
                pageText.underline = true;
                pageText.textColor = FurniGridView.PAGE_COLOR_ACTIVE;
            }
            else
            {
                pageText.underline = false;
                pageText.textColor = FurniGridView.PAGE_COLOR_INACTIVE;
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniGridView.as::onPageEventProc()
    private onPageEventProc = (event: WindowMouseEvent): void =>
    {
        const window = event.window as IRegionWindow | null;

        if(!window) return;

        const page = window.id;
        const pageText = (window as unknown as IWindowContainer).findChildByTag('PAGE') as WritableTextWindow | null;

        switch(event.type)
        {
            case WindowMouseEventClass.CLICK:
                this.changeToPage(page);
                this.updatePaging();
                break;
            case WindowMouseEventClass.OVER:
                if(pageText) pageText.textColor = FurniGridView.PAGE_COLOR_ACTIVE;
                break;
            case WindowMouseEventClass.OUT:
                if(pageText && page !== this._currentPage) pageText.textColor = FurniGridView.PAGE_COLOR_INACTIVE;
                break;
        }
    };

    // DEVIATION: AS3 also drops NFT furni while `showingNfts` is off; the RPG fork removed NFT.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniGridView.as::passFilter()
    private passFilter(item: GroupItem): boolean
    {
        if(!this.passMainFilter(item)) return false;

        if(!this.passTypeFilter(item)) return false;

        if(!this._mergeRentFurni && this._showingRentedItems !== item.isRented) return false;

        // DEVIATION: AS3 has no placement filter — this port's layout carries a second dropdown
        //   answering "is this item currently in a room", which its filter strings cannot express.
        //   It sits between AS3's own clauses rather than replacing any of them.
        if(this._placementFilter === FurniGridView.PLACEMENT_IN_ROOM && item.flatId === -1) return false;

        if(this._placementFilter === FurniGridView.PLACEMENT_NOT_IN_ROOM && item.flatId > -1) return false;

        if(this._searchText.length > 0)
        {
            const name = item.name.toLowerCase();
            const description = item.description.toLowerCase();
            // A chest's own name is searched too, and only when it has one: an empty chest name
            // would otherwise match every query, since `''.indexOf(anything)` is -1 but the guard
            // AS3 writes is `chestName == "" || chestName.indexOf(...) == -1`.
            const chestName = (item.stuffData?.chestName ?? '').toLowerCase();

            if(name.indexOf(this._searchText) === -1
                && description.indexOf(this._searchText) === -1
                && (chestName === '' || chestName.indexOf(this._searchText) === -1)) return false;
        }

        return true;
    }

    /**
     * The main dropdown. `wall_items` deliberately excludes room layout — wallpaper, floor and
     * landscape are wall items by category and are not what someone picking "wall items" wants.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniGridView.as::passMainFilter()
    private passMainFilter(item: GroupItem): boolean
    {
        switch(this._mainFilter)
        {
            case FurniGridFilters.MAIN_ALL: return true;
            case FurniGridFilters.MAIN_FLOOR_ITEMS: return !item.isWallItem;
            case FurniGridFilters.MAIN_WALL_ITEMS: return item.isWallItem && !FurniGridFilters.isRoomLayout(item);
            case FurniGridFilters.MAIN_ROOM_LAYOUT: return FurniGridFilters.isRoomLayout(item);
            // An unknown filter shows everything rather than nothing: AS3's default, and the safer
            // failure for a dropdown whose values come from a layout.
            default: return true;
        }
    }

    // DEVIATION: AS3 also has a `collectibles` type (NFT furni); the RPG fork removed NFT.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/FurniGridView.as::passTypeFilter()
    private passTypeFilter(item: GroupItem): boolean
    {
        switch(this._typeFilter)
        {
            case FurniGridFilters.TYPE_ANY: return true;
            case FurniGridFilters.TYPE_SITTABLE: return FurniGridFilters.isSittable(item);
            case FurniGridFilters.TYPE_LAYABLE: return FurniGridFilters.isLayable(item);
            case FurniGridFilters.TYPE_TILES_OR_RUGS: return FurniGridFilters.isTilesOrRugs(item);
            case FurniGridFilters.TYPE_LTD: return FurniGridFilters.isLtd(item);
            case FurniGridFilters.TYPE_WIRED: return FurniGridFilters.isWired(item);
            case FurniGridFilters.TYPE_CREDIT_FURNI: return FurniGridFilters.isCreditFurni(item);
            case FurniGridFilters.TYPE_CLOTHES: return FurniGridFilters.isClothes(item);
            case FurniGridFilters.TYPE_PET_FOOD: return FurniGridFilters.isPetFood(item);
            case FurniGridFilters.TYPE_TRADABLE: return FurniGridFilters.isTradable(item);
            case FurniGridFilters.TYPE_NON_TRADABLE: return FurniGridFilters.isNonTradable(item);
            case FurniGridFilters.TYPE_RECYCLABLE: return FurniGridFilters.isRecyclable(item);
            case FurniGridFilters.TYPE_WINDOWS: return FurniGridFilters.isWindow(item);
            case FurniGridFilters.TYPE_DIMMERS: return FurniGridFilters.isDimmer(item);
            case FurniGridFilters.TYPE_STICKIES: return FurniGridFilters.isStickie(item);
            case FurniGridFilters.TYPE_PAINTINGS: return FurniGridFilters.isPainting(item);
            case FurniGridFilters.TYPE_FLOORS: return FurniGridFilters.isFloor(item);
            case FurniGridFilters.TYPE_WALLPAPERS: return FurniGridFilters.isWallpaper(item);
            case FurniGridFilters.TYPE_LANDSCAPE: return FurniGridFilters.isLandscape(item);
            default: return true;
        }
    }
}
