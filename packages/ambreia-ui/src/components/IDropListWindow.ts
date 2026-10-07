import type {IWindow} from '../IWindow';
import type {IIterable} from '../utils/IIterable';
import type {IInteractiveWindow} from './IInteractiveWindow';

/**
 * Interface for drop list windows.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IDropListWindow.as
 */
export interface IDropListWindow extends IInteractiveWindow, IIterable
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IDropListWindow.as::get selection()
    selection: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IDropListWindow.as::get numMenuItems()
    readonly numMenuItems: number;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IDropListWindow.as::addMenuItem()
    addMenuItem(item: IWindow): IWindow | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IDropListWindow.as::addMenuItemAt()
    addMenuItemAt(item: IWindow, index: number): IWindow | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IDropListWindow.as::getMenuItemIndex()
    getMenuItemIndex(item: IWindow): number;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IDropListWindow.as::getMenuItemAt()
    getMenuItemAt(index: number): IWindow | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IDropListWindow.as::removeMenuItem()
    removeMenuItem(item: IWindow): IWindow | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IDropListWindow.as::removeMenuItemAt()
    removeMenuItemAt(index: number): IWindow | null;
}
