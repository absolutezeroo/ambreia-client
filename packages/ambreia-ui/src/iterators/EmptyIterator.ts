import type {IWindow} from '../IWindow';
import type {IIterator} from '../utils/IIterator';

/**
 * Singleton iterator that always returns nothing.
 *
 * Used as the default iterator for non-container windows that have no children.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/iterators/EmptyIterator.as
 */
export class EmptyIterator implements IIterator
{
    // AS3: .../src/com/sulake/core/window/iterators/EmptyIterator.as::INSTANCE
    public static readonly INSTANCE: EmptyIterator = new EmptyIterator();

    // TS-only: renders AS3's `flash_proxy nextValue` — see IIterator.
    public next(): IWindow | null
    {
        return null;
    }

    // TS-only: renders AS3's `flash_proxy nextNameIndex` — see IIterator.
    public reset(): void
    {
    }

    // AS3: .../src/com/sulake/core/window/iterators/EmptyIterator.as::get length()
    public get length(): number
    {
        return 0;
    }

    // AS3: .../src/com/sulake/core/window/iterators/EmptyIterator.as::indexOf()
    public indexOf(): number
    {
        return -1;
    }
}
