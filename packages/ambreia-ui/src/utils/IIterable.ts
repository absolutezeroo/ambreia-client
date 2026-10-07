import type {IIterator} from './IIterator';

/**
 * Interface for iterable window containers.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/IIterable.as
 */
export interface IIterable
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/IIterable.as::get iterator()
    iterator(): IIterator | null;
}
