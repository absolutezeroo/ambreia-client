import type {TableCell} from './TableCell';

/**
 * ITableObject — one row's data model in a TableView. Supplies a stable row identifier, a TableCell
 * per column id, and change-detection hooks the row model uses to decide whether a re-render is needed.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/tableview/ITableObject.as
 */
export interface ITableObject
{
    // AS3: ITableObject.as::get identifier()
    get identifier(): string;

    /**
     * `TableCell | null`, where AS3 declares a bare `:TableCell`.
     *
     * Object types are implicitly nullable in AS3, and every implementation there returns null from
     * its default branch, so the nullable signature is what the AS3 one actually means. Transcribed
     * non-nullable, it forced each implementation to launder its default branch through
     * `null as unknown as TableCell` and left `TableCellView` dereferencing a null it had been told
     * could not exist — which is a hard crash inside a window-manager update receiver, not a blank
     * cell. See `TableCellView.initializeView()`.
     */
    // AS3: ITableObject.as::getTableCell()
    getTableCell(columnId: string): TableCell | null;

    // AS3: ITableObject.as::isPropertyUpdated()
    isPropertyUpdated(columnId: string, other: object): boolean;

    // AS3: ITableObject.as::isUpdated()
    isUpdated(other: object): boolean;
}
