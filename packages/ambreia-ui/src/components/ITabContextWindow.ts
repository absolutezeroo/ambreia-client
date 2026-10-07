import type {IWindow} from '../IWindow';
import type {IWindowContainer} from '../IWindowContainer';
import type {IIterable} from '../utils/IIterable';
import type {ISelectorListWindow} from './ISelectorListWindow';
import type {ITabButtonWindow} from './ITabButtonWindow';

/**
 * Interface for tab context windows.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ITabContextWindow.as
 */
export interface ITabContextWindow extends IWindow, IIterable
{
    // AS3: .../src/com/sulake/core/window/components/ITabContextWindow.as::get selector()
    readonly selector: ISelectorListWindow | null;
    // AS3: .../src/com/sulake/core/window/components/ITabContextWindow.as::get container()
    readonly container: IWindowContainer | null;
    // AS3: .../src/com/sulake/core/window/components/ITabContextWindow.as::get numTabItems()
    readonly numTabItems: number;

    // AS3: .../src/com/sulake/core/window/components/ITabContextWindow.as::addTabItem()
    addTabItem(tab: ITabButtonWindow): ITabButtonWindow;

    // AS3: .../src/com/sulake/core/window/components/ITabContextWindow.as::addTabItemAt()
    addTabItemAt(tab: ITabButtonWindow, index: number): ITabButtonWindow;

    // AS3: .../src/com/sulake/core/window/components/ITabContextWindow.as::removeTabItem()
    removeTabItem(tab: ITabButtonWindow): void;

    // AS3: .../src/com/sulake/core/window/components/ITabContextWindow.as::getTabItemAt()
    getTabItemAt(index: number): ITabButtonWindow | null;

    // AS3: .../src/com/sulake/core/window/components/ITabContextWindow.as::getTabItemByName()
    getTabItemByName(name: string): ITabButtonWindow | null;

    // AS3: .../src/com/sulake/core/window/components/ITabContextWindow.as::getTabItemByID()
    getTabItemByID(id: number): ITabButtonWindow | null;

    // AS3: .../src/com/sulake/core/window/components/ITabContextWindow.as::getTabItemIndex()
    getTabItemIndex(tab: ITabButtonWindow): number;
}
