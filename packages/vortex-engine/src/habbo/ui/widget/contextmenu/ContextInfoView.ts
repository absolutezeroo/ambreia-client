/**
 * ContextInfoView — base class for the context-menu bubbles (own-avatar menu, …).
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/contextmenu/ContextInfoView.as
 *
 * Owns the built menu window, attaches it to the desktop, and repositions it
 * each frame relative to the avatar's on-screen rectangle (with vertical
 * smoothing). Adaptations vs AS3: the auto-hide Flash Timer → setTimeout; the
 * BitmapData copyPixels in setImageAsset → an ImageBitmap set on the window.
 */
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {BitmapDataAsset} from '@ambreia/common/assets/BitmapDataAsset';
import {FixedSizeStack} from '@habbo/utils/FixedSizeStack';
import {RoomWidgetUserActionMessage} from '../messages/RoomWidgetUserActionMessage';
import type {IContextMenuParentWidget} from './IContextMenuParentWidget';
import {WindowMouseEvent} from '@ambreia/ui/events/WindowMouseEvent';

export interface IScreenRectangle
{
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
}

export interface IScreenPoint
{
    x: number;
    y: number;
}

export class ContextInfoView
{
    // AS3: .../src/com/sulake/habbo/ui/widget/contextmenu/ContextInfoView.as::CONTEXT_INFO_DELAY
    protected static readonly CONTEXT_INFO_DELAY: number = 3000;

    /**
	 * The palette every context-menu subclass paints its own controls with
	 *
	 * All six are ARGB with the alpha byte set, which is why the button and icon values look
	 * larger than a colour: `0xFF` << 24 is already 4 278 190 080. The link pair is plain RGB —
	 * AS3 writes them into `textColor`, which takes no alpha.
	 */
    // AS3: .../src/com/sulake/habbo/ui/widget/contextmenu/ContextInfoView.as::BUTTON_COLOR_DEFAULT
    protected static readonly BUTTON_COLOR_DEFAULT: number = 4281149991;

    // AS3: .../src/com/sulake/habbo/ui/widget/contextmenu/ContextInfoView.as::BUTTON_COLOR_HOVER
    protected static readonly BUTTON_COLOR_HOVER: number = 4282950861;

    // AS3: .../src/com/sulake/habbo/ui/widget/contextmenu/ContextInfoView.as::LINK_COLOR_ACTIONS_DEFAULT
    protected static readonly LINK_COLOR_ACTIONS_DEFAULT: number = 16777215;

    // AS3: .../src/com/sulake/habbo/ui/widget/contextmenu/ContextInfoView.as::LINK_COLOR_ACTIONS_HOVER
    protected static readonly LINK_COLOR_ACTIONS_HOVER: number = 9552639;

    // AS3: .../src/com/sulake/habbo/ui/widget/contextmenu/ContextInfoView.as::ICON_COLOR_ENABLED
    protected static readonly ICON_COLOR_ENABLED: number = 13947341;

    // AS3: .../src/com/sulake/habbo/ui/widget/contextmenu/ContextInfoView.as::ICON_COLOR_DISABLED
    protected static readonly ICON_COLOR_DISABLED: number = 5789011;

    protected static _minimized: boolean = false;

    // AS3: .../src/com/sulake/habbo/ui/widget/contextmenu/ContextInfoView.as::_window
    protected _window: IWindowContainer | null = null;
    protected _minimizedWindow: IWindowContainer | null = null;
    protected _activeView: IWindowContainer | null = null;
    protected _widget: IContextMenuParentWidget;
    protected _mouseOver: boolean = false;
    protected _positionStack: FixedSizeStack = new FixedSizeStack(25);
    protected _lastY: number = -1000000;
    // AS3: .../src/com/sulake/habbo/ui/widget/contextmenu/ContextInfoView.as::_disposed
    protected _disposed: boolean = false;
    // AS3: .../src/com/sulake/habbo/ui/widget/contextmenu/ContextInfoView.as::_forceActivateOnUpdate
    private _forceActivateOnUpdate: boolean = true;
    // AS3: .../src/com/sulake/habbo/ui/widget/contextmenu/ContextInfoView.as::_forcedPositionUpdate
    private _forcedPositionUpdate: boolean = false;

    /**
     * The window this view has actually placed. Anything else — null, or a window swapped in by
     * `updateWindow()` — has never been positioned, and for a window that means (0, 0).
     */
    // TS-only: guards a hole AS3's own gate leaves open; no counterpart there.
    private _positionedView: IWindowContainer | null = null;
    protected _autoHideTimer: ReturnType<typeof setTimeout> | null = null;
    protected _autoHideDelay: number = 3000;
    protected _hidePending: boolean = false;
    protected _fading: boolean = false;
    protected _blend: number = 1;
    // AS3: .../src/com/sulake/habbo/ui/widget/contextmenu/ContextInfoView.as::_fadeTime
    private _fadeTime: number = 0;
    // AS3: .../src/com/sulake/habbo/ui/widget/contextmenu/ContextInfoView.as::_fadeLength
    private _fadeLength: number = 500;
    // AS3: _SafeStr_4773 — auto-hide enabled (OwnAvatarMenuView sets it false).
    protected _autoHideEnabled: boolean = true;

    // AS3: ContextInfoView.as::ContextInfoView()
    constructor(widget: IContextMenuParentWidget)
    {
        this._widget = widget;
    }

    // AS3: ContextInfoView.as::setupContext()
    protected static setupContext(view: ContextInfoView): void
    {
        view._hidePending = false;
        view._fadeLength = 500;
        view._fading = false;
        view._blend = 1;
        view._mouseOver = false;

        if(view._autoHideEnabled)
        {
            view.startAutoHideTimer();
        }

        view.updateWindow();
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/contextmenu/ContextInfoView.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: ContextInfoView.as::get maximumBlend()
    public get maximumBlend(): number
    {
        return 1;
    }

    // AS3: ContextInfoView.as::get window()
    public get window(): IWindowContainer | null
    {
        return this._window;
    }

    // AS3: ContextInfoView.as::updateWindow() — overridden by subclasses.
    protected updateWindow(): void
    {
    }

    /**
	 * Forces the next `update()` to re-activate the view even if nothing about it changed
	 *
	 * Set by a subclass that has just rebuilt its contents, so the menu comes back to the front
	 * rather than being left where the last position pass parked it.
	 */
    // AS3: .../src/com/sulake/habbo/ui/widget/contextmenu/ContextInfoView.as::set forceActivateOnUpdate()
    public set forceActivateOnUpdate(value: boolean)
    {
        this._forceActivateOnUpdate = value;
    }

    /**
	 * Binds a click handler to a control, tolerating a control the layout does not have
	 *
	 * Every subclass wires optional children this way — a menu row that a given context does not
	 * offer is simply absent from the layout rather than hidden.
	 */
    // AS3: .../src/com/sulake/habbo/ui/widget/contextmenu/ContextInfoView.as::addMouseClickListener()
    protected addMouseClickListener(window: IWindow | null, handler: (event: WindowEvent) => void): void
    {
        window?.addEventListener(WindowMouseEvent.CLICK, handler);
    }

    /**
	 * The base click: start a name change, then close the menu
	 *
	 * AS3 puts this on the base class because the name row is the one control every context menu
	 * shares. Subclasses that offer more bind their own handlers on top.
	 */
    // AS3: .../src/com/sulake/habbo/ui/widget/contextmenu/ContextInfoView.as::clickHandler()
    protected clickHandler(_event: WindowEvent): void
    {
        this._widget.messageListener?.processWidgetMessage(
            new RoomWidgetUserActionMessage(RoomWidgetUserActionMessage.START_NAME_CHANGE)
        );

        this._widget.removeView(this, false);
    }

    // AS3: ContextInfoView.as::set activeView()
    protected set activeView(value: IWindowContainer | null)
    {
        if(!value) return;

        if(this._activeView)
        {
            this._activeView.parent = null;
        }

        this._activeView = value;
    }

    // AS3: ContextInfoView.as::getOffset()
    protected getOffset(_rect: IScreenRectangle): number
    {
        return -(this._activeView?.height ?? 0) - 4;
    }

    // AS3: ContextInfoView.as::getMaximumVerticalLead()
    protected getMaximumVerticalLead(rect: IScreenRectangle): number
    {
        return Math.floor(rect.height * 0.05);
    }

    // AS3: ContextInfoView.as::update()
    public update(rect: IScreenRectangle | null, screenLocation: IScreenPoint, time: number): void
    {
        if(!rect) return;

        if(!this._activeView)
        {
            this.updateWindow();
        }

        if(!this._activeView) return;

        if(this._fading)
        {
            this._fadeTime += time;
            this._blend = (1 - this._fadeTime / this._fadeLength) * this.maximumBlend;
        }
        else
        {
            this._blend = this.maximumBlend;
        }

        if(this._blend <= 0)
        {
            this._widget.removeView(this, false);

            return;
        }

        // DEVIATION: AS3 gates this on `!_mouseOver || _forcedPositionUpdate` alone, so a view whose
        //   very first update arrives while the pointer is over it is shown by the `show()` below
        //   without ever having been given a position — and a window that has never been positioned
        //   is at (0, 0). That is the stranded bubble in the top-left corner: visible, parented to
        //   the desktop, following nothing, and impossible to dismiss because the thing that would
        //   move it is the branch that never runs. `_positioned` forces the first placement through
        //   regardless; every later frame behaves exactly as AS3 does.
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/contextmenu/ContextInfoView.as::update()
        if(this._positionedView !== this._activeView || !this._mouseOver || this._forcedPositionUpdate)
        {
            const offset = this.getOffset(rect);
            const raw = screenLocation.y - rect.top;

            this._positionStack.addValue(raw);

            let smoothed = this._positionStack.getMax();

            if(smoothed < this._lastY - 3)
            {
                smoothed = this._lastY - 3;
            }

            this._lastY = smoothed;

            const top = rect.top + offset;
            const minY = top - this.getMaximumVerticalLead(rect);
            let finalY = (screenLocation.y - smoothed) + offset;

            if(finalY < minY)
            {
                finalY = minY;
            }

            this._activeView.x = screenLocation.x - this._activeView.width / 2;
            this._activeView.y = finalY;
            this._forcedPositionUpdate = false;
            this._positionedView = this._activeView;
        }

        this._activeView.blend = this._blend;
        this.show();
    }

    // AS3: ContextInfoView.as::show()
    public show(): void
    {
        if(!this._activeView) return;

        this._activeView.visible = true;

        if(!this._activeView.parent)
        {
            // Layer 0, and every context view is *built* on it too — AS3 passes it explicitly,
            // `buildFromXML(_loc1_, 0)`, at all twelve of these build sites even though its own
            // default is 1. That is not decoration: a layer is a whole WindowContext with its own
            // desktop, and `WindowContext.createWindow()` parents a root window to it
            // (`parent ?? _desktop`), so a view built on the default landed on `desktop_1` and
            // painted over every window on `desktop_0` — including the menus it is supposed to sit
            // under. The `!parent` test below then never fired, because the build had already given
            // it one, so nothing brought it back down here either.
            const desktop = this._widget.windowManager.getDesktop(0);

            if(desktop) (desktop as IWindowContainer).addChild(this._activeView);
        }

        if(this._forceActivateOnUpdate)
        {
            this._activeView.activate();
        }
    }

    // AS3: ContextInfoView.as::hide()
    public hide(fade: boolean): void
    {
        if(!this._activeView) return;

        if(!this._hidePending && fade && this._autoHideTimer !== null)
        {
            this._hidePending = true;
            this.startAutoHideTimer();
        }
        else
        {
            this._activeView.visible = false;
            this._activeView.parent = null;
        }
    }

    // AS3: ContextInfoView.as::onMouseHoverEvent() — freezes the position on hover.
    // AS3 adaptation: the WME_OUT hit-test refinement is dropped (simple freeze/unfreeze).
    protected onMouseHoverEvent = (event: WindowEvent, _window: IWindow): void =>
    {
        if(event.type === 'WME_OVER')
        {
            this._mouseOver = true;
        }
        else if(event.type === 'WME_OUT')
        {
            this._mouseOver = false;
        }
    };

    /**
     * Paints one named asset onto a bitmap window.
     *
     * `centered` is AS3's third argument, and it only picks the *offset*: both branches there
     * allocate a BitmapData the size of the *window* and `copyPixels()` the asset into it, at the
     * centre or at (0, 0). Handing the raw asset over for the uncentered case is not the same
     * thing — `<bitmap>` windows default to `stretched_x/y = true`, so an asset smaller than its
     * window came out scaled up instead of sitting in the corner of a transparent buffer.
     */
    // AS3: ContextInfoView.as::setImageAsset() — BitmapData copyPixels → ImageBitmap.
    protected setImageAsset(target: IWindow | null, assetName: string, centered: boolean = false): void
    {
        if(!target || !this._widget.assets) return;

        const asset = this._widget.assets.getAssetByName(assetName) as BitmapDataAsset | null;
        const content = asset?.content as ImageBitmap | null;

        if(!content) return;

        const canvas = new OffscreenCanvas(Math.max(1, target.width), Math.max(1, target.height));
        const ctx = canvas.getContext('2d');

        if(ctx === null) return;

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
            content,
            centered ? Math.trunc((canvas.width - content.width) / 2) : 0,
            centered ? Math.trunc((canvas.height - content.height) / 2) : 0
        );

        (target as IWindow & { bitmap: ImageBitmap | null }).bitmap = canvas.transferToImageBitmap();
    }

    // AS3: ContextInfoView.as::get/set the static "minimized" flag (_SafeStr_5107).
    protected get minimized(): boolean
    {
        return ContextInfoView._minimized;
    }

    // AS3: ContextInfoView.as::setMinimized()
    protected setMinimized(value: boolean): void
    {
        ContextInfoView._minimized = value;
        this._forcedPositionUpdate = true;
        this.updateWindow();
    }

    // AS3: ContextInfoView.as::getMinimizedView() — builds the minimized_menu bubble.
    protected getMinimizedView(): IWindowContainer | null
    {
        if(!this._minimizedWindow)
        {
            this._minimizedWindow = this._widget.windowManager.buildWidgetLayout('minimized_menu', 0) as IWindowContainer | null;

            if(!this._minimizedWindow) return null;

            const minimize = this._minimizedWindow.findChildByName('minimize');

            if(minimize)
            {
                minimize.procedure = this.onMinimizedProc;
            }

            this._minimizedWindow.procedure = this.onMouseHoverEvent;
        }

        return this._minimizedWindow;
    }

    // AS3: ContextInfoView.as::onMinimize() → collapse to the minimized bubble.
    protected onMinimize = (event: WindowEvent, _window: IWindow): void =>
    {
        if(event.type === 'WME_CLICK') this.setMinimized(true);
    };

    // AS3: ContextInfoView.as::onMaximize()/onMinimizeHover() — restore + hover tint,
    // both wired on the minimized bubble's "minimize" region.
    private onMinimizedProc = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type === 'WME_CLICK')
        {
            this.setMinimized(false);

            return;
        }

        const icon = (window as IWindowContainer).findChildByName?.('icon');

        if(icon) icon.color = event.type === 'WME_OVER' ? 4282950861 : 16777215;
    };

    private startAutoHideTimer(): void
    {
        this.stopAutoHideTimer();

        this._autoHideTimer = setTimeout(() => this.onTimerComplete(), this._autoHideDelay);
    }

    private stopAutoHideTimer(): void
    {
        if(this._autoHideTimer !== null)
        {
            clearTimeout(this._autoHideTimer);
            this._autoHideTimer = null;
        }
    }

    // AS3: ContextInfoView.as::onTimerComplete()
    private onTimerComplete(): void
    {
        this._fading = true;
        this._fadeTime = 0;
        this.hide(true);
    }

    // AS3: ContextInfoView.as::dispose()
    public dispose(): void
    {
        if(this._disposed) return;

        this.stopAutoHideTimer();
        this._activeView = null;

        if(this._window)
        {
            this._window.dispose();
            this._window = null;
        }

        if(this._minimizedWindow)
        {
            this._minimizedWindow.dispose();
            this._minimizedWindow = null;
        }

        this._disposed = true;
    }
}
