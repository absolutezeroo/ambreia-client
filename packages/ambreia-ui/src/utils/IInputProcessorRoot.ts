import type {IWindow} from '../IWindow';
import type {WindowEvent} from '../events/WindowEvent';

/**
 * A window that is the entry point for input dispatch: it takes a window event
 * and reports whether it consumed it.
 *
 * `DesktopController` is the implementation — it is where
 * `MouseEventProcessor` starts its walk.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/IInputProcessorRoot.as
 */
export interface IInputProcessorRoot extends IWindow
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/IInputProcessorRoot.as::process()
    process(event: WindowEvent): boolean;
}
