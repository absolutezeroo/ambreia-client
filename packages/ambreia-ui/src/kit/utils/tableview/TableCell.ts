/**
 * TableCell — one cell's data in a table row: its type (text or link), contents, and presentation
 * flags (editable/inspectable, link + extra-button callbacks, tooltip, text color). Pure data holder;
 * TableCellView renders it.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/tableview/TableCell.as
 */
export type TableCellCallback = (...args: unknown[]) => void;

export class TableCell
{
    // AS3: TableCell.as::_SafeStr_4589 (name derived: plain text cell)
    static readonly TYPE_TEXT: number = 0;

    // AS3: TableCell.as::_SafeStr_6167 (name derived: clickable link cell)
    static readonly TYPE_LINK: number = 1;

    // AS3: TableCell.as::_SafeStr_4778 (name derived: cell type)
    private _type: number;

    // AS3: TableCell.as::_SafeStr_4697 (name derived: cell contents)
    private _contents: unknown;

    // AS3: TableCell.as::_SafeStr_8923 (name derived: is-inspectable)
    private _isInspectable: boolean;

    // AS3: TableCell.as::_SafeStr_8803 (name derived: is-editable)
    private _isEditable: boolean;

    // AS3: TableCell.as::_SafeStr_10062 (name derived: text-field value)
    private _textFieldValue: string | null;

    // AS3: TableCell.as::_linkClickCallback
    private _linkClickCallback: TableCellCallback | null;

    // AS3: TableCell.as::_highlightOnChange
    private _highlightOnChange: boolean;

    // AS3: TableCell.as::_SafeStr_9272 (name derived: tooltip text)
    private _tooltipText: string | null;

    // AS3: TableCell.as::_textColor
    private _textColor: number;

    // AS3: TableCell.as::_SafeStr_9777 (name derived: extra-button label)
    private _extraBtn: string | null = null;

    // AS3: TableCell.as::_extraBtnCallback
    private _extraBtnCallback: TableCellCallback | null = null;

    // AS3: TableCell.as::TableCell()
    constructor(type: number, contents: unknown, isEditable: boolean = false, isInspectable: boolean = false, textFieldValue: string | null = null, linkClickCallback: TableCellCallback | null = null, highlightOnChange: boolean = false, tooltipText: string | null = null, textColor: number = 0)
    {
        this._type = type;
        this._contents = contents;
        this._isEditable = isEditable;
        this._isInspectable = isInspectable;
        this._linkClickCallback = linkClickCallback;

        // AS3: `if(param5 == null && (param3 || param4)) param5 = param2 as String;` — default the
        // text-field value to the contents when they are a string (AS3 `as String` yields null otherwise).
        if(textFieldValue == null && (isEditable || isInspectable))
        {
            textFieldValue = typeof contents === 'string' ? contents : null;
        }

        this._textFieldValue = textFieldValue;
        this._highlightOnChange = highlightOnChange;
        this._tooltipText = tooltipText;
        this._textColor = textColor;
    }

    // AS3: TableCell.as::get type()
    get type(): number
    {
        return this._type;
    }

    // AS3: TableCell.as::get isEditable()
    get isEditable(): boolean
    {
        return this._isEditable;
    }

    // AS3: TableCell.as::get contents()
    get contents(): unknown
    {
        return this._contents;
    }

    // AS3: TableCell.as::get isInspectable()
    get isInspectable(): boolean
    {
        return this._isInspectable;
    }

    // AS3: TableCell.as::get textFieldValue()
    get textFieldValue(): string | null
    {
        return this._textFieldValue;
    }

    // AS3: TableCell.as::get linkClickCallback()
    get linkClickCallback(): TableCellCallback | null
    {
        return this._linkClickCallback;
    }

    // AS3: TableCell.as::get highlightOnChange()
    get highlightOnChange(): boolean
    {
        return this._highlightOnChange;
    }

    // AS3: TableCell.as::get tooltipText()
    get tooltipText(): string | null
    {
        return this._tooltipText;
    }

    // AS3: TableCell.as::get textColor()
    get textColor(): number
    {
        return this._textColor;
    }

    // AS3: TableCell.as::setExtraBtn()
    setExtraBtn(label: string, callback: TableCellCallback): void
    {
        this._extraBtn = label;
        this._extraBtnCallback = callback;
    }

    // AS3: TableCell.as::get extraBtn()
    get extraBtn(): string | null
    {
        return this._extraBtn;
    }

    // AS3: TableCell.as::get extraBtnCallback()
    get extraBtnCallback(): TableCellCallback | null
    {
        return this._extraBtnCallback;
    }
}
