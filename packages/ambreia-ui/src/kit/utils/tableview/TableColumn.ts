/**
 * TableColumn — a table column definition: id, header/localization column name, width factor (share
 * of the table width), and text alignment. AS3 maps a "left" alignment to "none" (the window default).
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/tableview/TableColumn.as
 */
export class TableColumn
{
    // AS3: TableColumn.as::_SafeStr_4872 (name derived: column id)
    private _id: string;

    // AS3: TableColumn.as::_columnName
    private _columnName: string;

    // AS3: TableColumn.as::_SafeStr_8916 (name derived: width factor)
    private _widthFactor: number;

    // AS3: TableColumn.as::_SafeStr_8317 (name derived: alignment)
    private _alignment: string;

    // AS3: TableColumn.as::TableColumn()
    constructor(id: string, columnName: string, widthFactor: number, alignment: string = 'center')
    {
        this._id = id;
        this._columnName = columnName;
        this._widthFactor = widthFactor;

        if(alignment === 'left')
        {
            alignment = 'none';
        }

        this._alignment = alignment;
    }

    // AS3: TableColumn.as::get id()
    get id(): string
    {
        return this._id;
    }

    // AS3: TableColumn.as::get columnName()
    get columnName(): string
    {
        return this._columnName;
    }

    // AS3: TableColumn.as::get widthFactor()
    get widthFactor(): number
    {
        return this._widthFactor;
    }

    // AS3: TableColumn.as::get alignment()
    get alignment(): string
    {
        return this._alignment;
    }
}
