import type {IDisposable} from '@ambreia/common/IDisposable';
import type {IWindow} from '../../../IWindow';
import type {IWindowContainer} from '../../../IWindowContainer';
import type {IItemListWindow} from '../../../components/IItemListWindow';
import type {IScrollableListWindow} from '../../../components/IScrollableListWindow';
import type {IScrollableWindow} from '../../../components/IScrollableWindow';
import type {IRegionWindow} from '../../../components/IRegionWindow';
import type {ITextWindow} from '../../../components/ITextWindow';
import type {IWindowManager} from '../../IWindowManager';
import {DeBouncer} from '../DeBouncer';

import {CellTemplate} from './CellTemplate';
import type {ITableObject} from './ITableObject';
import type {TableColumn} from './TableColumn';
import {TableRowModel} from './TableRowModel';
import {TableRowView} from './TableRowView';
import type {ITableRowViewState} from './TableViewContracts';
import {WindowEvent} from '../../../events/WindowEvent';

type Rectangle = {x: number; y: number; width: number; height: number};
type RowCallback = (object: ITableObject | null) => void;
type CellEditCallback = (object: ITableObject, columnId: string, value: string) => void;

// The `table_items` window is a scrollable item list: it carries both the item-list methods
// (IScrollableListWindow) and the scroll geometry (IScrollableWindow: scrollV/visibleRegion). The AS3
// IScrollableListWindow exposes both; the port splits them across two interfaces, so intersect them.
type ScrollableTable = IScrollableListWindow & IScrollableWindow;

/**
 * TableView — a virtualized, column-driven data table. Builds the `table_view_xml` window, keeps an
 * optional header + splitter, and renders only the visible row window views (lazily chunked around the
 * scroll viewport with a buffer), recycling off-screen row views into a pool. Supports row
 * selection/hover, per-cell inline editing, and empty-state text.
 *
 * Port note: AS3 builds via windowManager.buildFromXML(assets.getAssetByName("table_view_xml")); the
 * port uses windowManager.buildWidgetLayout('table_view_xml') (the registry equivalent). flash Timer
 * is replaced by DeBouncer (setTimeout-backed); Dictionary → Map; Rectangle → {x,y,width,height}.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/tableview/TableView.as
 */
export class TableView implements IDisposable
{
    // AS3: TableView.as::SKIP_SCROLL_RESIZE
    private static readonly SKIP_SCROLL_RESIZE: number = 500;

    // AS3: TableView.as::LAZY_CHUNKING
    private static readonly LAZY_CHUNKING: number = 30;

    // AS3: TableView.as::LAZY_CHUNKING_MINIMAL
    private static readonly LAZY_CHUNKING_MINIMAL: number = 8;

    // AS3: TableView.as::SCROLL_BUFFER
    private static readonly SCROLL_BUFFER: number = 24;

    // AS3: TableView.as::SCROLL_BUFFER_MINIMAL
    private static readonly SCROLL_BUFFER_MINIMAL: number = 2;

    // AS3: TableView.as::SCROLLBAR_OFFSET
    private static readonly SCROLLBAR_OFFSET: number = 21;

    // AS3: TableView.as::_SafeStr_8288 (name derived: recycled row-view pool)
    private _rowViewPool: ITableRowViewState[] = [];

    // AS3: TableView.as::_disposed
    private _disposed: boolean = false;

    // AS3: TableView.as::_SafeStr_5267 (name derived: initialized flag)
    private _initialized: boolean = false;

    // AS3: TableView.as::_parent
    private _parent: IWindowContainer;

    // AS3: TableView.as::_container
    private _container: IWindowContainer;

    // AS3: TableView.as::_SafeStr_5265 (name derived: title row)
    private _titleRow: IItemListWindow = null as unknown as IItemListWindow;

    // AS3: TableView.as::_SafeStr_6083 (name derived: header/body splitter)
    private _splitter: IWindowContainer = null as unknown as IWindowContainer;

    // AS3: TableView.as::_SafeStr_7226 (name derived: title-cell template)
    private _titleCellTemplate: ITextWindow = null as unknown as ITextWindow;

    // AS3: TableView.as::_SafeStr_5742 (name derived: row template)
    private _rowTemplate: IItemListWindow = null as unknown as IItemListWindow;

    // AS3: TableView.as::_SafeStr_9898 (name derived: cell template)
    private _cellTemplate: CellTemplate = null as unknown as CellTemplate;

    // AS3: TableView.as::_SafeStr_5033 (name derived: columns)
    private _columns: TableColumn[] = null as unknown as TableColumn[];

    // AS3: TableView.as::_rowModels
    private _rowModels: TableRowModel[] = null as unknown as TableRowModel[];

    // AS3: TableView.as::_SafeStr_6257 (name derived: rows by identifier)
    private _rowsByIdentifier: Map<string, TableRowModel> = null as unknown as Map<string, TableRowModel>;

    // AS3: TableView.as::_canSelect
    private _canSelect: boolean = false;

    // AS3: TableView.as::_onRowClickedCallback
    private _onRowClickedCallback: RowCallback | null = null;

    // AS3: TableView.as::_onRowSelectedCallback
    private _onRowSelectedCallback: RowCallback | null = null;

    // AS3: TableView.as::_onRowHoverCallback
    private _onRowHoverCallback: RowCallback | null = null;

    // AS3: TableView.as::_onCellEditCallback
    private _onCellEditCallback: CellEditCallback | null = null;

    // AS3: TableView.as::_SafeStr_8710 (name derived: show header)
    private _showHeader: boolean = true;

    // AS3: TableView.as::_SafeStr_7926 (name derived: scroll-bar visible)
    private _scrollBarVisible: boolean = false;

    // AS3: TableView.as::_SafeStr_4907 (name derived: selected row)
    private _selectedRow: TableRowModel | null = null;

    // AS3: TableView.as::_SafeStr_5028 (name derived: hovered row)
    private _hoveredRow: TableRowModel | null = null;

    // AS3: TableView.as::_ignoreListeners
    private _ignoreListeners: boolean = false;

    // AS3: TableView.as::_SafeStr_7227 (name derived: row-view management debouncer)
    private _debouncer: DeBouncer;

    // AS3: TableView.as::_forceUpdate
    private _forceUpdate: boolean = false;

    // AS3: TableView.as::_minimalResourcesMode
    private _minimalResourcesMode: boolean = false;

    // AS3: TableView.as::_SafeStr_5875 (name derived: reset-scroll-on-next-update)
    private _resetScrollNextUpdate: boolean = false;

    // AS3: TableView.as::TableView()
    constructor(windowManager: IWindowManager, parent: IWindowContainer, pinnable: boolean = false, minimalResourcesMode: boolean = false)
    {
        this._parent = parent;
        this._debouncer = new DeBouncer(150, 300, () => this.manageRowViews());
        this._minimalResourcesMode = minimalResourcesMode;
        this._container = windowManager.buildWidgetLayout('table_view_xml') as unknown as IWindowContainer;
        parent.addChild(this._container);
        this._titleRow = this._container.findChildByName('table_titlerow') as unknown as IItemListWindow;
        this._splitter = this._container.findChildByName('splitter') as unknown as IWindowContainer;
        this.tableContents.removeListItem(this._titleRow as unknown as IWindow);
        this.tableContents.removeListItem(this._splitter as unknown as IWindow);
        this._titleCellTemplate = this._titleRow.removeListItemAt(0) as unknown as ITextWindow;
        this._rowTemplate = this.tableItems.removeListItemAt(1) as unknown as IItemListWindow;
        this._cellTemplate = new CellTemplate(this._rowTemplate.removeListItemAt(0) as unknown as IRegionWindow);
        this._container.width = parent.width;
        this._container.height = parent.height;
        this.updateTableItemsHeight();
        this.resizeHorizontally();
        this.updateEmptyText();

        if(pinnable)
        {
            this._container.setParamFlag(2048, true);
        }

        this.tableContents.addEventListener(WindowEvent.WE_RESIZED, this._onTableContentsResized);
        (this.tableItems.findChildByTag('_ITEMLIST') as unknown as IWindow).addEventListener(WindowEvent.WE_SCROLL, this._onScrolled);
    }

    // AS3: TableView.as::initialize()
    initialize(columns: TableColumn[], showHeader: boolean = true, canSelect: boolean = true): void
    {
        if(this._initialized)
        {
            return;
        }

        this._canSelect = canSelect;
        this._rowViewPool = [];
        this._rowModels = [];
        this._rowsByIdentifier = new Map<string, TableRowModel>();
        this._showHeader = showHeader;

        if(showHeader)
        {
            this.tableContents.addListItemAt(this._titleRow as unknown as IWindow, 0);
            this.tableContents.addListItemAt(this._splitter as unknown as IWindow, 1);
        }
        else
        {
            this.updateTableItemsHeight();
            this.updateEmptyText();
        }

        this.initializeColumns(columns);
        this._initialized = true;
    }

    // AS3: TableView.as::updateTableItemsHeight()
    private updateTableItemsHeight(): void
    {
        this.tableItems.height = this.tableContents.height - (this._showHeader ? this._titleRow.height + this._splitter.height : 0);
        this.onScrollBarVisibilityMayHaveChanged();
    }

    // AS3: TableView.as::updateEmptyText()
    private updateEmptyText(): void
    {
        if(this._showHeader)
        {
            this.emptyTextContainer.y = this._titleRow.height + this._splitter.height;
            this.emptyTextContainer.height = this.tableContents.height - this.emptyTextContainer.y;
        }
        else
        {
            this.emptyTextContainer.y = 0;
            this.emptyTextContainer.height = this.tableContents.height;
        }

        this.emptyTextContainer.visible = this._rowModels == null || this._rowModels.length === 0;
    }

    // AS3: TableView.as::onTableContentsResized()
    private _onTableContentsResized = (): void =>
    {
        if(this._ignoreListeners)
        {
            return;
        }

        this.updateTableItemsHeight();
        this.manageRowViewsWithDebounce();
    };

    // AS3: TableView.as::onScrolled()
    private _onScrolled = (): void =>
    {
        if(this._ignoreListeners)
        {
            return;
        }

        this.manageRowViewsWithDebounce();
    };

    // AS3: TableView.as::initializeColumns()
    private initializeColumns(columns: TableColumn[]): void
    {
        this._columns = columns;

        for(const column of columns)
        {
            const titleCell = this._titleCellTemplate.clone() as unknown as ITextWindow;
            titleCell.text = column.columnName;
            titleCell.width = this.getCellWidth(column.id);
            titleCell.autoSize = column.alignment;
            this._titleRow.addListItem(titleCell as unknown as IWindow);
        }
    }

    // AS3: TableView.as::setObjects()
    setObjects(objects: ITableObject[], resetScroll: boolean = false): void
    {
        if(!this._initialized)
        {
            return;
        }

        if(objects.length === 0)
        {
            this.clear();
            return;
        }

        this._ignoreListeners = true;
        const previousCount = this._rowModels.length;
        let changed = false;
        const seen = new Set<TableRowModel>();
        const newModels: (TableRowModel | null)[] = [];

        for(const object of objects)
        {
            const existing = this.getRowForObject(object);

            if(existing != null)
            {
                existing.update(object);
                seen.add(existing);
                newModels.push(existing);
            }
            else
            {
                newModels.push(null);
            }
        }

        let selectionCleared = false;
        let hoverCleared = false;

        for(const model of this._rowModels)
        {
            if(!seen.has(model))
            {
                if(this._selectedRow === model)
                {
                    this._selectedRow = null;
                    selectionCleared = true;
                }

                if(this._hoveredRow === model)
                {
                    this._hoveredRow = null;
                    hoverCleared = true;
                }

                if(model.view != null)
                {
                    this.recycleRowView(model.view);
                    model.view = null;
                    this._forceUpdate = true;
                }

                changed = true;
                model.dispose();
            }
        }

        this._rowsByIdentifier = new Map<string, TableRowModel>();
        let i = 0;

        while(i < objects.length)
        {
            const object = objects[i];
            let model = newModels[i];

            if(model == null)
            {
                model = new TableRowModel(object, i);
                newModels[i] = model;
                changed = true;
            }

            this._rowsByIdentifier.set(object.identifier, model);

            if(model.i !== i)
            {
                changed = true;
            }

            i += 1;
        }

        this._rowModels = newModels as TableRowModel[];
        this._ignoreListeners = false;
        this._resetScrollNextUpdate = this._resetScrollNextUpdate || resetScroll;

        if(changed)
        {
            i = 0;

            while(i < this._rowModels.length)
            {
                this._rowModels[i].index = i;
                i += 1;
            }
        }

        if(changed || this._resetScrollNextUpdate)
        {
            this.manageRowViewsWithDebounce();
        }

        if(previousCount !== this._rowModels.length)
        {
            this.itemListAmountChanged();
        }

        if(selectionCleared && this._onRowSelectedCallback != null)
        {
            this._onRowSelectedCallback(null);
        }

        if(hoverCleared && this._onRowHoverCallback != null)
        {
            this._onRowHoverCallback(null);
        }
    }

    // AS3: TableView.as::manageRowViewsWithDebounce()
    manageRowViewsWithDebounce(): void
    {
        if(this.manageRowViews(true))
        {
            this._debouncer.trigger();
        }
    }

    // AS3: TableView.as::manageRowViews()
    private manageRowViews(dryRun: boolean = false): boolean
    {
        if(!dryRun && this._resetScrollNextUpdate)
        {
            this.tableItems.scrollV = 0;
            this._resetScrollNextUpdate = false;
            this._forceUpdate = true;
        }

        const firstItem = this.tableItems.getListItemAt(0)!;
        const lastItem = this.tableItems.getListItemAt(this.tableItems.numListItems - 1)!;
        const firstIndex = this.visibleRangeFirstIndex;
        const lastIndex = this.visibleRangeLastIndex;
        const rowHeight = Math.trunc(this._rowTemplate.height);
        const arranged: IWindow[] = [];
        arranged.push(firstItem);
        const topSpacer = firstIndex * rowHeight;
        const bottomSpacer = Math.max(0, this._rowModels.length - 1 - lastIndex) * rowHeight;
        let changed = this._forceUpdate || (this._rowModels.length < TableView.SKIP_SCROLL_RESIZE && (topSpacer !== firstItem.height || bottomSpacer !== lastItem.height));

        if(changed && dryRun)
        {
            return true;
        }

        for(const model of this._rowModels)
        {
            if(this.shouldBeVisible(model, firstIndex, lastIndex))
            {
                if(model.view == null)
                {
                    if(!dryRun)
                    {
                        model.view = this.createOrReuseTableRowView(model);
                    }

                    changed = true;
                }

                if(!dryRun)
                {
                    arranged.push(model.view!.container as unknown as IWindow);
                }
            }
            else if(model.view != null)
            {
                if(!dryRun)
                {
                    this.recycleRowView(model.view);
                    model.view = null;
                }

                changed = true;
            }
        }

        if(dryRun)
        {
            return changed || this._resetScrollNextUpdate;
        }

        arranged.push(lastItem);
        this._forceUpdate = false;
        this._ignoreListeners = true;

        if(changed)
        {
            this.tableItems.autoArrangeItems = false;
            const prevScrollableHeight = this.tableItems.scrollableRegion.height;
            const prevVisibleY = this.tableItems.visibleRegion.y;
            const prevScrollV = this.tableItems.scrollV;
            this.tableItems.removeListItems();
            firstItem.height = topSpacer;
            lastItem.height = bottomSpacer;
            let y = 0;

            for(const item of arranged)
            {
                item.y = y;
                this.tableItems.addListItem(item);
                y += item.height;
            }

            if(y !== prevScrollableHeight)
            {
                if(y > this.tableItems.height)
                {
                    this.tableItems.scrollV = prevVisibleY / (y - this.tableItems.height);
                }
                else
                {
                    lastItem.width = this.rowWidth;
                    this.tableItems.scrollV = 0;
                }
            }
            else
            {
                this.tableItems.scrollV = prevScrollV;
            }

            this.tableItems.autoArrangeItems = true;
            this.onScrollBarVisibilityMayHaveChanged();
        }

        this._ignoreListeners = false;
        return changed;
    }

    // AS3: TableView.as::scrollToTop()
    scrollToTop(): void
    {
        this.tableItems.scrollV = 0;
    }

    // AS3: TableView.as::shouldBeVisible()
    private shouldBeVisible(model: TableRowModel, firstIndex: number, lastIndex: number): boolean
    {
        return model.i >= firstIndex && model.i <= lastIndex;
    }

    // AS3: TableView.as::get visibleRangeFirstIndex()
    private get visibleRangeFirstIndex(): number
    {
        if(this._container == null)
        {
            return 0;
        }

        const rowHeight = Math.trunc(this._rowTemplate.height);
        const region = this.tableItems.visibleRegion;
        const regionY = Math.trunc(region.y);
        const rawIndex = Math.trunc(regionY / rowHeight);
        let index = Math.trunc(Math.min(rawIndex - 1, this._rowModels.length - this.tableItems.height / rowHeight));
        index -= this.scrollBuffer + (index % this.lazyChunking);
        return Math.max(0, index);
    }

    // AS3: TableView.as::get visibleRangeLastIndex()
    private get visibleRangeLastIndex(): number
    {
        if(this._container == null)
        {
            return 0;
        }

        const rowHeight = Math.trunc(this._rowTemplate.height);
        const region = this.tableItems.visibleRegion;
        const bottom = Math.trunc(region.y + region.height);
        const rawIndex = Math.trunc(bottom / rowHeight);
        const index = Math.min(rawIndex + 1, this._rowModels.length - 1);
        return Math.trunc(index + (this.scrollBuffer + this.lazyChunking - (index % this.lazyChunking)));
    }

    // AS3: TableView.as::get lazyChunking()
    private get lazyChunking(): number
    {
        return this._minimalResourcesMode ? TableView.LAZY_CHUNKING_MINIMAL : TableView.LAZY_CHUNKING;
    }

    // AS3: TableView.as::get scrollBuffer()
    // Preserved verbatim: AS3 returns the larger SCROLL_BUFFER in minimal mode and the smaller
    // SCROLL_BUFFER_MINIMAL otherwise (the opposite of lazyChunking) — kept as-is.
    private get scrollBuffer(): number
    {
        return this._minimalResourcesMode ? TableView.SCROLL_BUFFER : TableView.SCROLL_BUFFER_MINIMAL;
    }

    // AS3: TableView.as::clear()
    clear(): void
    {
        if(!this._initialized)
        {
            return;
        }

        this._ignoreListeners = true;
        const firstItem = this.tableItems.getListItemAt(0)!;
        const lastItem = this.tableItems.getListItemAt(this.tableItems.numListItems - 1)!;
        this.tableItems.removeListItems();
        firstItem.height = 0;
        lastItem.height = 0;
        this.tableItems.addListItem(firstItem);
        this.tableItems.addListItem(lastItem);
        this._ignoreListeners = false;

        for(const model of this._rowModels)
        {
            if(model.view != null)
            {
                this.recycleRowView(model.view);
                model.view = null;
            }

            model.dispose();
        }

        this._rowModels = [];
        this._rowsByIdentifier = new Map<string, TableRowModel>();

        if(this._selectedRow != null)
        {
            this._selectedRow = null;

            if(this._onRowSelectedCallback != null)
            {
                this._onRowSelectedCallback(null);
            }
        }

        if(this._hoveredRow != null)
        {
            this._hoveredRow = null;

            if(this._onRowHoverCallback != null)
            {
                this._onRowHoverCallback(null);
            }
        }

        this.itemListAmountChanged();
    }

    // AS3: TableView.as::resetScrollingNextUpdate()
    resetScrollingNextUpdate(): void
    {
        this._resetScrollNextUpdate = true;
    }

    // AS3: TableView.as::recycleRowView()
    private recycleRowView(rowView: ITableRowViewState): void
    {
        rowView.recycle();
        this._rowViewPool.push(rowView);
    }

    // AS3: TableView.as::createOrReuseTableRowView()
    private createOrReuseTableRowView(model: TableRowModel): ITableRowViewState
    {
        let rowView: ITableRowViewState;

        if(this._rowViewPool.length > 0)
        {
            rowView = this._rowViewPool.pop()!;
            rowView.reuse(model);
            rowView.updateWidth();
        }
        else
        {
            rowView = new TableRowView(this, model);
        }

        return rowView;
    }

    // AS3: TableView.as::itemListAmountChanged()
    private itemListAmountChanged(): void
    {
        this.onScrollBarVisibilityMayHaveChanged();
        this.updateEmptyText();
    }

    // AS3: TableView.as::onScrollBarVisibilityMayHaveChanged()
    private onScrollBarVisibilityMayHaveChanged(): void
    {
        const wasVisible = this._scrollBarVisible;
        this._scrollBarVisible = this.tableItems.isScrollBarVisible;

        if(wasVisible !== this._scrollBarVisible)
        {
            this.resizeHorizontally();
        }
    }

    // AS3: TableView.as::resizeHorizontally()
    resizeHorizontally(): void
    {
        this._container.width = this._parent.width;
        this._titleRow.width = this.rowWidth;
        this._splitter.width = this.rowWidth;
        const count = this._titleRow.numListItems;
        let i = 0;

        while(i < count)
        {
            const titleCell = this._titleRow.getListItemAt(i) as unknown as ITextWindow;
            titleCell.width = this.getCellWidth(this._columns[i].id);
            i++;
        }

        // `?? []` is not defensive padding — it is the AS3 semantics. The constructor calls this
        // before `initialize()` has assigned `_rowModels`, and AS3's `for each (… in null)` is a
        // silent no-op where `for…of null` throws. Without it, `new TableView()` dies here every
        // single time, taking both room choosers and all six wired-menu tables with it.
        for(const model of this._rowModels ?? [])
        {
            if(model.view != null)
            {
                model.view.updateWidth();
            }
        }
    }

    // AS3: TableView.as::getColumnById()
    getColumnById(columnId: string): TableColumn
    {
        for(const column of this._columns)
        {
            if(column.id === columnId)
            {
                return column;
            }
        }

        return null as unknown as TableColumn;
    }

    // AS3: TableView.as::getRowForObject()
    private getRowForObject(object: ITableObject): TableRowModel | null
    {
        return this._rowsByIdentifier.get(object.identifier) ?? null;
    }

    // AS3: TableView.as::getIndexOfObject()
    getIndexOfObject(object: ITableObject | null): number
    {
        if(object == null)
        {
            return -1;
        }

        const model = this.getRowForObject(object);

        if(model == null)
        {
            return -1;
        }

        return model.i;
    }

    // AS3: TableView.as::getObjectByIndex()
    getObjectByIndex(index: number): ITableObject | null
    {
        if(index < 0 || index >= this._rowModels.length)
        {
            return null;
        }

        return this._rowModels[index].object;
    }

    // AS3: TableView.as::trySelect()
    trySelect(object: ITableObject | null, fireClick: boolean = false): void
    {
        if(this._onRowClickedCallback && fireClick)
        {
            this._onRowClickedCallback(object);
        }

        if(!this._canSelect)
        {
            return;
        }

        if(this._selectedRow != null && object != null && this._selectedRow.object === object)
        {
            return;
        }

        let changed = false;

        if(this._selectedRow != null)
        {
            this._selectedRow.selected = false;
            this._selectedRow = null;
            changed = true;
        }

        if(object != null)
        {
            const model = this.getRowForObject(object);

            if(model != null)
            {
                model.selected = true;
                this._selectedRow = model;
                changed = true;
            }
        }

        if(changed && this._onRowSelectedCallback != null)
        {
            this._onRowSelectedCallback(this._selectedRow?.object ?? null);
        }
    }

    // AS3: TableView.as::onHover()
    onHover(object: ITableObject | null): void
    {
        if(this._hoveredRow != null && object != null && this._hoveredRow.object === object)
        {
            return;
        }

        let changed = false;

        if(this._hoveredRow != null)
        {
            this._hoveredRow.hovered = false;
            this._hoveredRow = null;
            changed = true;
        }

        if(object != null)
        {
            const model = this.getRowForObject(object);

            if(model != null)
            {
                model.hovered = true;
                this._hoveredRow = model;
                changed = true;
            }
        }

        if(changed && this._onRowHoverCallback != null)
        {
            this._onRowHoverCallback(this._hoveredRow?.object ?? null);
        }
    }

    // AS3: TableView.as::getGlobalRowRectangle()
    getGlobalRowRectangle(object: ITableObject): Rectangle | null
    {
        const model = this.getRowForObject(object);

        if(model == null || model.view == null)
        {
            return null;
        }

        const rect: Rectangle = {x: 0, y: 0, width: 0, height: 0};
        (model.view.container as unknown as IWindow).getGlobalRectangle(rect);
        return rect;
    }

    // AS3: TableView.as::get selected()
    get selected(): ITableObject | null
    {
        if(this._selectedRow == null)
        {
            return null;
        }

        return this._selectedRow.object;
    }

    // AS3: TableView.as::get size()
    get size(): number
    {
        return this._rowModels.length;
    }

    // AS3: TableView.as::onEnterNewCellValue()
    onEnterNewCellValue(value: string, object: ITableObject, columnId: string): void
    {
        if(this._onCellEditCallback != null)
        {
            this._onCellEditCallback(object, columnId, value);
        }
    }

    // AS3: TableView.as::get rowWidth()
    get rowWidth(): number
    {
        return this.tableContents.width - (this._scrollBarVisible ? TableView.SCROLLBAR_OFFSET : 0);
    }

    // AS3: TableView.as::getCellWidth()
    getCellWidth(columnId: string): number
    {
        return Math.trunc(this.rowWidth * this.getColumnById(columnId).widthFactor);
    }

    // AS3: TableView.as::get columns()
    get columns(): TableColumn[]
    {
        return this._columns;
    }

    // AS3: TableView.as::get rowTemplate()
    get rowTemplate(): IItemListWindow
    {
        return this._rowTemplate;
    }

    // AS3: TableView.as::get cellTemplate()
    get cellTemplate(): CellTemplate
    {
        return this._cellTemplate;
    }

    // AS3: TableView.as::set onRowSelectedCallback()
    set onRowSelectedCallback(callback: RowCallback | null)
    {
        this._onRowSelectedCallback = callback;
    }

    // AS3: TableView.as::set onRowClickedCallback()
    set onRowClickedCallback(callback: RowCallback | null)
    {
        this._onRowClickedCallback = callback;
    }

    // AS3: TableView.as::set onRowHoveredCallback()
    set onRowHoveredCallback(callback: RowCallback | null)
    {
        this._onRowHoverCallback = callback;
    }

    // AS3: TableView.as::set onCellEditCallback()
    set onCellEditCallback(callback: CellEditCallback | null)
    {
        this._onCellEditCallback = callback;
    }

    // AS3: TableView.as::get rowCount()
    get rowCount(): number
    {
        return this._rowModels.length;
    }

    // AS3: TableView.as::dispose()
    dispose(): void
    {
        if(this._disposed)
        {
            return;
        }

        this._debouncer.dispose();
        this._debouncer = null as unknown as DeBouncer;
        this.clear();
        this._initialized = false;
        this._container.dispose();
        this._container = null as unknown as IWindowContainer;
        this._parent = null as unknown as IWindowContainer;
        this._titleRow = null as unknown as IItemListWindow;
        this._splitter = null as unknown as IWindowContainer;
        this._titleCellTemplate.dispose();
        this._titleCellTemplate = null as unknown as ITextWindow;
        this._rowTemplate.dispose();
        this._rowTemplate = null as unknown as IItemListWindow;
        this._columns = null as unknown as TableColumn[];
        this._onRowHoverCallback = null;
        this._onRowSelectedCallback = null;
        this._onRowClickedCallback = null;
        this._onCellEditCallback = null;
        this._disposed = true;
    }

    // AS3: TableView.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: TableView.as::get tableContents()
    private get tableContents(): IItemListWindow
    {
        return this._container.findChildByName('table_contents') as unknown as IItemListWindow;
    }

    // AS3: TableView.as::get tableItems()
    private get tableItems(): ScrollableTable
    {
        return this._container.findChildByName('table_items') as unknown as ScrollableTable;
    }

    // AS3: TableView.as::get emptyTextContainer()
    private get emptyTextContainer(): IWindowContainer
    {
        return this._container.findChildByName('empty_container') as unknown as IWindowContainer;
    }
}
