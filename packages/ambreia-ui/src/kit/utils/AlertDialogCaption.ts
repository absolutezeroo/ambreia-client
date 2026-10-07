/**
 * Interface for a button caption with text, tooltip, and visibility.
 *
 * In AS3 this was the obfuscated `class_3562` / `ICaption` interface.
 * Extracted here as a clean TypeScript interface alongside its
 * implementation.
 *
 * @see sources/win63_version/habbo/window/utils/AlertDialogCaption.as
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AlertDialogCaption.as
 */
export interface ICaption {
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AlertDialogCaption.as::get text()
    text: string;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AlertDialogCaption.as::get toolTip()
    toolTip: string;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AlertDialogCaption.as::get visible()
    visible: boolean;
}

/**
 * Concrete caption for alert dialog buttons.
 *
 * Stores the display text, tooltip, and visibility state of a
 * dialog button. Used by {@link AlertDialog.getButtonCaption} and
 * {@link AlertDialog.setButtonCaption} to read/write button labels.
 *
 * @see sources/win63_version/habbo/window/utils/AlertDialogCaption.as
 */
export class AlertDialogCaption implements ICaption 
{
    constructor(text: string, toolTip: string, visible: boolean) 
    {
        this._text = text;
        this._toolTip = toolTip;
        this._visible = visible;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AlertDialogCaption.as::_text
    private _text: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AlertDialogCaption.as::get text()
    public get text(): string 
    {
        return this._text;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AlertDialogCaption.as::set text()
    public set text(value: string) 
    {
        this._text = value;
    }

    private _toolTip: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AlertDialogCaption.as::get toolTip()
    public get toolTip(): string 
    {
        return this._toolTip;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AlertDialogCaption.as::set toolTip()
    public set toolTip(value: string) 
    {
        this._toolTip = value;
    }

    private _visible: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AlertDialogCaption.as::get visible()
    public get visible(): boolean 
    {
        return this._visible;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AlertDialogCaption.as::set visible()
    public set visible(value: boolean) 
    {
        this._visible = value;
    }
}
