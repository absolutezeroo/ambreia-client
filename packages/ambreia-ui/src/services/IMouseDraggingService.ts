import type {IWindow} from '../IWindow';

/**
 * Mouse dragging service interface.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/IMouseDraggingService.as
 */
export interface IMouseDraggingService
{
    // AS3: .../src/com/sulake/core/window/services/IMouseDraggingService.as::dispose()
    dispose(): void;

    // AS3: .../src/com/sulake/core/window/services/IMouseDraggingService.as::begin()
    // Flags and return value as on IMouseListenerService — same WindowMouseOperator contract.
    begin(window: IWindow, flags?: number): IWindow | null;

    // AS3: .../src/com/sulake/core/window/services/IMouseDraggingService.as::end()
    end(window: IWindow): IWindow | null;
}
