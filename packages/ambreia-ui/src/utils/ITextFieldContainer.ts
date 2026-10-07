import type {IMargins} from './IMargins';

/**
 * A window that owns a text field and the margins around it.
 *
 * AS3 types `textField` as `flash.text.TextField`. This port has no such class
 * — `TextController` keeps the text state and the glyph atlas rasterises it —
 * so the member stays unconstrained rather than pointing at a substitute that
 * does not share the Flash API.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/ITextFieldContainer.as
 */
export interface ITextFieldContainer
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/ITextFieldContainer.as::get textField()
    readonly textField: unknown;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/ITextFieldContainer.as::get margins()
    readonly margins: IMargins;
}
