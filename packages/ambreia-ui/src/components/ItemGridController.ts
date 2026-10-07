import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import type {IItemGridWindow} from './IItemGridWindow';
import type {IItemListWindow} from './IItemListWindow';
import type {IIterator} from '../utils/IIterator';
import type {WindowController} from '../WindowController';
import type {WindowEvent} from '../events/WindowEvent';
import type {WindowMouseEvent} from '../events/WindowMouseEvent';
import type {PropertyStruct} from '../utils/PropertyStruct';
import {ItemListController} from './ItemListController';
import {ItemGridIterator} from '../iterators/ItemGridIterator';

/**
 * Controller for item grid windows.
 *
 * An item grid arranges children in a two-dimensional grid layout
 * by distributing items across column lists. Each column is an
 * IItemListWindow child of the parent ItemListController.
 *
 * In AS3, extends ItemListController. The grid stores items in
 * column sub-lists and provides grid-level indexing across them.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ItemGridController.as
 */
export class ItemGridController extends ItemListController implements IItemGridWindow
{
    private _hasCustomVerticalSpacing: boolean = false;
    private _isRebuilding: boolean = false;

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
        id: number = 0
    )
    {
        super(name, type, style, param, context, rect, parent, procedure, tags, properties, id);

        this._isHorizontal = (type !== 54);

        if(!this._isHorizontal)
        {
            throw new Error('Horizontal item grid not yet implemented!');
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ItemGridController.as::ItemGridController()
    protected override finalize(): void
    {
        super.finalize();

        this._scaleToFitItems = true;
        this._shouldRebuildGridOnResize = true;
    }

    private _containerResizeToColumns: boolean = false;

    /**
	 * Whether columns resize to fit content.
	 */
    // AS3: .../src/com/sulake/core/window/components/ItemGridController.as::get containerResizeToColumns()
    public get containerResizeToColumns(): boolean
    {
        return this._containerResizeToColumns;
    }

    // AS3: .../src/com/sulake/core/window/components/ItemGridController.as::set containerResizeToColumns()
    public set containerResizeToColumns(value: boolean)
    {
        this._containerResizeToColumns = value;
    }

    private _verticalSpacing: number = 0;

    /**
	 * Sets the vertical spacing for column sub-lists, overriding
	 * the default spacing value.
	 */
    public get verticalSpacing(): number
    {
        return this._verticalSpacing;
    }

    // AS3: .../src/com/sulake/core/window/components/ItemGridController.as::set verticalSpacing()
    public set verticalSpacing(value: number)
    {
        this._verticalSpacing = value;
        this._hasCustomVerticalSpacing = true;

        let count = this.numListItems;

        while(count-- > 0)
        {
            const col = this.getListItemAt(count) as unknown as IItemListWindow;

            if(col) col.spacing = value;
        }
    }

    // Non-default value (true) primed in finalize() rather than here, to
    // keep this field at its type-default while applyProperties() runs.
    private _shouldRebuildGridOnResize: boolean = false;

    /**
	 * Whether the grid should rebuild its structure on resize.
	 */
    // AS3: .../src/com/sulake/core/window/components/ItemGridController.as::get shouldRebuildGridOnResize()
    public get shouldRebuildGridOnResize(): boolean
    {
        return this._shouldRebuildGridOnResize;
    }

    // AS3: .../src/com/sulake/core/window/components/ItemGridController.as::set shouldRebuildGridOnResize()
    public set shouldRebuildGridOnResize(value: boolean)
    {
        this._shouldRebuildGridOnResize = value;
    }

    /**
	 * Sets the spacing for all column sub-lists.
	 */
    public override get spacing(): number
    {
        return super.spacing;
    }

    public override set spacing(value: number)
    {
        if(!this._hasCustomVerticalSpacing)
        {
            let count = this.numListItems;

            while(count-- > 0)
            {
                const col = this.getListItemAt(count) as unknown as IItemListWindow;

                if(col) col.spacing = value;
            }
        }

        super.spacing = value;
    }

    public override get background(): boolean
    {
        return super.background;
    }

    /**
	 * Propagates background setting to all column sub-lists.
	 */
    public override set background(value: boolean)
    {
        super.background = value;

        for(let i = 0; i < this.numListItems; i++)
        {
            const col = this.getListItemAt(i);

            if(col) col.background = value;
        }
    }

    public override get color(): number
    {
        return super.color;
    }

    /**
	 * Propagates color setting to all column sub-lists.
	 */
    public override set color(value: number)
    {
        super.color = value;

        for(let i = 0; i < this.numListItems; i++)
        {
            const col = this.getListItemAt(i);

            if(col) col.color = value;
        }
    }

    public override get autoArrangeItems(): boolean
    {
        return super.autoArrangeItems;
    }

    /**
	 * Propagates autoArrangeItems setting to all column sub-lists.
	 */
    public override set autoArrangeItems(value: boolean)
    {
        super.autoArrangeItems = value;

        for(let i = 0; i < this.numColumns; i++)
        {
            const col = this.getListItemAt(i) as unknown as IItemListWindow;

            if(col) col.autoArrangeItems = value;
        }
    }

    /**
	 * The number of columns in the grid.
	 */
    // AS3: .../src/com/sulake/core/window/components/ItemGridController.as::get numColumns()
    public get numColumns(): number
    {
        return this.numListItems;
    }

    /**
	 * The number of rows (max items in any column).
	 */
    // AS3: .../src/com/sulake/core/window/components/ItemGridController.as::get numRows()
    public get numRows(): number
    {
        let max = 0;

        for(let i = 0; i < this.numColumns; i++)
        {
            const col = this.getListItemAt(i) as unknown as IItemListWindow;

            if(col)
            {
                max = Math.max(max, col.numListItems);
            }
        }

        return max;
    }

    /**
	 * The total number of items across all columns.
	 */
    // AS3: .../src/com/sulake/core/window/components/ItemGridController.as::get numGridItems()
    public get numGridItems(): number
    {
        let count = 0;

        for(let i = this.numListItems - 1; i >= 0; i--)
        {
            const col = this.getListItemAt(i) as unknown as IItemListWindow;

            if(col) count += col.numListItems;
        }

        return count;
    }

    protected override get isScrollHorizontal(): boolean
    {
        return !this._isHorizontal;
    }

    public override get properties(): unknown[]
    {
        const props = super.properties;

        props.push(this.createProperty('container_resize_to_columns', this._containerResizeToColumns));

        return props;
    }

    public override set properties(value: unknown[])
    {
        for(const item of value)
        {
            const prop = item as PropertyStruct;

            if(prop.key === 'container_resize_to_columns')
            {
                this._containerResizeToColumns = !!prop.value;
            }
        }

        super.properties = value;
    }

    /**
	 * Returns an iterator over all grid items.
	 */
    public override iterator(): IIterator
    {
        return new ItemGridIterator(this);
    }

    /**
	 * Handles resize and wheel events.
	 */
    public override update(source: WindowController, event: WindowEvent): boolean
    {
        const result = super.update(source, event);

        switch(event.type)
        {
            case 'WE_RESIZED':
                if(this._shouldRebuildGridOnResize)
                {
                    this.rebuildGridStructure();
                }
                break;
            case 'WME_WHEEL':
            case 'WME_WHEEL_HORIZONTAL':
                this.scrollWithWheel(
                    this.getScrollWheelDelta(event as WindowMouseEvent) * 0.5,
                    event.type === 'WME_WHEEL_HORIZONTAL' || !!(event as WindowMouseEvent).shiftKey
                );

                return true;
        }

        return result;
    }

    /**
	 * Adds an item to the grid at the next available column position.
	 */
    // AS3: .../src/com/sulake/core/window/components/ItemGridController.as::addGridItem()
    public addGridItem(item: IWindow): IWindow
    {
        this.resolveColumnForNextItem(item);

        return item;
    }

    /**
	 * Adds an item at the specified grid index.
	 */
    // AS3: .../src/com/sulake/core/window/components/ItemGridController.as::addGridItemAt()
    public addGridItemAt(item: IWindow, index: number): IWindow
    {
        this.offsetGridItemsForwards(item, Math.min(this.numGridItems, index));

        return item;
    }

    /**
	 * Gets the item at the specified grid index.
	 */
    // AS3: .../src/com/sulake/core/window/components/ItemGridController.as::getGridItemAt()
    public getGridItemAt(index: number): IWindow | null
    {
        const col = this.resolveColumnByIndex(index);

        if(!col) return null;

        return col.getListItemAt(Math.floor(index / this.numColumns));
    }

    /**
	 * Gets the item with the specified ID by searching all columns.
	 */
    // AS3: .../src/com/sulake/core/window/components/ItemGridController.as::getGridItemByID()
    public getGridItemByID(id: number): IWindow | null
    {
        for(let i = 0; i < this.numColumns; i++)
        {
            const col = this.getListItemAt(i) as unknown as IItemListWindow;

            if(col)
            {
                const item = col.getListItemByID(id);

                if(item) return item;
            }
        }

        return null;
    }

    /**
	 * Gets the item with the specified name by searching all columns.
	 */
    // AS3: .../src/com/sulake/core/window/components/ItemGridController.as::getGridItemByName()
    public getGridItemByName(name: string): IWindow | null
    {
        for(let i = 0; i < this.numColumns; i++)
        {
            const col = this.getListItemAt(i) as unknown as IItemListWindow;

            if(col)
            {
                const item = col.getListItemByName(name);

                if(item) return item;
            }
        }

        return null;
    }

    /**
	 * Gets the item with the specified tag by searching all columns.
	 */
    // AS3: .../src/com/sulake/core/window/components/ItemGridController.as::getGridItemByTag()
    public getGridItemByTag(tag: string): IWindow | null
    {
        for(let i = 0; i < this.numColumns; i++)
        {
            const col = this.getChildAt(i) as unknown as IItemListWindow;

            if(col)
            {
                const item = col.getListItemByTag(tag);

                if(item) return item;
            }
        }

        return null;
    }

    /**
	 * Gets the grid index of the specified item.
	 */
    // AS3: .../src/com/sulake/core/window/components/ItemGridController.as::getGridItemIndex()
    public getGridItemIndex(item: IWindow): number
    {
        const col = this.resolveColumnByItem(item);

        if(!col) return -1;

        return col.getListItemIndex(item) * this.numColumns + this.getColumnIndex(col);
    }

    /**
	 * Removes an item from the grid, shifting subsequent items backwards.
	 */
    // AS3: .../src/com/sulake/core/window/components/ItemGridController.as::removeGridItem()
    public removeGridItem(item: IWindow): IWindow | null
    {
        const index = this.getGridItemIndex(item);

        if(index === -1) return null;

        const removed = this.offsetGridItemsBackwards(index);

        if(removed !== item)
        {
            throw new Error('Item grid is out of order!');
        }

        const col = this.resolveColumnByIndex(index);

        if(col)
        {
            if(!this._isHorizontal)
            {
                (col as unknown as IWindow).width = col.scrollableRegion.width;
            }
            else
            {
                (col as unknown as IWindow).height = col.scrollableRegion.height;
            }
        }

        return item;
    }

    /**
	 * Removes the item at the specified grid index.
	 */
    // AS3: .../src/com/sulake/core/window/components/ItemGridController.as::removeGridItemAt()
    public removeGridItemAt(index: number): IWindow | null
    {
        const item = this.getGridItemAt(index);

        if(!item) return null;

        return this.removeGridItem(item);
    }

    /**
	 * Sets the grid index of the specified item.
	 */
    // AS3: .../src/com/sulake/core/window/components/ItemGridController.as::setGridItemIndex()
    public setGridItemIndex(item: IWindow, index: number): void
    {
        if(this.removeGridItem(item) === null)
        {
            throw new Error('Item not found in grid!');
        }

        this.addGridItemAt(item, index);
    }

    /**
	 * Swaps two items in the grid (unimplemented per AS3).
	 */
    // AS3: .../src/com/sulake/core/window/components/ItemGridController.as::swapGridItems()
    public swapGridItems(_a: IWindow, _b: IWindow): void
    {
        throw new Error('ItemGridWindow / Unimplemented method!');
    }

    /**
	 * Swaps two items at the specified grid indices.
	 */
    // AS3: .../src/com/sulake/core/window/components/ItemGridController.as::swapGridItemsAt()
    public swapGridItemsAt(indexA: number, indexB: number): void
    {
        this.swapGridItems(this.getGridItemAt(indexA)!, this.getGridItemAt(indexB)!);
    }

    /**
	 * Removes all items from all columns without disposing them.
	 */
    // AS3: .../src/com/sulake/core/window/components/ItemGridController.as::removeGridItems()
    public removeGridItems(): void
    {
        for(let i = 0; i < this.numColumns; i++)
        {
            const col = this.getListItemAt(i) as unknown as IItemListWindow;

            if(col)
            {
                col.removeListItems();

                if(!this._isHorizontal)
                {
                    (col as unknown as IWindow).width = 0;
                }
                else
                {
                    (col as unknown as IWindow).height = 0;
                }
            }
        }
    }

    /**
	 * Removes and destroys all items from all columns, then destroys columns.
	 */
    // AS3: .../src/com/sulake/core/window/components/ItemGridController.as::destroyGridItems()
    public destroyGridItems(): void
    {
        for(let i = 0; i < this.numColumns; i++)
        {
            const col = this.getListItemAt(i) as unknown as IItemListWindow;

            if(col)
            {
                col.destroyListItems();

                if(!this._isHorizontal)
                {
                    (col as unknown as IWindow).width = 0;
                }
                else
                {
                    (col as unknown as IWindow).height = 0;
                }
            }
        }

        this.destroyListItems();
    }

    /**
	 * Populates the grid with the given items.
	 */
    public override populate(items: IWindow[]): void
    {
        const savedAutoArrange = this.autoArrangeItems;

        this.autoArrangeItems = false;

        let totalItems = this.numGridItems;
        let colCount = this.numColumns;

        for(const item of items)
        {
            if(colCount === 0)
            {
                this.addColumnForItem(item);
                colCount++;
            }
            else
            {
                let col: IItemListWindow | null;

                if(totalItems > 0)
                {
                    const lastCol = this.resolveColumnByIndex(totalItems > 0 ? totalItems - 1 : 0);
                    const lastColIndex = lastCol ? this.getListItemIndex(lastCol as unknown as IWindow) : -1;
                    const isLastColumn = lastColIndex > -1 ? lastColIndex === colCount - 1 : true;

                    if(isLastColumn && lastCol && lastCol.numListItems === 1)
                    {
                        if((lastCol as unknown as IWindow).right + item.width <= this._width)
                        {
                            this.addColumnForItem(item);
                            continue;
                        }
                    }

                    col = this.getListItemAt(isLastColumn ? 0 : lastColIndex + 1) as unknown as IItemListWindow;
                }
                else
                {
                    col = this.getListItemAt(0) as unknown as IItemListWindow;
                }

                if(col)
                {
                    col.addListItem(item);
                    totalItems++;

                    if(item.width > (col as unknown as IWindow).width)
                    {
                        (col as unknown as IWindow).width = item.width;
                    }

                    if(item.bottom > (col as unknown as IWindow).height)
                    {
                        (col as unknown as IWindow).height = item.bottom;
                    }
                }
            }
        }

        this.autoArrangeItems = savedAutoArrange;
    }

    /**
	 * Rebuilds the grid structure by extracting all items and re-adding them.
	 */
    // AS3: .../src/com/sulake/core/window/components/ItemGridController.as::rebuildGridStructure()
    public rebuildGridStructure(): void
    {
        if(this._isRebuilding) return;

        this._isRebuilding = true;

        let itemCount = this.numGridItems;
        const colCount = this.numColumns;
        const savedAutoArrange = this.autoArrangeItems;

        this.autoArrangeItems = false;

        const items: IWindow[] = [];

        while(itemCount > 0)
        {
            for(let c = 0; c < colCount; c++)
            {
                const col = this.getListItemAt(c) as unknown as IItemListWindow;

                if(col)
                {
                    const item = col.removeListItemAt(0);

                    if(item) items.push(item);

                    itemCount--;

                    if(itemCount < 1) break;
                }
            }
        }

        this.destroyListItems();
        this.autoArrangeItems = savedAutoArrange;

        for(const item of items)
        {
            this.addGridItem(item);
        }

        if(this._containerResizeToColumns)
        {
            let maxHeight = 0;

            for(let c = 0; c < this.numColumns; c++)
            {
                const col = this.getListItemAt(c) as unknown as IItemListWindow;

                if(col)
                {
                    col.autoArrangeItems = true;
                    (col as unknown as IWindow).height = col.scrollableRegion.height;
                    maxHeight = Math.max(maxHeight, (col as unknown as IWindow).height);
                }
            }

            if(this._container)
            {
                (this._container as unknown as IWindow).height = maxHeight;
            }
        }

        this._isRebuilding = false;
    }

    /**
	 * Gets the column number for a grid item index.
	 */
    // AS3: .../src/com/sulake/core/window/components/ItemGridController.as::getColumnNumberByItemIndex()
    public getColumnNumberByItemIndex(index: number): number
    {
        return index % this.numColumns;
    }

    /**
	 * Gets the row number for a grid item index.
	 */
    // AS3: .../src/com/sulake/core/window/components/ItemGridController.as::getRowNumberByItemIndex()
    public getRowNumberByItemIndex(index: number): number
    {
        return Math.floor(index / this.numColumns);
    }

    /**
	 * Gets the column index of a column sub-list.
	 */
    // AS3: .../src/com/sulake/core/window/components/ItemGridController.as::getColumnIndex()
    protected getColumnIndex(col: IItemListWindow): number
    {
        return this.getListItemIndex(col as unknown as IWindow);
    }

    /**
	 * Resolves the column sub-list for a given grid item index.
	 */
    // AS3: .../src/com/sulake/core/window/components/ItemGridController.as::resolveColumnByIndex()
    protected resolveColumnByIndex(index: number): IItemListWindow | null
    {
        return this.getListItemAt(index % this.numColumns) as unknown as IItemListWindow | null;
    }

    /**
	 * Finds which column contains the given item.
	 */
    // AS3: .../src/com/sulake/core/window/components/ItemGridController.as::resolveColumnByItem()
    protected resolveColumnByItem(item: IWindow): IItemListWindow | null
    {
        let i = this.numColumns;

        while(i-- > 0)
        {
            const col = this.getListItemAt(i) as unknown as IItemListWindow;

            if(col && col.getListItemIndex(item) > -1)
            {
                return col;
            }
        }

        return null;
    }

    /**
	 * Resolves or creates the column for the next item to be added.
	 */
    // AS3: .../src/com/sulake/core/window/components/ItemGridController.as::resolveColumnForNextItem()
    protected resolveColumnForNextItem(item: IWindow): IItemListWindow
    {
        if(this.numColumns === 0)
        {
            return this.addColumnForItem(item);
        }

        const totalItems = this.numGridItems;
        let col: IItemListWindow | null;

        if(totalItems > 0)
        {
            const lastCol = this.resolveColumnByIndex(totalItems > 0 ? totalItems - 1 : 0);
            const lastColIndex = lastCol ? this.getListItemIndex(lastCol as unknown as IWindow) : -1;
            const isLastColumn = lastColIndex > -1 ? lastColIndex === this.numColumns - 1 : true;

            if(isLastColumn && lastCol && lastCol.numListItems === 1)
            {
                if((lastCol as unknown as IWindow).right + item.width <= this._width)
                {
                    return this.addColumnForItem(item);
                }
            }

            col = this.getListItemAt(isLastColumn ? 0 : lastColIndex + 1) as unknown as IItemListWindow;
        }
        else
        {
            col = this.getListItemAt(0) as unknown as IItemListWindow;
        }

        if(col)
        {
            col.addListItem(item);

            if(item.width > (col as unknown as IWindow).width)
            {
                (col as unknown as IWindow).width = item.width;
            }

            if(item.bottom > (col as unknown as IWindow).height)
            {
                (col as unknown as IWindow).height = item.bottom;
            }
        }

        return col!;
    }

    /**
	 * Creates a new column sub-list for the given item.
	 */
    // AS3: .../src/com/sulake/core/window/components/ItemGridController.as::addColumnForItem()
    protected addColumnForItem(item: IWindow): IItemListWindow
    {
        const colName = this._name + '_COLUMN_' + this.numListItems;
        const colWidth = Math.max(item.width, 0);
        const colHeight = Math.max(item.height, 0);

        const col = this._context.create(
            colName,
            '',
            50,
            0,
            0x10 | 0x01,
            {x: 0, y: 0, width: colWidth, height: colHeight},
            this.listEventProc.bind(this) as (event: unknown, window: IWindow) => void,
            null,
            this.numListItems,
            ['_INTERNAL', '_EXCLUDE'],
            ''
        ) as unknown as IItemListWindow;

        col.isPartOfGridWindow = true;
        (col as unknown as IWindow).background = this.background;
        (col as unknown as IWindow).color = this.color;
        col.spacing = this._hasCustomVerticalSpacing ? this._verticalSpacing : this._spacing;

        this.addListItem(col as unknown as IWindow);
        col.addListItem(item);

        return col;
    }

    // AS3: .../src/com/sulake/core/window/components/ItemGridController.as::removeColumnAt()
    protected removeColumnAt(index: number): void
    {
        const col = this.removeListItemAt(index);

        if(col)
        {
            col.dispose();
        }
    }

    /**
	 * Event procedure for column sub-lists.
	 */
    // AS3: .../src/com/sulake/core/window/components/ItemGridController.as::listEventProc()
    protected listEventProc(_event: WindowEvent, _window: IWindow): void
    {
        // No-op per AS3
    }

    /**
	 * Drops a grid item that has destroyed itself.
	 *
	 * Dead in AS3: declared `protected`, overriding nothing from ItemListController, and passed
	 * to no `addEventListener()` in any of the three trees. Ported anyway so a subclass that
	 * does wire it gets the AS3 behaviour rather than an empty hook.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ItemGridController.as::listItemEventHandler()
    protected listItemEventHandler(event: WindowEvent): void
    {
        if(event.type === 'WE_DESTROYED')
        {
            this.removeGridItem(event.target as IWindow);
        }
    }

    /**
	 * Shifts grid items forwards to make room at the given index.
	 */
    // AS3: .../src/com/sulake/core/window/components/ItemGridController.as::offsetGridItemsForwards()
    protected offsetGridItemsForwards(item: IWindow, index: number): void
    {
        const totalItems = this.numGridItems;
        const colCount = this.numColumns;

        for(let c = 0; c < colCount; c++)
        {
            const col = this.getListItemAt(c) as unknown as IItemListWindow;

            if(col) col.autoArrangeItems = false;
        }

        if(totalItems <= index)
        {
            this.resolveColumnForNextItem(item);
        }
        else
        {
            let last = totalItems - 1;

            if(this.numRows === 1)
            {
                const lastItem = this.getGridItemAt(last);

                if(lastItem) this.resolveColumnForNextItem(lastItem);

                last--;
            }

            while(last >= index)
            {
                const shiftItem = this.getGridItemAt(last);
                const row = this.getRowNumberByItemIndex(last + 1);
                const targetCol = this.resolveColumnByIndex(last + 1);

                if(shiftItem && targetCol)
                {
                    targetCol.addListItemAt(shiftItem, row);
                }

                last--;
            }

            const insertCol = this.resolveColumnByIndex(index);

            if(insertCol)
            {
                insertCol.addListItemAt(item, Math.floor(index / this.numColumns));
            }
        }

        let maxHeight = 0;

        for(let c = 0; c < this.numColumns; c++)
        {
            const col = this.getListItemAt(c) as unknown as IItemListWindow;

            if(col)
            {
                col.autoArrangeItems = true;
                (col as unknown as IWindow).height = col.scrollableRegion.height;
                maxHeight = Math.max(maxHeight, (col as unknown as IWindow).height);
            }
        }

        if(this._container)
        {
            (this._container as unknown as IWindow).height = maxHeight;
        }
    }

    /**
	 * Shifts grid items backwards after removing from the given index.
	 * Returns the removed item.
	 */
    // AS3: .../src/com/sulake/core/window/components/ItemGridController.as::offsetGridItemsBackwards()
    protected offsetGridItemsBackwards(index: number): IWindow | null
    {
        const row = this.getRowNumberByItemIndex(index);
        const col = this.resolveColumnByIndex(index);

        if(!col) return null;

        const removed = col.removeListItemAt(row);

        if(!removed) return null;

        const totalItems = this.numGridItems;

        for(let c = 0; c < this.numColumns; c++)
        {
            const column = this.getListItemAt(c) as unknown as IItemListWindow;

            if(column) column.autoArrangeItems = false;
        }

        let current = index;

        while(current < totalItems)
        {
            const shiftRow = this.getRowNumberByItemIndex(current);
            const shiftItem = this.getGridItemAt(current + 1);
            const targetCol = this.resolveColumnByIndex(current);

            if(shiftItem && targetCol)
            {
                targetCol.addListItemAt(shiftItem, shiftRow);
            }

            current++;
        }

        let maxHeight = 0;

        for(let c = 0; c < this.numColumns; c++)
        {
            const column = this.getListItemAt(c) as unknown as IItemListWindow;

            if(column)
            {
                column.autoArrangeItems = true;
                (column as unknown as IWindow).height = column.scrollableRegion.height;
                maxHeight = Math.max(maxHeight, (column as unknown as IWindow).height);
            }
        }

        if(this._container)
        {
            (this._container as unknown as IWindow).height = maxHeight;
        }

        return removed;
    }
}
