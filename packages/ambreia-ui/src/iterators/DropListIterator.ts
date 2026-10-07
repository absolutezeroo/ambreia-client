import type {IWindow} from '../IWindow';
import type {IIterator} from '../utils/IIterator';

/**
 * Iterator interface for DropListController.
 * Uses duck-typing to avoid circular imports (mirrors ItemGridIterator's IItemGridHost).
 */
interface IDropListHost
{
    numMenuItems: number;

    getMenuItemAt(index: number): IWindow | null;

    getMenuItemIndex(item: IWindow): number;
}

/**
 * Iterator for traversing items in a DropList (dropdown menu) window.
 *
 * In AS3 this extends Proxy and delegates live to DropListController methods
 * (numMenuItems, getMenuItemAt, getMenuItemIndex) - so it always reflects the
 * controller's current menu items, even if items are added/removed after the
 * iterator was created. Delegating to the live controller (not a snapshot
 * array) here matches that.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/iterators/DropListIterator.as
 */
export class DropListIterator implements IIterator
{
    private _dropList: IDropListHost;
    private _index: number = 0;

    constructor(dropList: IDropListHost)
    {
        this._dropList = dropList;
    }

    public next(): IWindow | null
    {
        if(this._index < this._dropList.numMenuItems)
        {
            return this._dropList.getMenuItemAt(this._index++);
        }

        return null;
    }

    public reset(): void
    {
        this._index = 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/iterators/DropListIterator.as::get length()
    public get length(): number
    {
        return this._dropList.numMenuItems;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/iterators/DropListIterator.as::indexOf()
    public indexOf(window: IWindow | null): number
    {
        if(window === null) return -1;

        return this._dropList.getMenuItemIndex(window);
    }
}
