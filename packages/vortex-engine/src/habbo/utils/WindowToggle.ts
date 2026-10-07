import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IDisposable} from '@ambreia/common/IDisposable';

/**
 * Toggles a window's visibility, correctly handling the case where another
 * window on the desktop overlaps it (activate instead of hide).
 *
 * @see sources/win63_version/habbo/utils/WindowToggle.as
 */
export class WindowToggle implements IDisposable
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/WindowToggle.as::RESULT_SHOW
    public static readonly RESULT_SHOW: number = 0;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/WindowToggle.as::RESULT_ACTIVATE
    public static readonly RESULT_ACTIVATE: number = 1;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/WindowToggle.as::RESULT_HIDE
    public static readonly RESULT_HIDE: number = 2;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/WindowToggle.as::_window
    private _window: IWindow | null;
    private _container: IWindowContainer | null;
    private _showFunction: (() => void) | null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/WindowToggle.as::_hideFunction
    private _hideFunction: (() => void) | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/WindowToggle.as::WindowToggle()
    constructor(
        window: IWindow,
        container: IWindowContainer,
        showFunction: (() => void) | null = null,
        hideFunction: (() => void) | null = null
    )
    {
        this._window = window;
        this._container = container;
        this._showFunction = showFunction;
        this._hideFunction = hideFunction;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/WindowToggle.as::isHiddenByOtherWindows()
    static isHiddenByOtherWindows(window: IWindow): boolean
    {
        const desktop = window.desktop as unknown as IWindowContainer | null;

        if(desktop === null)
        {
            throw new Error('Window must be contained by the desktop!');
        }

        const childCount = desktop.numChildren;
        const index = desktop.getChildIndex(window);

        if(index < 0)
        {
            throw new Error('Window must be contained by the desktop!');
        }

        const windowRect = {x: 0, y: 0, width: 0, height: 0};

        window.getGlobalRectangle(windowRect);

        const otherRect = {x: 0, y: 0, width: 0, height: 0};

        for(let i = index + 1; i < childCount; i++)
        {
            const other = desktop.getChildAt(i);

            if(other !== null && other.visible)
            {
                other.getGlobalRectangle(otherRect);

                if(
                    windowRect.x < otherRect.x + otherRect.width &&
					windowRect.x + windowRect.width > otherRect.x &&
					windowRect.y < otherRect.y + otherRect.height &&
					windowRect.y + windowRect.height > otherRect.y
                )
                {
                    return true;
                }
            }
        }

        return false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/WindowToggle.as::get window()
    get window(): IWindow | null
    {
        return this._window;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/WindowToggle.as::get visible()
    get visible(): boolean
    {
        return !!this._window && this._window.visible && !!this._window.parent;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/WindowToggle.as::get active()
    get active(): boolean
    {
        return this.visible && !!this._window && this._window.getStateFlag(1);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/WindowToggle.as::_disposed
    private _disposed: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/WindowToggle.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/WindowToggle.as::dispose()
    dispose(): void
    {
        if(this._disposed) return;

        if(this._window)
        {
            this._window.dispose();
            this._window = null;
        }

        this._container = null;
        this._disposed = true;
        this._showFunction = null;
        this._hideFunction = null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/WindowToggle.as::show()
    show(): void
    {
        if(!this._window || !this._container) return;

        if(this._window.parent !== this._container)
        {
            this._container.addChild(this._window);
        }

        if(!this._window.visible)
        {
            this._window.visible = true;
        }

        this._window.activate();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/WindowToggle.as::hide()
    hide(): void
    {
        if(!this._window || !this._container) return;

        if(this._window.parent === this._container)
        {
            this._container.removeChild(this._window);
        }

        if(this._window.visible)
        {
            this._window.visible = false;
        }

        this._window.deactivate();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/WindowToggle.as::toggle()
    toggle(): void
    {
        if(this.visible)
        {
            if(this.active)
            {
                if(this._hideFunction === null) this.hide();
                else this._hideFunction();
            }
            else if(this._window && WindowToggle.isHiddenByOtherWindows(this._window))
            {
                this._window.activate();
            }
            else
            {
                if(this._hideFunction === null) this.hide();
                else this._hideFunction();
            }
        }
        else
        {
            if(this._showFunction === null) this.show();
            else this._showFunction();
        }
    }
}
