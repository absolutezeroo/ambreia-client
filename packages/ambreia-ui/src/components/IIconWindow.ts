import type {IWindow} from '../IWindow';

/**
 * Interface for icon windows.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/IIconWindow.as
 */
export interface IIconWindow extends IWindow
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/IIconWindow.as::fitToSize()
    fitToSize(): void;
}
