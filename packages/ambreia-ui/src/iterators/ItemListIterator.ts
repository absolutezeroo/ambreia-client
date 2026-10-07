import type {IWindow} from '../IWindow';
import type {IIterator} from '../utils/IIterator';

/**
 * Iterator interface for ItemListController.
 * Uses duck-typing to avoid circular imports (mirrors ItemGridIterator's IItemGridHost).
 */
interface IItemListHost
{
    numListItems: number;

    getListItemAt(index: number): IWindow | null;

    getListItemIndex(item: IWindow): number;
}

/**
 * Iterator for traversing items in an ItemList window.
 *
 * In AS3 this extends Proxy and delegates live to ItemListController methods
 * (numListItems, getListItemAt, getListItemIndex) - so it always reflects the
 * controller's current item list, even if items are added/removed after the
 * iterator was created. Delegating to the live controller (not a snapshot
 * array) here matches that.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/iterators/ItemListIterator.as
 */
export class ItemListIterator implements IIterator
{
    private _list: IItemListHost;
    private _index: number = 0;

    constructor(list: IItemListHost)
    {
        this._list = list;
    }

    public next(): IWindow | null
    {
        if(this._index < this._list.numListItems)
        {
            return this._list.getListItemAt(this._index++);
        }

        return null;
    }

    public reset(): void
    {
        this._index = 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/iterators/ItemListIterator.as::get length()
    public get length(): number
    {
        return this._list.numListItems;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/iterators/ItemListIterator.as::indexOf()
    public indexOf(window: IWindow | null): number
    {
        if(window === null) return -1;

        return this._list.getListItemIndex(window);
    }
}
