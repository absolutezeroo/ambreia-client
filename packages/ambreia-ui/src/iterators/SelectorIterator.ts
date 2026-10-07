import type {IWindow} from '../IWindow';
import type {IIterator} from '../utils/IIterator';

/**
 * Iterator interface for SelectorController.
 * Uses duck-typing to avoid circular imports (mirrors ItemGridIterator's IItemGridHost).
 */
interface ISelectorHost
{
    numSelectables: number;

    getSelectableAt(index: number): IWindow | null;

    getSelectableIndex(item: IWindow): number;
}

/**
 * Iterator for traversing selectable items in a Selector window.
 *
 * In AS3 this extends Proxy and delegates live to SelectorController methods
 * (numSelectables, getSelectableAt, getSelectableIndex) - so it always
 * reflects the controller's current children, even if selectables are
 * added/removed after the iterator was created. Delegating to the live
 * controller (not a snapshot array) here matches that.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/iterators/SelectorIterator.as
 */
export class SelectorIterator implements IIterator
{
    private _selector: ISelectorHost;
    private _index: number = 0;

    constructor(selector: ISelectorHost)
    {
        this._selector = selector;
    }

    public next(): IWindow | null
    {
        if(this._index < this._selector.numSelectables)
        {
            return this._selector.getSelectableAt(this._index++);
        }

        return null;
    }

    public reset(): void
    {
        this._index = 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/iterators/SelectorIterator.as::get length()
    public get length(): number
    {
        return this._selector.numSelectables;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/iterators/SelectorIterator.as::indexOf()
    public indexOf(window: IWindow | null): number
    {
        if(window === null) return -1;

        return this._selector.getSelectableIndex(window);
    }
}
