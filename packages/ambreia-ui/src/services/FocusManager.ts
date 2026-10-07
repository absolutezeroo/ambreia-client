import type {IFocusManagerService} from './IFocusManagerService';
import type {IWindow} from '../IWindow';

/**
 * Focus manager service.
 *
 * Tracks which window currently has focus and manages focus
 * transitions between windows. When a focused window is removed
 * or loses focus, resolves the next focus target from the
 * registered windows list.
 *
 * In AS3 this listened to Stage activate/focusOut events.
 * In the web port, focus is managed programmatically via
 * setFocus/getFocus calls from the window system.
 *
 * @see sources/win63_version/core/window/services/FocusManager.as
 */
export class FocusManager implements IFocusManagerService
{
    private _focusedWindow: IWindow | null = null;
    private _focusWindows: IWindow[] = [];
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/FocusManager.as::_disposed
    private _disposed: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/FocusManager.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    /**
	 * Set focus to a window.
	 *
	 * @param window - The window to focus, or null to clear focus
	 */
    setFocus(window: IWindow | null): void
    {
        if(this._disposed) return;

        this._focusedWindow = window;
    }

    /**
	 * Get the currently focused window.
	 *
	 * @returns The focused window, or null
	 */
    getFocus(): IWindow | null
    {
        return this._focusedWindow;
    }

    /**
	 * Register a window to be tracked for focus management.
	 *
	 * @param window - The focusable window to register
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/FocusManager.as::registerFocusWindow()
    registerFocusWindow(window: IWindow): void
    {
        if(window === null || this._disposed) return;

        if(this._focusWindows.indexOf(window) === -1)
        {
            this._focusWindows.push(window);

            if(this._focusedWindow === null)
            {
                this._focusedWindow = window;
            }
        }
    }

    /**
	 * Remove a window from focus tracking.
	 *
	 * @param window - The window to remove
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/FocusManager.as::removeFocusWindow()
    removeFocusWindow(window: IWindow): void
    {
        if(window === null || this._disposed) return;

        const index = this._focusWindows.indexOf(window);

        if(index > -1)
        {
            this._focusWindows.splice(index, 1);
        }

        if(this._focusedWindow === window)
        {
            this._focusedWindow = null;
            this.resolveNextFocusTarget();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/FocusManager.as::dispose()
    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this._focusedWindow = null;
        this._focusWindows = [];
    }

    /**
	 * Find and focus the next non-disposed window in the stack.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/FocusManager.as::resolveNextFocusTarget()
    private resolveNextFocusTarget(): void
    {
        let i = this._focusWindows.length;

        while(i-- > 0)
        {
            const window = this._focusWindows[i];

            if(!window.disposed)
            {
                this._focusedWindow = window;
                return;
            }

            this._focusWindows.splice(i, 1);
        }
    }
}
