import type {IMouseDraggingService} from './IMouseDraggingService';
import type {IMouseScalingService} from './IMouseScalingService';
import type {IMouseListenerService} from './IMouseListenerService';
import type {IFocusManagerService} from './IFocusManagerService';
import type {IToolTipAgentService} from './IToolTipAgentService';
import type {IGestureAgentService} from './IGestureAgentService';

/**
 * Internal window services aggregator.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/IInternalWindowServices.as
 */
export interface IInternalWindowServices
{
    // AS3: .../src/com/sulake/core/window/services/IInternalWindowServices.as::getMouseDraggingService()
    getMouseDraggingService(): IMouseDraggingService;

    // AS3: .../src/com/sulake/core/window/services/IInternalWindowServices.as::getMouseScalingService()
    getMouseScalingService(): IMouseScalingService;

    // AS3: .../src/com/sulake/core/window/services/IInternalWindowServices.as::getMouseListenerService()
    getMouseListenerService(): IMouseListenerService;

    // AS3: .../src/com/sulake/core/window/services/IInternalWindowServices.as::getFocusManagerService()
    getFocusManagerService(): IFocusManagerService;

    // AS3: .../src/com/sulake/core/window/services/IInternalWindowServices.as::getToolTipAgentService()
    getToolTipAgentService(): IToolTipAgentService;

    // AS3: .../src/com/sulake/core/window/services/IInternalWindowServices.as::getGestureAgentService()
    getGestureAgentService(): IGestureAgentService;
}
