import type {IWindow} from '../IWindow';
import type {IWindowContainer} from '../IWindowContainer';
import type {IScrollableWindow} from './IScrollableWindow';

/**
 * Interface for item list windows.
 *
 * An item list arranges children in a single-axis layout
 * (horizontal or vertical) with optional spacing and scrolling.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/IItemListWindow.as
 */
export interface IItemListWindow extends IWindowContainer, IScrollableWindow
{
    // AS3: .../src/com/sulake/core/window/components/IItemListWindow.as::get autoArrangeItems()
    autoArrangeItems: boolean;
    // AS3: .../src/com/sulake/core/window/components/IItemListWindow.as::get spacing()
    spacing: number;
    // AS3: .../src/com/sulake/core/window/components/IItemListWindow.as::get scaleToFitItems()
    scaleToFitItems: boolean;
    // AS3: .../src/com/sulake/core/window/components/IItemListWindow.as::get resizeOnItemUpdate()
    resizeOnItemUpdate: boolean;
    // AS3: .../src/com/sulake/core/window/components/IItemListWindow.as::get inverseResizeOnItemUpdate()
    inverseResizeOnItemUpdate: boolean;
    // AS3: .../src/com/sulake/core/window/components/IItemListWindow.as::get isPartOfGridWindow()
    isPartOfGridWindow: boolean;

    // AS3: .../src/com/sulake/core/window/components/IItemListWindow.as::get numListItems()
    readonly numListItems: number;
    readonly firstListItem: IWindow | null;
    readonly lastListItem: IWindow | null;
    // AS3: .../src/com/sulake/core/window/components/IItemListWindow.as::get scrollableWindow()
    readonly scrollableWindow: IWindow;

    arrangeItems(): void;
    // AS3: .../src/com/sulake/core/window/components/IItemListWindow.as::arrangeListItems()
    arrangeListItems(): void;

    // AS3: .../src/com/sulake/core/window/components/IItemListWindow.as::populate()
    populate(items: IWindow[]): void;

    // AS3: .../src/com/sulake/core/window/components/IItemListWindow.as::scrollWithWheel()
    scrollWithWheel(delta: number, useHorizontal: boolean): boolean;

    // AS3: .../src/com/sulake/core/window/components/IItemListWindow.as::addListItem()
    addListItem(item: IWindow): IWindow;

    // AS3: .../src/com/sulake/core/window/components/IItemListWindow.as::addListItemAt()
    addListItemAt(item: IWindow, index: number): IWindow;

    // AS3: .../src/com/sulake/core/window/components/IItemListWindow.as::getListItemAt()
    getListItemAt(index: number): IWindow | null;

    // AS3: .../src/com/sulake/core/window/components/IItemListWindow.as::getListItemByName()
    getListItemByName(name: string): IWindow | null;

    // AS3: .../src/com/sulake/core/window/components/IItemListWindow.as::getListItemByID()
    getListItemByID(id: number): IWindow | null;

    // AS3: .../src/com/sulake/core/window/components/IItemListWindow.as::getListItemByTag()
    getListItemByTag(tag: string): IWindow | null;

    // AS3: .../src/com/sulake/core/window/components/IItemListWindow.as::getListItemIndex()
    getListItemIndex(item: IWindow): number;

    // AS3: .../src/com/sulake/core/window/components/IItemListWindow.as::removeListItem()
    removeListItem(item: IWindow): IWindow | null;

    // AS3: .../src/com/sulake/core/window/components/IItemListWindow.as::removeListItemAt()
    removeListItemAt(index: number): IWindow | null;

    // AS3: .../src/com/sulake/core/window/components/IItemListWindow.as::removeListItems()
    removeListItems(): void;

    // AS3: .../src/com/sulake/core/window/components/IItemListWindow.as::destroyListItems()
    destroyListItems(): void;

    // AS3: .../src/com/sulake/core/window/components/IItemListWindow.as::setListItemIndex()
    setListItemIndex(item: IWindow, index: number): void;

    // AS3: .../src/com/sulake/core/window/components/IItemListWindow.as::swapListItems()
    swapListItems(a: IWindow, b: IWindow): void;

    // AS3: .../src/com/sulake/core/window/components/IItemListWindow.as::swapListItemsAt()
    swapListItemsAt(indexA: number, indexB: number): void;

    // AS3: .../src/com/sulake/core/window/components/IItemListWindow.as::groupListItemsWithID()
    groupListItemsWithID(id: number, result: IWindow[], depth?: number): number;

    // AS3: .../src/com/sulake/core/window/components/IItemListWindow.as::groupListItemsWithTag()
    groupListItemsWithTag(tag: string, result: IWindow[], depth?: number): number;
}
