import type {IItemGridWindow} from './IItemGridWindow';

/**
 * Interface for scrollable grid windows.
 *
 * Extends IItemGridWindow with auto-hide scrollbar support.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/IScrollableGridWindow.as
 */
export interface IScrollableGridWindow extends IItemGridWindow
{
    // AS3: .../src/com/sulake/core/window/components/IScrollableGridWindow.as::get autoHideScrollBar()
    autoHideScrollBar: boolean;
}
