import type {ITextWindow} from './ITextWindow';
import type {IInteractiveWindow} from './IInteractiveWindow';
import type {IFocusWindow} from './IFocusWindow';

/**
 * Interface for editable text field windows.
 *
 * Extends ITextWindow with input-specific functionality: editable, selectable,
 * password display, focus management, and selection.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ITextFieldWindow.as
 */
export interface ITextFieldWindow extends ITextWindow, IInteractiveWindow, IFocusWindow
{
    // AS3: .../src/com/sulake/core/window/components/ITextFieldWindow.as::get editable()
    editable: boolean;
    // AS3: .../src/com/sulake/core/window/components/ITextFieldWindow.as::get selectable()
    selectable: boolean;
    // AS3: .../src/com/sulake/core/window/components/ITextFieldWindow.as::get displayAsPassword()
    displayAsPassword: boolean;
    // AS3: .../src/com/sulake/core/window/components/ITextFieldWindow.as::get selectionBeginIndex()
    readonly selectionBeginIndex: number;
    // AS3: .../src/com/sulake/core/window/components/ITextFieldWindow.as::get selectionEndIndex()
    readonly selectionEndIndex: number;
    // AS3: .../src/com/sulake/core/window/components/ITextFieldWindow.as::get displayRaw()
    displayRaw: boolean;

    /**
	 * Character mask applied to typing. See TextController.applyRestrict() for the supported
	 * syntax and for the one place this port differs from Flash (the empty string).
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ITextFieldWindow.as::get restrict()
    restrict: string;

    // AS3: .../src/com/sulake/core/window/components/ITextFieldWindow.as::setSelection()
    setSelection(beginIndex: number, endIndex: number): void;

    // AS3: .../src/com/sulake/core/window/components/ITextFieldWindow.as::requestChangeEvent()
    requestChangeEvent(): void;

    // AS3: .../src/com/sulake/core/window/components/ITextFieldWindow.as::getWordAt()
    getWordAt(x: number, y: number): string;
}
