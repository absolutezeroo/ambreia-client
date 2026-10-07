import type {IWindow} from '../IWindow';

/**
 * Mouse scaling service interface.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/IMouseScalingService.as
 */
export interface IMouseScalingService
{
    // AS3: .../src/com/sulake/core/window/services/IMouseScalingService.as::dispose()
    dispose(): void;

    // AS3: .../src/com/sulake/core/window/services/IMouseScalingService.as::begin()
    // The one call site that passes flags: WindowController hands it the window's
    // MOUSE_SCALING_TRIGGER bits, which decide which edges may be dragged.
    begin(window: IWindow, scalingFlags?: number): IWindow | null;

    // AS3: .../src/com/sulake/core/window/services/IMouseScalingService.as::end()
    end(window: IWindow): IWindow | null;
}
