import type {IItemListWindow} from './IItemListWindow';

/**
 * Interface for scrollable list windows.
 *
 * Extends IItemListWindow with auto-hide scrollbar support.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/IScrollableListWindow.as
 */
export interface IScrollableListWindow extends IItemListWindow
{
    // AS3: .../src/com/sulake/core/window/components/IScrollableListWindow.as::get autoHideScrollBar()
    autoHideScrollBar: boolean;
    // AS3: .../src/com/sulake/core/window/components/IScrollableListWindow.as::get isScrollBarVisible()
    readonly isScrollBarVisible: boolean;
    // The scrolled content region; ScrollableItemListWindow already implements it. Exposed here (as on
    // the AS3 interface) so the wired ScrollListPreset can size itself to the content height.
    readonly scrollableRegion: { x: number; y: number; width: number; height: number };
}
