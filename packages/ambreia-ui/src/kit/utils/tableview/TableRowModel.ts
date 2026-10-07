import type {IDisposable} from '@ambreia/common/IDisposable';
import type {ITableObject} from './ITableObject';
import type {TableRowView} from './TableRowView';

/**
 * TableRowModel — the per-row state in a TableView: the row's data object, its index, and the
 * selected/hovered/focus flags. Setters notify the attached TableRowView so it can repaint. Detached
 * from a concrete view (a recycled model may have no view).
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/tableview/TableRowModel.as
 */
export class TableRowModel implements IDisposable
{
    // AS3: TableRowModel.as::_disposed
    private _disposed: boolean = false;

    // AS3: TableRowModel.as::_SafeStr_5216 (name derived: the row's data object)
    private _object: ITableObject;

    // AS3: TableRowModel.as::_SafeStr_6665 (name derived: row index)
    private _index: number;

    // AS3: TableRowModel.as::_selected
    private _selected: boolean = false;

    // AS3: TableRowModel.as::_SafeStr_5943 (name derived: is-hovered)
    private _hovered: boolean = false;

    // AS3: TableRowModel.as::_hasFocus
    private _hasFocus: boolean = false;

    // AS3: TableRowModel.as::_SafeStr_4550 (name derived: the row view)
    private _view: TableRowView | null = null;

    // AS3: TableRowModel.as::TableRowModel()
    constructor(object: ITableObject, index: number)
    {
        this._object = object;
        this._index = index;
    }

    // AS3: TableRowModel.as::set index()
    set index(value: number)
    {
        this._index = value;

        if(this._view != null)
        {
            this._view.indexUpdated();
        }
    }

    // AS3: TableRowModel.as::update()
    update(object: ITableObject): void
    {
        if(!object.isUpdated(this._object))
        {
            this._object = object;
            return;
        }

        const old = this._object;
        this._object = object;

        if(this._view != null)
        {
            this._view.objectUpdated(old, object);
        }
    }

    // AS3: TableRowModel.as::set hasFocus()
    set hasFocus(value: boolean)
    {
        this._hasFocus = value;
    }

    // AS3: TableRowModel.as::set selected()
    set selected(value: boolean)
    {
        this._selected = value;

        if(this._view != null)
        {
            this._view.selectedUpdated();
        }
    }

    // AS3: TableRowModel.as::set hovered()
    set hovered(value: boolean)
    {
        this._hovered = value;

        if(this._view != null)
        {
            this._view.hovereddUpdated();
        }
    }

    // AS3: TableRowModel.as::set view()
    set view(value: TableRowView | null)
    {
        this._view = value;
    }

    // AS3: TableRowModel.as::get object()
    get object(): ITableObject
    {
        return this._object;
    }

    // AS3: TableRowModel.as::get i()
    get i(): number
    {
        return this._index;
    }

    // AS3: TableRowModel.as::get selected()
    get selected(): boolean
    {
        return this._selected;
    }

    // AS3: TableRowModel.as::get hovered()
    get hovered(): boolean
    {
        return this._hovered;
    }

    // AS3: TableRowModel.as::get hasFocus()
    get hasFocus(): boolean
    {
        return this._hasFocus;
    }

    // AS3: TableRowModel.as::get view()
    get view(): TableRowView | null
    {
        return this._view;
    }

    // AS3: TableRowModel.as::dispose()
    dispose(): void
    {
        if(this._disposed)
        {
            return;
        }

        this._object = null as unknown as ITableObject;
        this._index = 0;
        this._selected = false;
        this._hovered = false;
        this._hasFocus = false;

        if(this._view != null)
        {
            this._view.dispose();
            this._view = null;
        }

        this._disposed = true;
    }

    // AS3: TableRowModel.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }
}
