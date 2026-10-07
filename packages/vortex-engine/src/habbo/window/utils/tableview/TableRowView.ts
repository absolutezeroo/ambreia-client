import type {IDisposable} from '@ambreia/common/IDisposable';
import type {IWindow} from '@core/window/IWindow';
import type {IItemListWindow} from '@core/window/components/IItemListWindow';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';

import type {ITableObject} from './ITableObject';
import {TableCellView} from './TableCellView';
import type {TableRowModel} from './TableRowModel';
import type {TableView} from './TableView';

/**
 * TableRowView — the window view for one table row: an item-list container holding one TableCellView
 * per column. Paints the row background (selected/focused/zebra), and forwards mouse down/hover/
 * click-away to the parent TableView for selection & hover tracking. Recyclable (reuse() rebinds it to
 * a different row model without rebuilding the cell views).
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/tableview/TableRowView.as
 */
export class TableRowView implements IDisposable
{
    // AS3: TableRowView.as::_SafeStr_10411 (name derived: selected + focused row color)
    private static readonly ROW_COLOR_SELECTED_FOCUSED: number = 12116732;

    // AS3: TableRowView.as::_SafeStr_10304 (name derived: selected row color)
    private static readonly ROW_COLOR_SELECTED: number = 13750737;

    // AS3: TableRowView.as::_SafeStr_10322 (name derived: even row color)
    private static readonly ROW_COLOR_EVEN: number = 15395562;

    // AS3: TableRowView.as::_SafeStr_10325 (name derived: odd row color)
    private static readonly ROW_COLOR_ODD: number = 16382457;

    // AS3: TableRowView.as::_disposed
    private _disposed: boolean = false;

    // AS3: TableRowView.as::_SafeStr_5262 (name derived: parent table view)
    private _tableView: TableView;

    // AS3: TableRowView.as::_container
    private _container: IItemListWindow;

    // AS3: TableRowView.as::_SafeStr_5695 (name derived: cell views)
    private _cellViews: TableCellView[];

    // AS3: TableRowView.as::_SafeStr_4570 (name derived: the row model)
    private _rowModel: TableRowModel | null;

    // AS3: TableRowView.as::TableRowView()
    constructor(tableView: TableView, rowModel: TableRowModel)
    {
        this._tableView = tableView;
        this._rowModel = rowModel;
        this._container = tableView.rowTemplate.clone() as unknown as IItemListWindow;
        this._cellViews = [];
        this.updateWidth();

        for(const column of tableView.columns)
        {
            const cell = this._rowModel.object.getTableCell(column.id);
            const cellView = new TableCellView(tableView, this, column.id, cell);
            this._cellViews.push(cellView);
            this._container.addListItem(cellView.container as unknown as IWindow);
        }

        this.updateColor();
        this._container.addEventListener(WindowMouseEvent.DOWN, this.onDown);
        this._container.addEventListener(WindowMouseEvent.OVER, this.onHoverOver);
        this._container.addEventListener(WindowMouseEvent.OUT, this.onHoverOut);
        this._container.addEventListener(WindowMouseEvent.CLICK_AWAY, this.onClickAway);
    }

    // AS3: TableRowView.as::windowIsChild()
    // AS3 walks a `_SafeCls_2116.children` collection when present, else an IWindowContainer's
    // numChildren/getChildAt. The port has no `_SafeCls_2116`; walk list items when present (the row
    // container is an item list), else container children — duck-typed, covering both AS3 branches.
    private static windowIsChild(parent: IWindow | null, target: IWindow | null): boolean
    {
        if(parent === target)
        {
            return true;
        }

        if(parent == null)
        {
            return false;
        }

        const container = parent as unknown as {
            numListItems?: number;
            getListItemAt?: (index: number) => IWindow | null;
            numChildren?: number;
            getChildAt?: (index: number) => IWindow | null;
        };

        if(typeof container.numListItems === 'number' && typeof container.getListItemAt === 'function')
        {
            for(let i = 0; i < container.numListItems; i++)
            {
                if(TableRowView.windowIsChild(container.getListItemAt(i), target))
                {
                    return true;
                }
            }
        }
        else if(typeof container.numChildren === 'number' && typeof container.getChildAt === 'function')
        {
            for(let i = 0; i < container.numChildren; i++)
            {
                if(TableRowView.windowIsChild(container.getChildAt(i), target))
                {
                    return true;
                }
            }
        }

        return false;
    }

    // AS3: TableRowView.as::indexUpdated()
    indexUpdated(): void
    {
        this.updateColor();
    }

    // AS3: TableRowView.as::objectUpdated()
    objectUpdated(oldObject: ITableObject, newObject: ITableObject): void
    {
        let index = 0;

        for(const column of this._tableView.columns)
        {
            if(newObject.isPropertyUpdated(column.id, oldObject))
            {
                const cell = newObject.getTableCell(column.id);
                this._cellViews[index].update(cell);
            }

            index += 1;
        }
    }

    // AS3: TableRowView.as::reuse()
    reuse(rowModel: TableRowModel): void
    {
        this._rowModel = rowModel;
        let index = 0;

        for(const column of this._tableView.columns)
        {
            const cell = this._rowModel.object.getTableCell(column.id);
            this._cellViews[index].reuse(cell);
            index += 1;
        }

        this.updateColor();
    }

    // AS3: TableRowView.as::updateWidth()
    updateWidth(): void
    {
        if(this._container.width === this._tableView.rowWidth)
        {
            return;
        }

        this._container.width = this._tableView.rowWidth;

        for(const cellView of this._cellViews)
        {
            cellView.updateWidth();
        }
    }

    // AS3: TableRowView.as::updateColor()
    private updateColor(): void
    {
        if(this._rowModel == null)
        {
            return;
        }

        let color: number;

        if(this._rowModel.selected)
        {
            color = this._rowModel.hasFocus ? TableRowView.ROW_COLOR_SELECTED_FOCUSED : TableRowView.ROW_COLOR_SELECTED;
        }
        else
        {
            color = this._rowModel.i % 2 === 0 ? TableRowView.ROW_COLOR_EVEN : TableRowView.ROW_COLOR_ODD;
        }

        this._container.color = (0xFF000000 ^ color) >>> 0;
    }

    // AS3: TableRowView.as::onDown()
    onDown = (_event: WindowMouseEvent): void =>
    {
        if(this._rowModel == null)
        {
            return;
        }

        this._rowModel.hasFocus = true;
        this._tableView.trySelect(this._rowModel.object, true);
        this.updateColor();
    };

    // AS3: TableRowView.as::onHoverOver()
    onHoverOver = (_event: WindowMouseEvent): void =>
    {
        if(this._rowModel == null)
        {
            return;
        }

        if(!this._rowModel.hovered)
        {
            this._tableView.onHover(this._rowModel.object);
        }
    };

    // AS3: TableRowView.as::onHoverOut()
    onHoverOut = (_event: WindowMouseEvent): void =>
    {
        if(this._rowModel == null)
        {
            return;
        }

        if(this._rowModel.hovered)
        {
            this._tableView.onHover(null);
        }
    };

    // AS3: TableRowView.as::onClickAway()
    onClickAway = (event: WindowMouseEvent): void =>
    {
        if(this._rowModel == null)
        {
            return;
        }

        this._rowModel.hasFocus = TableRowView.windowIsChild(this._container as unknown as IWindow, event.related);
        this.updateColor();
    };

    // AS3: TableRowView.as::selectedUpdated()
    selectedUpdated(): void
    {
        this.updateColor();
    }

    // AS3: TableRowView.as::hovereddUpdated()
    hovereddUpdated(): void
    {
    }

    // AS3: TableRowView.as::get object()
    get object(): ITableObject | null
    {
        return this._rowModel?.object ?? null;
    }

    // AS3: TableRowView.as::get container()
    get container(): IItemListWindow
    {
        return this._container;
    }

    // AS3: TableRowView.as::recycle()
    recycle(): void
    {
        for(const cellView of this._cellViews)
        {
            cellView.recycle();
        }

        this._rowModel = null;
    }

    // AS3: TableRowView.as::dispose()
    dispose(): void
    {
        if(this._disposed)
        {
            return;
        }

        for(const cellView of this._cellViews)
        {
            cellView.dispose();
        }

        this._cellViews = null as unknown as TableCellView[];
        this._container.dispose();
        this._container = null as unknown as IItemListWindow;
        this._disposed = true;
    }

    // AS3: TableRowView.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }
}
