import type {IWindow} from '../IWindow';
// Forward declaration to avoid circular dependency
import type {IToolTipWindow} from './IToolTipWindow';

/**
 * Interface for interactive windows with tooltip and mouse cursor support.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/IInteractiveWindow.as
 */
export interface IInteractiveWindow extends IWindow
{
    // AS3: .../src/com/sulake/core/window/components/IInteractiveWindow.as::get toolTipCaption()
    toolTipCaption: string;
    // AS3: .../src/com/sulake/core/window/components/IInteractiveWindow.as::get toolTipDelay()
    toolTipDelay: number;
    // AS3: .../src/com/sulake/core/window/components/IInteractiveWindow.as::get toolTipIsDynamic()
    toolTipIsDynamic: boolean;
    // AS3: .../src/com/sulake/core/window/components/IInteractiveWindow.as::get interactiveCursorDisabled()
    interactiveCursorDisabled: boolean;

    // AS3: .../src/com/sulake/core/window/components/IInteractiveWindow.as::showToolTip()
    showToolTip(toolTip: IToolTipWindow): void;

    // AS3: .../src/com/sulake/core/window/components/IInteractiveWindow.as::hideToolTip()
    hideToolTip(): void;

    // AS3: .../src/com/sulake/core/window/components/IInteractiveWindow.as::setMouseCursorForState()
    setMouseCursorForState(state: number, cursor: number): number;

    // AS3: .../src/com/sulake/core/window/components/IInteractiveWindow.as::getMouseCursorByState()
    getMouseCursorByState(state: number): number;
}
