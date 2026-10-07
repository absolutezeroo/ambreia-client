import type {IWindowContainer} from '../IWindowContainer';
import type {IDisplayObjectWrapper} from './IDisplayObjectWrapper';
import type {IWindow} from '../IWindow';

/**
 * Interface for the desktop window (root container).
 *
 * The desktop window is the top-level container that holds all other windows.
 * It provides mouse position tracking and active window management.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IDesktopWindow.as
 */
export interface IDesktopWindow extends IWindowContainer, IDisplayObjectWrapper
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IDesktopWindow.as::get mouseX()
    readonly mouseX: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IDesktopWindow.as::get mouseY()
    readonly mouseY: number;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IDesktopWindow.as::getActiveWindow()
    getActiveWindow(): IWindow;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IDesktopWindow.as::setActiveWindow()
    setActiveWindow(window: IWindow): IWindow;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IDesktopWindow.as::groupParameterFilteredChildrenUnderPoint()
    groupParameterFilteredChildrenUnderPoint(
        point: { x: number; y: number },
        result: IWindow[],
        paramFilter?: number
    ): void;
}
