import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import type {IScrollableListWindow} from './IScrollableListWindow';
import type {IItemListWindow} from './IItemListWindow';
import type {IScrollbarWindow} from './IScrollbarWindow';
import type {IIterator} from '../utils/IIterator';
import {ContainerController} from './ContainerController';
import {WindowEvent} from '../events/WindowEvent';

/**
 * Scrollable item list window.
 *
 * Combines an item list with a scrollbar. The scrollbar is automatically
 * bound to the item list and can optionally auto-hide when not needed.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ScrollableItemListWindow.as
 */
export class ScrollableItemListWindow extends ContainerController implements IScrollableListWindow 
{
    private _itemListRef: IItemListWindow | null = null;
    private _scrollBarRef: IScrollbarWindow | null = null;
    private readonly _scrollBarEventProcBound: (event: WindowEvent) => void;

    /**
     * AS3 resolves its scrollbar and item-list children here, in the constructor. This port
     * cannot: `scrollBar`/`itemList` read named children that `buildLayoutChildren()` creates,
     * and that only runs later through `completeConstruction()` (see WindowController's
     * phase-split), so at constructor time there are no children to find. Both getters resolve
     * lazily on first use instead, and the scrollbar's enable/disable listeners are attached
     * there rather than here — the constructor only binds the handler it will need.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ScrollableItemListWindow.as::ScrollableItemListWindow()
    constructor(
        name: string,
        type: number,
        style: number,
        param: number,
        context: IWindowContext,
        rect: { x: number; y: number; width: number; height: number },
        parent: IWindow | null = null,
        procedure: ((event: WindowEvent, window: IWindow) => void) | null = null,
        tags: string[] | null = null,
        properties: unknown[] | null = null,
        id: number = 0,
        _dynamicStyle: string = ''
    ) 
    {
        super(name, type, style, param, context, rect, parent, procedure, tags, properties, id);

        this._scrollBarEventProcBound = this.scrollBarEventProc.bind(this);
    }

    private _autoHideScrollBar: boolean = true;

    /**
     * Gets whether auto-hide scrollbar is enabled.
     */
    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::get autoHideScrollBar()
    public get autoHideScrollBar(): boolean 
    {
        return this._autoHideScrollBar;
    }

    /**
     * Sets whether auto-hide scrollbar is enabled.
     */
    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::set autoHideScrollBar()
    public set autoHideScrollBar(value: boolean) 
    {
        this._autoHideScrollBar = value;
        this.updateScrollBarVisibility(true);
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::get isScrollBarVisible()
    public get isScrollBarVisible(): boolean 
    {
        return (this.scrollBar as unknown as IWindow | null)?.visible ?? false;
    }

    /**
     * Gets whether items auto-arrange.
     */
    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::get autoArrangeItems()
    public get autoArrangeItems(): boolean 
    {
        return this.itemList?.autoArrangeItems ?? true;
    }

    /**
     * Sets whether items auto-arrange.
     */
    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::set autoArrangeItems()
    public set autoArrangeItems(value: boolean) 
    {
        if(this.itemList) this.itemList.autoArrangeItems = value;
    }

    /**
     * Gets the spacing between items.
     */
    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::get spacing()
    public get spacing(): number 
    {
        return this.itemList?.spacing ?? 0;
    }

    /**
     * Sets the spacing between items.
     */
    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::set spacing()
    public set spacing(value: number) 
    {
        if(this.itemList) this.itemList.spacing = value;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::get numListItems()
    public get numListItems(): number 
    {
        return this.itemList?.numListItems ?? 0;
    }

    public get firstListItem(): IWindow | null 
    {
        return this.itemList?.firstListItem ?? null;
    }

    public get lastListItem(): IWindow | null 
    {
        return this.itemList?.lastListItem ?? null;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::get isPartOfGridWindow()
    public get isPartOfGridWindow(): boolean 
    {
        return this.itemList?.isPartOfGridWindow ?? false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ScrollableItemListWindow.as::set isPartOfGridWindow()
    public set isPartOfGridWindow(value: boolean)
    {
        if(this.itemList) this.itemList.isPartOfGridWindow = value;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::get scrollH()
    public get scrollH(): number 
    {
        return this.itemList?.scrollH ?? 0;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::set scrollH()
    public set scrollH(value: number) 
    {
        if(this.itemList) this.itemList.scrollH = value;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::get scrollV()
    public get scrollV(): number 
    {
        return this.itemList?.scrollV ?? 0;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::set scrollV()
    public set scrollV(value: number) 
    {
        if(this.itemList) this.itemList.scrollV = value;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::get maxScrollH()
    public get maxScrollH(): number 
    {
        return this.itemList?.maxScrollH ?? 0;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::get maxScrollV()
    public get maxScrollV(): number 
    {
        return this.itemList?.maxScrollV ?? 0;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::get visibleRegion()
    public get visibleRegion(): { x: number; y: number; width: number; height: number } 
    {
        return this.itemList?.visibleRegion ?? {x: 0, y: 0, width: this.width, height: this.height};
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::get scrollableRegion()
    public get scrollableRegion(): { x: number; y: number; width: number; height: number } 
    {
        return this.itemList?.scrollableRegion ?? {x: 0, y: 0, width: 0, height: 0};
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::get scaleToFitItems()
    public get scaleToFitItems(): boolean 
    {
        return this.itemList?.scaleToFitItems ?? false;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::set scaleToFitItems()
    public set scaleToFitItems(value: boolean) 
    {
        const itemList = this.itemList;

        if(itemList) 
        {
            itemList.scaleToFitItems = value;
        }
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::get resizeOnItemUpdate()
    public get resizeOnItemUpdate(): boolean 
    {
        return this.itemList?.resizeOnItemUpdate ?? false;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::set resizeOnItemUpdate()
    public set resizeOnItemUpdate(value: boolean) 
    {
        const itemList = this.itemList;

        if(itemList) 
        {
            itemList.resizeOnItemUpdate = value;
        }
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::get inverseResizeOnItemUpdate()
    public get inverseResizeOnItemUpdate(): boolean 
    {
        return this.itemList?.inverseResizeOnItemUpdate ?? false;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::set inverseResizeOnItemUpdate()
    public set inverseResizeOnItemUpdate(value: boolean) 
    {
        const itemList = this.itemList;

        if(itemList) 
        {
            itemList.inverseResizeOnItemUpdate = value;
        }
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::get scrollableWindow()
    public get scrollableWindow(): IWindow 
    {
        return this.itemList?.scrollableWindow ?? this;
    }

    /**
     * Gets the internal item list child.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ScrollableItemListWindow.as::get _itemList()
    protected get itemList(): IItemListWindow | null
    {
        if(!this._itemListRef) 
        {
            this._itemListRef = this.findChildByTag('_ITEMLIST') as unknown as IItemListWindow | null;
        }

        return this._itemListRef;
    }

    /**
     * Gets the internal scrollbar child.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ScrollableItemListWindow.as::get _scrollBar()
    protected get scrollBar(): IScrollbarWindow | null
    {
        if(!this._scrollBarRef) 
        {
            this._scrollBarRef = this.findChildByTag('_SCROLLBAR') as unknown as IScrollbarWindow | null;

            if(this._scrollBarRef) 
            {
                (this._scrollBarRef as unknown as IWindow).addEventListener(WindowEvent.WE_ENABLED, this._scrollBarEventProcBound);
                (this._scrollBarRef as unknown as IWindow).addEventListener(WindowEvent.WE_DISABLED, this._scrollBarEventProcBound);
            }
        }

        return this._scrollBarRef;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ScrollableItemListWindow.as::get iterator()
    public override iterator(): IIterator | null 
    {
        if(this.isConstructionReady()) 
        {
            return this.itemList!.iterator();
        }

        return null;
    }

    /**
     * Arranges items in the list.
     */
    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::arrangeListItems()
    public arrangeListItems(): void 
    {
        this.itemList?.arrangeListItems();
    }

    public arrangeItems(): void 
    {
        this.itemList?.arrangeItems();
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::addListItem()
    public addListItem(item: IWindow): IWindow 
    {
        return this.itemList?.addListItem(item) ?? item;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::addListItemAt()
    public addListItemAt(item: IWindow, index: number): IWindow 
    {
        return this.itemList?.addListItemAt(item, index) ?? item;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::getListItemAt()
    public getListItemAt(index: number): IWindow | null 
    {
        return this.itemList?.getListItemAt(index) ?? null;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::getListItemByName()
    public getListItemByName(name: string): IWindow | null 
    {
        return this.itemList?.getListItemByName(name) ?? null;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::getListItemByID()
    public getListItemByID(id: number): IWindow | null 
    {
        return this.itemList?.getListItemByID(id) ?? null;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::getListItemByTag()
    public getListItemByTag(tag: string): IWindow | null 
    {
        return this.itemList?.getListItemByTag(tag) ?? null;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::getListItemIndex()
    public getListItemIndex(item: IWindow): number 
    {
        return this.itemList?.getListItemIndex(item) ?? -1;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::removeListItem()
    public removeListItem(item: IWindow): IWindow | null 
    {
        return this.itemList?.removeListItem(item) ?? null;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::removeListItemAt()
    public removeListItemAt(index: number): IWindow | null 
    {
        return this.itemList?.removeListItemAt(index) ?? null;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::removeListItems()
    public removeListItems(): void 
    {
        this.itemList?.removeListItems();
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::destroyListItems()
    public destroyListItems(): void 
    {
        this.itemList?.destroyListItems();
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::setListItemIndex()
    public setListItemIndex(item: IWindow, index: number): void 
    {
        this.itemList?.setListItemIndex(item, index);
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::swapListItems()
    public swapListItems(a: IWindow, b: IWindow): void 
    {
        this.itemList?.swapListItems(a, b);
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::swapListItemsAt()
    public swapListItemsAt(indexA: number, indexB: number): void 
    {
        this.itemList?.swapListItemsAt(indexA, indexB);
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::groupListItemsWithID()
    public groupListItemsWithID(id: number, result: IWindow[], depth: number = 0): number 
    {
        return this.itemList?.groupListItemsWithID(id, result, depth) ?? 0;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::groupListItemsWithTag()
    public groupListItemsWithTag(tag: string, result: IWindow[], depth: number = 0): number 
    {
        return this.itemList?.groupListItemsWithTag(tag, result, depth) ?? 0;
    }

    public populate(items: IWindow[]): void 
    {
        this.itemList?.populate(items);
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::scrollWithWheel()
    public scrollWithWheel(delta: number, useHorizontal: boolean): boolean 
    {
        return this.itemList?.scrollWithWheel(delta, useHorizontal) ?? false;
    }

    public override getLayoutChildTarget(): IWindow 
    {
        return this.itemList as unknown as IWindow ?? this;
    }

    public override dispose(): void 
    {
        if(this._disposed) return;

        if(this._scrollBarRef) 
        {
            (this._scrollBarRef as unknown as IWindow).removeEventListener(WindowEvent.WE_ENABLED, this._scrollBarEventProcBound);
            (this._scrollBarRef as unknown as IWindow).removeEventListener(WindowEvent.WE_DISABLED, this._scrollBarEventProcBound);
        }

        this._scrollBarRef = null;
        this._itemListRef = null;

        super.dispose();
    }

    // something else (e.g. a button click) forces a recalculation.
    protected override finalize(): void 
    {
        super.finalize();

        const scrollBar = this.scrollBar;
        const itemList = this.itemList;

        if(scrollBar && itemList) 
        {
            scrollBar.scrollable = itemList;

            if(scrollBar.testStateFlag(32) && this._autoHideScrollBar)
            {
                this.hideScrollBar();
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ScrollableItemListWindow.as::isConstructionReady()
    protected isConstructionReady(): boolean 
    {
        return this.itemList !== null && this.scrollBar !== null;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::scrollBarEventProc()
    private scrollBarEventProc(event: WindowEvent): void 
    {
        if(event.type === 'WE_ENABLED') 
        {
            this.showScrollBar();
        }
        else if(event.type === 'WE_DISABLED' && this._autoHideScrollBar) 
        {
            this.hideScrollBar();
        }
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::hideScrollBar()
    private hideScrollBar(): void 
    {
        const scrollBar = this.scrollBar;
        const itemList = this.itemList;

        if(scrollBar && itemList && (scrollBar as unknown as IWindow).visible) 
        {
            (scrollBar as unknown as IWindow).visible = false;
            (itemList as unknown as IWindow).width = this.width;
        }
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::showScrollBar()
    private showScrollBar(): void 
    {
        const scrollBar = this.scrollBar;
        const itemList = this.itemList;

        if(scrollBar && itemList && !(scrollBar as unknown as IWindow).visible) 
        {
            (scrollBar as unknown as IWindow).visible = true;
            (itemList as unknown as IWindow).width = this.width - (scrollBar as unknown as IWindow).width;
        }
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemListWindow.as::updateScrollBarVisibility()
    private updateScrollBarVisibility(force: boolean = false): void 
    {
        const scrollBar = this.scrollBar;

        if(!scrollBar) return;

        if(this._autoHideScrollBar) 
        {
            if(scrollBar.testStateFlag(32)) 
            {
                this.hideScrollBar();
            }
        }
        else if(force || (scrollBar as unknown as IWindow).visible) 
        {
            this.showScrollBar();
        }
    }
}
