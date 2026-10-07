import type {IToolTipAgentService} from './IToolTipAgentService';
import type {IWindow} from '../IWindow';
import type {IInteractiveWindow} from '../components/IInteractiveWindow';
import {WindowMouseOperator} from './WindowMouseOperator';
import {WindowContext} from '../WindowContext';

/**
 * Tooltip agent service.
 *
 * Displays floating tooltip windows after a configurable delay
 * when the mouse hovers over a window. Extends WindowMouseOperator
 * to track mouse position and update tooltip location.
 *
 * The tooltip delay defaults to 500ms but can be overridden per
 * window via IInteractiveWindow.toolTipDelay.
 *
 * @see sources/win63_version/core/window/services/WindowToolTipAgent.as
 */
export class WindowToolTipAgent extends WindowMouseOperator implements IToolTipAgentService
{
    private _caption: string = '';
    private _tooltipWindow: IWindow | null = null;
    private _timer: ReturnType<typeof setTimeout> | null = null;
    // AS3: sources/win63_version/core/window/services/WindowToolTipAgent.as::_toolTipOffset
    private _toolTipOffset: { x: number; y: number } = {x: 20, y: 20};
    // AS3: sources/win63_version/core/window/services/WindowToolTipAgent.as::_pointerOffset
    private _pointerOffset: { x: number; y: number } = {x: 0, y: 0};
    private _delay: number = 500;

    /**
	 * Begin tooltip tracking for a window.
	 *
	 * @param window - The window to track
	 * @param flags - Operation flags
	 * @returns The previously tracked window
	 */
    public override begin(window: IWindow, flags: number = 0): IWindow | null
    {
        if(window && !window.disposed)
        {
            if(this.isInteractiveWindow(window))
            {
                this._caption = window.toolTipCaption;
                this._delay = window.toolTipDelay;
            }
            else
            {
                this._caption = window.caption;
                this._delay = 500;
            }

            // AS3 reads the stage's live pointer (`_displayObject.mouseX/mouseY`) here before
            // measuring where inside the window it sits. Without it `_mouse` holds whatever the
            // last drag left behind — (0,0) until something is dragged — so `_pointerOffset`
            // came out as minus the window's global position and every tooltip landed at
            // `_toolTipOffset`, i.e. the top-left corner of the screen.
            this._mouse.x = WindowContext.inputEventQueue?.mouseX ?? 0;
            this._mouse.y = WindowContext.inputEventQueue?.mouseY ?? 0;

            this.getMousePositionRelativeTo(window, this._mouse, this._pointerOffset);

            if(this._timer !== null)
            {
                clearTimeout(this._timer);
            }

            this._timer = setTimeout(() => this.showToolTip(), this._delay);
        }

        return super.begin(window, flags);
    }

    /**
	 * End tooltip tracking for a window.
	 *
	 * @param window - The window to stop tracking
	 * @returns The previously tracked window
	 */
    public override end(window: IWindow): IWindow | null
    {
        if(this._timer !== null)
        {
            clearTimeout(this._timer);
            this._timer = null;
        }

        this.hideToolTip();

        return super.end(window);
    }

    /**
	 * Update tooltip position on mouse move.
	 *
	 * @param x - Current mouse X
	 * @param y - Current mouse Y
	 */
    public override operate(x: number, y: number): void
    {
        if(this._window && !this._window.disposed)
        {
            this._mouse.x = x;
            this._mouse.y = y;
            this.getMousePositionRelativeTo(this._window, this._mouse, this._pointerOffset);

            if(this._tooltipWindow !== null && !this._tooltipWindow.disposed)
            {
                this._tooltipWindow.x = x + this._toolTipOffset.x;
                this._tooltipWindow.y = y + this._toolTipOffset.y;
            }
        }
    }

    /**
	 * Show the tooltip window (IToolTipAgentService).
	 *
	 * @param window - The window whose tooltip to show
	 * @param text - The tooltip text
	 */
    public show(window: IWindow, text: string): void
    {
        this._caption = text;
        this.begin(window);
    }

    /**
	 * Hide the current tooltip (IToolTipAgentService).
	 */
    public hide(): void
    {
        if(this._window)
        {
            this.end(this._window);
        }
    }

    /**
	 * Update the tooltip caption if it has changed.
	 *
	 * @param window - The window whose caption may have changed
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/WindowToolTipAgent.as::updateCaption()
    public updateCaption(window: IWindow): void
    {
        if(window === null || window.disposed || this._tooltipWindow === null || this._tooltipWindow.disposed)
        {
            return;
        }

        let newCaption: string;

        if(this.isInteractiveWindow(window))
        {
            newCaption = window.toolTipCaption;
        }
        else
        {
            newCaption = window.caption;
        }

        if(newCaption !== this._caption)
        {
            this._caption = newCaption;

            if(newCaption === null || newCaption.length === 0)
            {
                this._tooltipWindow.visible = false;
            }
            else
            {
                this._tooltipWindow.caption = newCaption;
                this._tooltipWindow.visible = true;
            }
        }
    }

    public override dispose(): void
    {
        if(this._timer !== null)
        {
            clearTimeout(this._timer);
            this._timer = null;
        }

        this.hideToolTip();

        super.dispose();
    }

    /**
	 * Check if a window implements IInteractiveWindow
	 */
    private isInteractiveWindow(window: IWindow): window is IInteractiveWindow
    {
        return 'toolTipCaption' in window && 'toolTipDelay' in window;
    }

    /**
	 * Create and display the tooltip window.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/WindowToolTipAgent.as::showToolTip()
    private showToolTip(): void
    {
        if(this._timer !== null)
        {
            clearTimeout(this._timer);
            this._timer = null;
        }

        if(!this._window || this._window.disposed) return;

        // Refresh caption from window
        if(this.isInteractiveWindow(this._window))
        {
            this._caption = this._window.toolTipCaption;
        }
        else
        {
            this._caption = this._window.caption;
        }

        // Create tooltip via the window's context if not already created
        if(this._tooltipWindow === null || this._tooltipWindow.disposed)
        {
            // Create tooltip via the window context
            // AS3: context.create(name + "::ToolTip", caption, type=8, style, 32, ...)
            const context = this._window.context;

            if(context)
            {
                this._tooltipWindow = context.create(
                    this._window.name + '::ToolTip',
                    this._caption,
                    8, // WindowType.TOOLTIP
                    this._window.style,
                    32, // WindowParam flags
                    {x: 0, y: 0, width: 0, height: 0},
                    null, null, 0, null, undefined, null
                );

                if(this._tooltipWindow)
                {
                    this._tooltipWindow.caption = this._caption;
                }
            }
        }

        if(this._tooltipWindow)
        {
            const globalPos = {x: 0, y: 0};

            this._window.getGlobalPosition(globalPos);
            this._tooltipWindow.x = globalPos.x + this._pointerOffset.x + this._toolTipOffset.x;
            this._tooltipWindow.y = globalPos.y + this._pointerOffset.y + this._toolTipOffset.y;
            this._tooltipWindow.visible = this._caption.length > 0;
        }
    }

    /**
	 * Destroy the tooltip window.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/WindowToolTipAgent.as::hideToolTip()
    private hideToolTip(): void
    {
        if(this._tooltipWindow !== null && !this._tooltipWindow.disposed)
        {
            this._tooltipWindow.dispose();
            this._tooltipWindow = null;
        }
    }
}
