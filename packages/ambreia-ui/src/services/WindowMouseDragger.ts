import type {IMouseDraggingService} from './IMouseDraggingService';
import {WindowMouseOperator} from './WindowMouseOperator';

/**
 * Mouse dragging service.
 *
 * Moves the target window by the mouse delta relative to the
 * initial grab offset. The {@link operate} override calls
 * {@link IWindow.offset} with the delta.
 *
 * @see sources/win63_version/core/window/services/WindowMouseDragger.as
 */
export class WindowMouseDragger extends WindowMouseOperator implements IMouseDraggingService
{
    /**
	 * Move the window by the mouse delta.
	 *
	 * @param x - Current mouse X (stage coordinates)
	 * @param y - Current mouse Y (stage coordinates)
	 */
    public override operate(x: number, y: number): void
    {
        this._mouse.x = x;
        this._mouse.y = y;
        this.getMousePositionRelativeTo(this._window!, this._mouse, this._relativePos);
        this._window!.offset(this._relativePos.x - this._offset.x, this._relativePos.y - this._offset.y);
    }
}
