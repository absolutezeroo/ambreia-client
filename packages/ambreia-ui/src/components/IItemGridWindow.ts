import type {IWindow} from '../IWindow';
import type {IIterable} from '../utils/IIterable';
import type {IScrollableWindow} from './IScrollableWindow';

/**
 * Interface for item grid windows.
 *
 * An item grid arranges children in a two-dimensional grid layout
 * with configurable columns, rows, spacing, and scroll support.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/IItemGridWindow.as
 */
export interface IItemGridWindow extends IWindow, IScrollableWindow, IIterable
{
    // AS3: .../src/com/sulake/core/window/components/IItemGridWindow.as::get spacing()
    spacing: number;
    verticalSpacing: number;
    // AS3: .../src/com/sulake/core/window/components/IItemGridWindow.as::get scaleToFitItems()
    scaleToFitItems: boolean;
    // AS3: .../src/com/sulake/core/window/components/IItemGridWindow.as::get autoArrangeItems()
    autoArrangeItems: boolean;
    // AS3: .../src/com/sulake/core/window/components/IItemGridWindow.as::get resizeOnItemUpdate()
    resizeOnItemUpdate: boolean;
    // AS3: .../src/com/sulake/core/window/components/IItemGridWindow.as::get shouldRebuildGridOnResize()
    shouldRebuildGridOnResize: boolean;
    // AS3: .../src/com/sulake/core/window/components/IItemGridWindow.as::get containerResizeToColumns()
    containerResizeToColumns: boolean;

    // AS3: .../src/com/sulake/core/window/components/IItemGridWindow.as::get numColumns()
    readonly numColumns: number;
    // AS3: .../src/com/sulake/core/window/components/IItemGridWindow.as::get numRows()
    readonly numRows: number;
    // AS3: .../src/com/sulake/core/window/components/IItemGridWindow.as::get numGridItems()
    readonly numGridItems: number;

    // AS3: .../src/com/sulake/core/window/components/IItemGridWindow.as::addGridItem()
    addGridItem(item: IWindow): IWindow;

    // AS3: .../src/com/sulake/core/window/components/IItemGridWindow.as::addGridItemAt()
    addGridItemAt(item: IWindow, index: number): IWindow;

    // AS3: .../src/com/sulake/core/window/components/IItemGridWindow.as::getGridItemAt()
    getGridItemAt(index: number): IWindow | null;

    // AS3: .../src/com/sulake/core/window/components/IItemGridWindow.as::getGridItemByID()
    getGridItemByID(id: number): IWindow | null;

    // AS3: .../src/com/sulake/core/window/components/IItemGridWindow.as::getGridItemByName()
    getGridItemByName(name: string): IWindow | null;

    // AS3: .../src/com/sulake/core/window/components/IItemGridWindow.as::getGridItemByTag()
    getGridItemByTag(tag: string): IWindow | null;

    // AS3: .../src/com/sulake/core/window/components/IItemGridWindow.as::getGridItemIndex()
    getGridItemIndex(item: IWindow): number;

    // AS3: .../src/com/sulake/core/window/components/IItemGridWindow.as::removeGridItem()
    removeGridItem(item: IWindow): IWindow | null;

    // AS3: .../src/com/sulake/core/window/components/IItemGridWindow.as::removeGridItemAt()
    removeGridItemAt(index: number): IWindow | null;

    // AS3: .../src/com/sulake/core/window/components/IItemGridWindow.as::setGridItemIndex()
    setGridItemIndex(item: IWindow, index: number): void;

    // AS3: .../src/com/sulake/core/window/components/IItemGridWindow.as::swapGridItems()
    swapGridItems(a: IWindow, b: IWindow): void;

    // AS3: .../src/com/sulake/core/window/components/IItemGridWindow.as::swapGridItemsAt()
    swapGridItemsAt(indexA: number, indexB: number): void;

    // AS3: .../src/com/sulake/core/window/components/IItemGridWindow.as::removeGridItems()
    removeGridItems(): void;

    // AS3: .../src/com/sulake/core/window/components/IItemGridWindow.as::destroyGridItems()
    destroyGridItems(): void;

    // AS3: .../src/com/sulake/core/window/components/IItemGridWindow.as::rebuildGridStructure()
    rebuildGridStructure(): void;

    // AS3: .../src/com/sulake/core/window/components/IItemGridWindow.as::populate()
    populate(items: IWindow[]): void;
}
