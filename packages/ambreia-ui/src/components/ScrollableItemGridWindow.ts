import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import type {IScrollableGridWindow} from './IScrollableGridWindow';
import type {IItemGridWindow} from './IItemGridWindow';
import type {IScrollbarWindow} from './IScrollbarWindow';
import type {IScrollableWindow} from './IScrollableWindow';
import type {IIterator} from '../utils/IIterator';
import {ContainerController} from './ContainerController';
import {WindowEvent} from '../events/WindowEvent';

/**
 * Scrollable item grid window.
 *
 * Combines an item grid with a scrollbar. The scrollbar is automatically
 * bound to the item grid and can optionally auto-hide when not needed.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ScrollableItemGridWindow.as
 */
export class ScrollableItemGridWindow extends ContainerController implements IScrollableGridWindow
{
    private _itemGridRef: IItemGridWindow | null = null;
    private _scrollBarRef: IScrollbarWindow | null = null;
    private readonly _scrollBarEventProcBound: (event: WindowEvent) => void;

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

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ScrollableItemGridWindow.as::ScrollableItemGridWindow()
    // See ScrollableItemListWindow.ts's identical finalize() override comment: this.scrollBar/
    // this.itemGrid read named children built by buildLayoutChildren(), which only runs
    // later via completeConstruction() - at constructor time no children exist yet.
    protected override finalize(): void
    {
        super.finalize();

        if(this.scrollBar && this.itemGrid)
        {
            this.scrollBar.scrollable = this.itemGrid as unknown as IScrollableWindow;
        }

        if(this.scrollBar && this.scrollBar.testStateFlag(32))
        {
            this.hideScrollBar();
        }
    }

    private _autoHideScrollBar: boolean = true;

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::get autoHideScrollBar()
    public get autoHideScrollBar(): boolean
    {
        return this._autoHideScrollBar;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::set autoHideScrollBar()
    public set autoHideScrollBar(value: boolean)
    {
        this._autoHideScrollBar = value;
        this.updateScrollBarVisibility();
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::get scrollH()
    public get scrollH(): number
    {
        return this.itemGrid?.scrollH ?? 0;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::set scrollH()
    public set scrollH(value: number)
    {
        if(this.itemGrid) this.itemGrid.scrollH = value;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::get scrollV()
    public get scrollV(): number
    {
        return this.itemGrid?.scrollV ?? 0;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::set scrollV()
    public set scrollV(value: number)
    {
        if(this.itemGrid) this.itemGrid.scrollV = value;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::get maxScrollH()
    public get maxScrollH(): number
    {
        return this.itemGrid?.maxScrollH ?? 0;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::get maxScrollV()
    public get maxScrollV(): number
    {
        return this.itemGrid?.maxScrollV ?? 0;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::get visibleRegion()
    public get visibleRegion(): { x: number; y: number; width: number; height: number }
    {
        return this.itemGrid?.visibleRegion ?? {x: 0, y: 0, width: 0, height: 0};
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::get scrollableRegion()
    public get scrollableRegion(): { x: number; y: number; width: number; height: number }
    {
        return this.itemGrid?.scrollableRegion ?? {x: 0, y: 0, width: 0, height: 0};
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::get autoArrangeItems()
    public get autoArrangeItems(): boolean
    {
        return this.itemGrid?.autoArrangeItems ?? true;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::set autoArrangeItems()
    public set autoArrangeItems(value: boolean)
    {
        if(this.itemGrid) this.itemGrid.autoArrangeItems = value;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::get numColumns()
    public get numColumns(): number
    {
        return this.itemGrid?.numColumns ?? 0;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::get numRows()
    public get numRows(): number
    {
        return this.itemGrid?.numRows ?? 0;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::get numGridItems()
    public get numGridItems(): number
    {
        return this.itemGrid?.numGridItems ?? 0;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::get shouldRebuildGridOnResize()
    public get shouldRebuildGridOnResize(): boolean
    {
        return this.itemGrid?.shouldRebuildGridOnResize ?? true;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::set shouldRebuildGridOnResize()
    public set shouldRebuildGridOnResize(value: boolean)
    {
        if(this.itemGrid) this.itemGrid.shouldRebuildGridOnResize = value;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::get spacing()
    public get spacing(): number
    {
        return this.itemGrid?.spacing ?? 0;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::set spacing()
    public set spacing(value: number)
    {
        if(this.itemGrid) this.itemGrid.spacing = value;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::set verticalSpacing()
    public set verticalSpacing(value: number)
    {
        if(this.itemGrid) this.itemGrid.verticalSpacing = value;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::get scaleToFitItems()
    public get scaleToFitItems(): boolean
    {
        return this.itemGrid?.scaleToFitItems ?? false;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::set scaleToFitItems()
    public set scaleToFitItems(value: boolean)
    {
        if(this.itemGrid) this.itemGrid.scaleToFitItems = value;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::get resizeOnItemUpdate()
    public get resizeOnItemUpdate(): boolean
    {
        return this.itemGrid?.resizeOnItemUpdate ?? false;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::set resizeOnItemUpdate()
    public set resizeOnItemUpdate(value: boolean)
    {
        if(this.itemGrid) this.itemGrid.resizeOnItemUpdate = value;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::get containerResizeToColumns()
    public get containerResizeToColumns(): boolean
    {
        return false;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::set containerResizeToColumns()
    public set containerResizeToColumns(_value: boolean)
    {
        // No-op per AS3
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ScrollableItemGridWindow.as::get _itemGrid()
    protected get itemGrid(): IItemGridWindow | null
    {
        if(!this._itemGridRef)
        {
            this._itemGridRef = this.findChildByTag('_ITEMGRID') as unknown as IItemGridWindow | null;
        }

        return this._itemGridRef;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ScrollableItemGridWindow.as::get _scrollBar()
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

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ScrollableItemGridWindow.as::get iterator()
    public override iterator(): IIterator | null
    {
        if(this.isConstructionReady() && this.itemGrid)
        {
            return this.itemGrid.iterator();
        }

        return null;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::addGridItem()
    public addGridItem(item: IWindow): IWindow
    {
        return this.itemGrid!.addGridItem(item);
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::addGridItemAt()
    public addGridItemAt(item: IWindow, index: number): IWindow
    {
        return this.itemGrid!.addGridItemAt(item, index);
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::getGridItemAt()
    public getGridItemAt(index: number): IWindow | null
    {
        return this.itemGrid?.getGridItemAt(index) ?? null;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::getGridItemByID()
    public getGridItemByID(id: number): IWindow | null
    {
        return this.itemGrid?.getGridItemByID(id) ?? null;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::getGridItemByName()
    public getGridItemByName(name: string): IWindow | null
    {
        return this.itemGrid?.getGridItemByName(name) ?? null;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::getGridItemByTag()
    public getGridItemByTag(tag: string): IWindow | null
    {
        return this.itemGrid?.getGridItemByTag(tag) ?? null;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::getGridItemIndex()
    public getGridItemIndex(item: IWindow): number
    {
        return this.itemGrid?.getGridItemIndex(item) ?? -1;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::removeGridItem()
    public removeGridItem(item: IWindow): IWindow | null
    {
        return this.itemGrid?.removeGridItem(item) ?? null;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::removeGridItemAt()
    public removeGridItemAt(index: number): IWindow | null
    {
        return this.itemGrid?.removeGridItemAt(index) ?? null;
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::setGridItemIndex()
    public setGridItemIndex(item: IWindow, index: number): void
    {
        this.itemGrid?.setGridItemIndex(item, index);
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::swapGridItems()
    public swapGridItems(a: IWindow, b: IWindow): void
    {
        this.itemGrid?.swapGridItems(a, b);
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::swapGridItemsAt()
    public swapGridItemsAt(indexA: number, indexB: number): void
    {
        this.itemGrid?.swapGridItemsAt(indexA, indexB);
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::removeGridItems()
    public removeGridItems(): void
    {
        this.itemGrid?.removeGridItems();
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::destroyGridItems()
    public destroyGridItems(): void
    {
        this.itemGrid?.destroyGridItems();
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::rebuildGridStructure()
    public rebuildGridStructure(): void
    {
        this.itemGrid?.rebuildGridStructure();
    }

    /**
	 * Populates the grid with items.
	 */
    public populate(items: IWindow[]): void
    {
        this.itemGrid?.populate(items);
    }

    public override dispose(): void
    {
        if(this._disposed) return;

        if(this._scrollBarRef)
        {
            (this._scrollBarRef as unknown as IWindow).removeEventListener(WindowEvent.WE_ENABLED, this._scrollBarEventProcBound);
            (this._scrollBarRef as unknown as IWindow).removeEventListener(WindowEvent.WE_DISABLED, this._scrollBarEventProcBound);
            this._scrollBarRef = null;
        }

        if(this._itemGridRef)
        {
            this._itemGridRef = null;
        }

        super.dispose();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ScrollableItemGridWindow.as::isConstructionReady()
    protected isConstructionReady(): boolean
    {
        return !!(this.itemGrid && this.scrollBar);
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::hideScrollBar()
    private hideScrollBar(): void
    {
        const sb = this.scrollBar as unknown as IWindow | null;

        if(sb && sb.visible)
        {
            sb.visible = false;
        }
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::showScrollBar()
    private showScrollBar(): void
    {
        const sb = this.scrollBar as unknown as IWindow | null;

        if(sb && !sb.visible)
        {
            sb.visible = true;
        }
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::updateScrollBarVisibility()
    private updateScrollBarVisibility(): void
    {
        const sb = this.scrollBar as unknown as IWindow | null;

        if(!sb) return;

        if(this._autoHideScrollBar)
        {
            if(this.scrollBar!.testStateFlag(32) && sb.visible)
            {
                this.hideScrollBar();
            }
        }
        else
        {
            if(sb.visible)
            {
                this.showScrollBar();
            }
        }
    }

    // AS3: .../src/com/sulake/core/window/components/ScrollableItemGridWindow.as::scrollBarEventProc()
    private scrollBarEventProc(event: WindowEvent): void
    {
        if(event.type === 'WE_ENABLED')
        {
            this.showScrollBar();
        }
        else if(event.type === 'WE_DISABLED')
        {
            this.hideScrollBar();
        }
    }
}
