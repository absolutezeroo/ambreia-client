import type {IWindow} from '../IWindow';

/**
 * Interface for scrollable windows.
 *
 * Provides horizontal and vertical scroll position, step size,
 * maximum scroll values, and visible/scrollable region rectangles.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/IScrollableWindow.as
 */
export interface IScrollableWindow extends IWindow
{
    // AS3: .../src/com/sulake/core/window/components/IScrollableWindow.as::get scrollH()
    scrollH: number;
    // AS3: .../src/com/sulake/core/window/components/IScrollableWindow.as::get scrollV()
    scrollV: number;
    // AS3: .../src/com/sulake/core/window/components/IScrollableWindow.as::get maxScrollH()
    readonly maxScrollH: number;
    // AS3: .../src/com/sulake/core/window/components/IScrollableWindow.as::get maxScrollV()
    readonly maxScrollV: number;
    // AS3: .../src/com/sulake/core/window/components/IScrollableWindow.as::get visibleRegion()
    readonly visibleRegion: { x: number; y: number; width: number; height: number };
    // AS3: .../src/com/sulake/core/window/components/IScrollableWindow.as::get scrollableRegion()
    readonly scrollableRegion: { x: number; y: number; width: number; height: number };
}
