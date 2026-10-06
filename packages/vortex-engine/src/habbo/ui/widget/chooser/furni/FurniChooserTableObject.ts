import type {ITableObject} from '@habbo/window/utils/tableview/ITableObject';
import {TableCell} from '@habbo/window/utils/tableview/TableCell';
import type {ChooserItem} from '../ChooserItem';
import {FurniView} from './FurniView';

/**
 * One `ChooserItem` seen through the furni table: three cells against the user chooser's two,
 * and an identity keyed on **category** rather than type — a floor and a wall item can share an id.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chooser/furni/FurniChooserTableObject.as
 */
export class FurniChooserTableObject implements ITableObject
{
    // AS3: .../chooser/furni/FurniChooserTableObject.as::OWNERLESS_PLACEHOLDER
    // Name DERIVED: the "-" AS3 writes inline for an item with no meaningful owner.
    private static readonly OWNERLESS_PLACEHOLDER: string = '-';

    // AS3: .../chooser/furni/FurniChooserTableObject.as::_chooserItem
    private _chooserItem: ChooserItem;

    // AS3: .../chooser/furni/FurniChooserTableObject.as::FurniChooserTableObject()
    constructor(chooserItem: ChooserItem)
    {
        this._chooserItem = chooserItem;
    }

    // AS3: .../chooser/furni/FurniChooserTableObject.as::get chooserItem()
    get chooserItem(): ChooserItem
    {
        return this._chooserItem;
    }

    // AS3: .../chooser/furni/FurniChooserTableObject.as::get identifier()
    get identifier(): string
    {
        return `${this._chooserItem.category}-${this._chooserItem.id}`;
    }

    /**
     * The name and id cells are selectable; the owner cell is only selectable when it is a real
     * name. (AS3 also shows "-" for the Builders Club and wired-temporary id ranges; the RPG fork
     * removed both.)
     *
     * AS3 returns **null** for an unknown column; this port's `ITableObject` declares the return
     * non-null and `TableRowView` passes the cell straight on, so the default returns an empty
     * cell. The branch is unreachable — the table only asks for its three declared columns.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/chooser/furni/FurniChooserTableObject.as::getTableCell()
    getTableCell(column: string): TableCell
    {
        switch(column)
        {
            case FurniView.COLUMN_FURNI_NAME:
                return new TableCell(TableCell.TYPE_TEXT, this._chooserItem.name, false, true);

            case FurniView.COLUMN_FURNI_OWNER:
                if(this._chooserItem.owner === null)
                {
                    return new TableCell(TableCell.TYPE_TEXT, FurniChooserTableObject.OWNERLESS_PLACEHOLDER);
                }

                return new TableCell(TableCell.TYPE_TEXT, this._chooserItem.owner, false, true);

            case FurniView.COLUMN_ID:
                return new TableCell(TableCell.TYPE_TEXT, `${this._chooserItem.id}`, false, true);

            default:
                return new TableCell(TableCell.TYPE_TEXT, '');
        }
    }

    // AS3: .../chooser/furni/FurniChooserTableObject.as::isPropertyUpdated()
    // Always false in AS3 too — the list is rebuilt wholesale rather than diffed.
    isPropertyUpdated(_property: string, _value: unknown): boolean
    {
        return false;
    }

    // AS3: .../chooser/furni/FurniChooserTableObject.as::isUpdated()
    isUpdated(_value: unknown): boolean
    {
        return false;
    }
}
