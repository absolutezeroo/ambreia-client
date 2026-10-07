import type {IMouseScalingService} from './IMouseScalingService';
import type {IWindow} from '../IWindow';
import {WindowMouseOperator} from './WindowMouseOperator';
import {WindowParam} from '../enum/WindowParam';

/**
 * Mouse scaling service.
 *
 * Resizes the target window by the mouse delta, honouring the
 * horizontal/vertical flags passed via {@link begin}.
 *
 * @see sources/win63_version/core/window/services/WindowMouseScaler.as
 */
export class WindowMouseScaler extends WindowMouseOperator implements IMouseScalingService
{
    /**
	 * Begin a scaling operation.
	 *
	 * @param window - The target window
	 * @param scalingFlags - Combination of HORIZONTAL/VERTICAL_MOUSE_SCALING_TRIGGER
	 */
    public override begin(window: IWindow, scalingFlags: number = 0): IWindow | null
    {
        return super.begin(window, scalingFlags);
    }

    /**
	 * Scale the window by the mouse delta.
	 *
	 * @param x - Current mouse X (stage coordinates)
	 * @param y - Current mouse Y (stage coordinates)
	 */
    public override operate(x: number, y: number): void
    {
        if(!this._window || this._window.disposed) return;

        const dx: number = (this._flags & WindowParam.HORIZONTAL_MOUSE_SCALING_TRIGGER) ? (x - this._mouse.x) : 0;
        const dy: number = (this._flags & WindowParam.VERTICAL_MOUSE_SCALING_TRIGGER) ? (y - this._mouse.y) : 0;

        this._window.scale(dx, dy);
    }
}
