import type {WindowEvent} from './events/WindowEvent';
import type {IWindow} from './IWindow';

/**
 * Interface for tracking input events on windows.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/IInputEventTracker.as
 */
export interface IInputEventTracker
{
    // AS3: .../src/com/sulake/core/window/IInputEventTracker.as::eventReceived()
    eventReceived(event: WindowEvent, window: IWindow): void;
}
