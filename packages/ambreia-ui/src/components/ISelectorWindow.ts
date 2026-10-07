import type {IWindow} from '../IWindow';
import type {ISelectableWindow} from './ISelectableWindow';

/**
 * Interface for selector windows that manage mutual exclusion of selectables.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ISelectorWindow.as
 */
export interface ISelectorWindow extends IWindow
{
    // AS3: .../src/com/sulake/core/window/components/ISelectorWindow.as::get numSelectables()
    readonly numSelectables: number;

    // AS3: .../src/com/sulake/core/window/components/ISelectorWindow.as::getSelected()
    getSelected(): ISelectableWindow | null;

    // AS3: .../src/com/sulake/core/window/components/ISelectorWindow.as::setSelected()
    setSelected(selectable: ISelectableWindow): void;

    // AS3: .../src/com/sulake/core/window/components/ISelectorWindow.as::addSelectable()
    addSelectable(selectable: ISelectableWindow): ISelectableWindow;

    // AS3: .../src/com/sulake/core/window/components/ISelectorWindow.as::addSelectableAt()
    addSelectableAt(selectable: ISelectableWindow, index: number): ISelectableWindow;

    // AS3: .../src/com/sulake/core/window/components/ISelectorWindow.as::getSelectableAt()
    getSelectableAt(index: number): ISelectableWindow | null;

    // AS3: .../src/com/sulake/core/window/components/ISelectorWindow.as::getSelectableByID()
    getSelectableByID(id: number): ISelectableWindow | null;

    // AS3: .../src/com/sulake/core/window/components/ISelectorWindow.as::getSelectableByTag()
    getSelectableByTag(tag: string): ISelectableWindow | null;

    // AS3: .../src/com/sulake/core/window/components/ISelectorWindow.as::getSelectableByName()
    getSelectableByName(name: string): ISelectableWindow | null;

    // AS3: .../src/com/sulake/core/window/components/ISelectorWindow.as::getSelectableIndex()
    getSelectableIndex(selectable: ISelectableWindow): number;

    // AS3: .../src/com/sulake/core/window/components/ISelectorWindow.as::removeSelectable()
    removeSelectable(selectable: ISelectableWindow): ISelectableWindow | null;
}
