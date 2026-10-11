import type {IDisposable} from '@ambreia/common/IDisposable';
import type {IItemListWindow} from '../../../components/IItemListWindow';
import type {WindowMouseEvent} from '../../../events/WindowMouseEvent';
import type {CellTemplate} from './CellTemplate';
import type {ITableObject} from './ITableObject';
import type {TableColumn} from './TableColumn';

/** Narrow view contract used by row/cell renderers without depending on the concrete TableView. */
export interface ITableViewHost
{
    readonly rowTemplate: IItemListWindow;

    readonly columns: TableColumn[];

    readonly rowWidth: number;

    readonly cellTemplate: CellTemplate;

    getColumnById(columnId: string): TableColumn;

    getCellWidth(columnId: string): number;

    trySelect(object: ITableObject | null, fireClick?: boolean): void;

    onHover(object: ITableObject | null): void;

    onEnterNewCellValue(value: string, object: ITableObject, columnId: string): void;
}

/** What a cell needs from its parent row. */
export interface ITableRowInteractionHost
{

    readonly object: ITableObject | null;
    onDown(event: WindowMouseEvent): void;

    onHoverOver(event: WindowMouseEvent): void;

    onHoverOut(event: WindowMouseEvent): void;

    onClickAway(event: WindowMouseEvent): void;
}

/** What the row model/table need from a concrete row view. */
export interface ITableRowViewState extends ITableRowInteractionHost, IDisposable
{
    readonly container: IItemListWindow;

    indexUpdated(): void;

    objectUpdated(oldObject: ITableObject, newObject: ITableObject): void;

    selectedUpdated(): void;

    hovereddUpdated(): void;

    updateWidth(): void;

    recycle(): void;

    // `any` is intentional: the contract only needs a rebind hook and must not depend back on TableRowModel.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reuse(rowModel: any): void;
}
