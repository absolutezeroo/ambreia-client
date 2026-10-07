import type {IWindow} from '../IWindow';
import type {IMargins} from '../utils/IMargins';
import type {TextStyle} from '../utils/TextStyle';

/**
 * Interface for label windows.
 *
 * A lightweight text display that uses shared TextFieldCache instances
 * rather than owning a dedicated text field.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ILabelWindow.as
 */
export interface ILabelWindow extends IWindow
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ILabelWindow.as::get bold()
    readonly bold: boolean;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ILabelWindow.as::get italic()
    readonly italic: boolean;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ILabelWindow.as::get underline()
    readonly underline: boolean;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ILabelWindow.as::get fontFace()
    readonly fontFace: string;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ILabelWindow.as::get fontSize()
    readonly fontSize: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ILabelWindow.as::get length()
    readonly length: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ILabelWindow.as::get textHeight()
    readonly textHeight: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ILabelWindow.as::get textWidth()
    readonly textWidth: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ILabelWindow.as::get antiAliasType()
    readonly antiAliasType: string;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ILabelWindow.as::get autoSize()
    readonly autoSize: string;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ILabelWindow.as::get border()
    readonly border: boolean;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ILabelWindow.as::get borderColor()
    readonly borderColor: number;
    // AS3 declares `get defaultTextFormat():TextFormat`, the pooled TextField's format.
    // This port has no TextField: the resolved TextStyle it was built from stands in.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ILabelWindow.as::get defaultTextFormat()
    readonly defaultTextFormat: TextStyle | null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ILabelWindow.as::get embedFonts()
    readonly embedFonts: boolean;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ILabelWindow.as::get gridFitType()
    readonly gridFitType: string;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ILabelWindow.as::get kerning()
    readonly kerning: boolean;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ILabelWindow.as::get margins()
    readonly margins: IMargins;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ILabelWindow.as::get maxChars()
    readonly maxChars: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ILabelWindow.as::get sharpness()
    readonly sharpness: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ILabelWindow.as::get spacing()
    readonly spacing: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ILabelWindow.as::get thickness()
    readonly thickness: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ILabelWindow.as::get textStyle()
    textStyle: TextStyle | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ILabelWindow.as::get text()
    text: string;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ILabelWindow.as::get textColor()
    textColor: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ILabelWindow.as::get textBackground()
    textBackground: boolean;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ILabelWindow.as::get textBackgroundColor()
    textBackgroundColor: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ILabelWindow.as::get vertical()
    vertical: boolean;
}
