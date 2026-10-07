import type {IWindow} from '../IWindow';
import type {IIterator} from '../utils/IIterator';

/**
 * Iterator interface for ItemGridController.
 * Uses duck-typing to avoid circular imports.
 */
interface IItemGridHost
{
    numGridItems: number;

    getGridItemAt(index: number): IWindow | null;

    getGridItemIndex(item: IWindow): number;
}

/**
 * Iterator for traversing items in an ItemGrid window.
 *
 * In AS3, extends Proxy and delegates to ItemGridController methods
 * (numGridItems, getGridItemAt, getGridItemIndex).
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/iterators/ItemGridIterator.as
 */
export class ItemGridIterator implements IIterator
{
    private _grid: IItemGridHost;
    private _index: number = 0;

    constructor(grid: IItemGridHost)
    {
        this._grid = grid;
    }

    public next(): IWindow | null
    {
        if(this._index < this._grid.numGridItems)
        {
            return this._grid.getGridItemAt(this._index++);
        }

        return null;
    }

    public reset(): void
    {
        this._index = 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/iterators/ItemGridIterator.as::get length()
    public get length(): number
    {
        return this._grid.numGridItems;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/iterators/ItemGridIterator.as::indexOf()
    public indexOf(window: IWindow | null): number
    {
        if(window === null) return -1;

        return this._grid.getGridItemIndex(window);
    }
}
