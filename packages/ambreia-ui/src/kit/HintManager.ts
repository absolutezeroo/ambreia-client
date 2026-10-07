import type {IWindow} from '../IWindow';
import type {IWindowManager} from './IWindowManager';
import {HintTarget} from './HintTarget';
import type {IWindowUpdateReceiver} from '../IWindowUpdateReceiver';

/**
 * Manages hint windows that point to registered UI elements.
 *
 * Supports two styles: vertical (1) and horizontal (default).
 * Uses the Motion framework for smooth animations.
 *
 * @see sources/win63_version/habbo/window/HintManager.as
 */
export class HintManager
implements IWindowUpdateReceiver
{
    // Derived name: `VERTICAL_PADDING` is declared in no AS3 tree — the trace points
    // at the class it belongs to, but the identifier itself is this port's.
    // AS3: sources/win63_version/habbo/window/HintManager.as::VERTICAL_PADDING
    private static readonly VERTICAL_PADDING: number = 10;
    // TS-only: replaces AS3 Motion duration constant
    private static readonly ANIMATION_DURATION: number = 400;
    // Derived name: `MIN_DISTANCE` is declared in no AS3 tree — the trace points
    // at the class it belongs to, but the identifier itself is this port's.
    // AS3: sources/win63_version/habbo/window/HintManager.as::MIN_DISTANCE
    private static readonly MIN_DISTANCE: number = 15;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HintManager.as::_windowManager
    private _windowManager: IWindowManager;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HintManager.as::_registeredWindows (Dictionary)
    private _registeredWindows: Map<string, HintTarget> = new Map();
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HintManager.as::_activeHint
    private _activeHint: HintTarget | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HintManager.as::_hint
    private _hint: IHintWindow | null = null;
    // AS3: sources/win63_version/habbo/window/HintManager.as::var_5208
    private _targetRect: { x: number; y: number; width: number; height: number } | null = null;
    // AS3: sources/win63_version/habbo/window/HintManager.as::var_2535
    private _currentRect: { x: number; y: number; width: number; height: number } | null = null;
    // TS-only: animation state (replaces AS3 Motion framework)
    private _animationStartTime: number = 0;
    private _animationDuration: number = 0;
    private _animationFromRect: { x: number; y: number; width: number; height: number } | null = null;
    private _animationToRect: { x: number; y: number; width: number; height: number } | null = null;
    private _animationActive: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HintManager.as::HintManager()
    constructor(windowManager: IWindowManager)
    {
        this._windowManager = windowManager;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/ResourceManager.as::_disposed
    private _disposed: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HintManager.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HintManager.as::get activeKey()
    private get activeKey(): string | null
    {
        return this._activeHint?.key ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HintManager.as::registerWindow()
    public registerWindow(key: string, window: IWindow, style: number = 0): void
    {
        if(this._registeredWindows.has(key))
        {
            this.unregisterWindow(key);
        }

        this._registeredWindows.set(key, new HintTarget(window, key, style));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HintManager.as::unregisterWindow()
    public unregisterWindow(key: string): void
    {
        if(this._activeHint && this.activeKey === key)
        {
            this.hideHint();
        }

        this._registeredWindows.delete(key);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HintManager.as::showHint()
    public showHint(key: string, rect: { x: number; y: number; width: number; height: number } | null = null): void
    {
        const target = this._registeredWindows.get(key);

        if(!target || !target.window || key === this.activeKey) return;

        this.hideHint();

        const hint = target.window.context.create(
            '',
            '',
            23,
            0,
            0,
            {x: 0, y: 0, width: 0, height: 0},
            null,
            null,
            0
        ) as unknown as IHintWindow | null;

        if(!hint) return;

        hint.fitSizeToContents = true;
        hint.visible = false;

        switch(target.style - 1)
        {
            case 0:
                hint.assetUri = 'common_green_arrow_vertical';
                break;
            default:
                hint.assetUri = 'common_green_arrow_horizontal';
        }

        this._hint = hint;

        this._activeHint = target;
        this._targetRect = rect;
        this._currentRect = this.getTargetRect(target.window);

        if(rect && this._currentRect)
        {
            this.animateHint(rect);
        }
        else
        {
            this.registerForUpdates();
            this.update(0);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HintManager.as::hideHint()
    public hideHint(): void
    {
        this.unregisterFromUpdates();
        if(this._hint)
        {
            this._hint.dispose();
            this._hint = null;
        }

        this._activeHint = null;
        this._targetRect = null;
        this._currentRect = null;
        this._animationActive = false;
        this._animationFromRect = null;
        this._animationToRect = null;
        this._animationStartTime = 0;
        this._animationDuration = 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HintManager.as::hideMatchingHint()
    public hideMatchingHint(key: string): void
    {
        if(this.activeKey === key)
        {
            this.hideHint();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HintManager.as::update()
    public update(_time: number): void
    {
        if(!this._activeHint || !this._hint || !this._activeHint.window) return;

        const globalPos = {x: 0, y: 0};
        this._activeHint.window.getGlobalPosition(globalPos);

        if(globalPos.x === 0 && globalPos.y === 0)
        {
            return;
        }

        if(this._animationActive && this._animationFromRect && this._animationToRect)
        {
            const elapsed = performance.now() - this._animationStartTime;
            const t = Math.min(1, elapsed / Math.max(1, this._animationDuration));
            const eased = 1 - Math.pow(1 - t, 2);

            this._hint.x = this._animationFromRect.x + ((this._animationToRect.x - this._animationFromRect.x) * eased);
            this._hint.y = this._animationFromRect.y + ((this._animationToRect.y - this._animationFromRect.y) * eased);
            this._hint.width = this._animationFromRect.width + ((this._animationToRect.width - this._animationFromRect.width) * eased);
            this._hint.height = this._animationFromRect.height + ((this._animationToRect.height - this._animationFromRect.height) * eased);
            this._hint.visible = true;

            if(t >= 1)
            {
                this._animationActive = false;
                this._animationFromRect = null;
                this._animationToRect = null;
            }
            else
            {
                return;
            }
        }

        const previousZoomX = this._hint.zoomX;
        const previousZoomY = this._hint.zoomY;
        const oscillation = 5 * Math.abs(Math.sin(Date.now() * 0.003));

        switch(this._activeHint.style - 1)
        {
            case 0:
            {
                if(globalPos.y - this._hint.height - HintManager.VERTICAL_PADDING > 0)
                {
                    const targetY = globalPos.y - this._hint.height;

                    if(this._hint.y === 0)
                    {
                        this._hint.y = Math.max(targetY - HintManager.ANIMATION_DURATION, HintManager.MIN_DISTANCE);
                    }

                    if(targetY - this._hint.y > HintManager.MIN_DISTANCE + HintManager.VERTICAL_PADDING)
                    {
                        this._hint.y += HintManager.MIN_DISTANCE;
                    }
                    else
                    {
                        this._hint.y = targetY - HintManager.VERTICAL_PADDING - oscillation;
                    }

                    this._hint.zoomY = 1;
                }
                else
                {
                    const targetBottom = globalPos.y + this._activeHint.window.height;
                    const desktopHeight = this._activeHint.window.desktop?.height ?? 0;

                    if(this._hint.y === 0)
                    {
                        this._hint.y = Math.min(desktopHeight - this._hint.height, this._hint.y + HintManager.ANIMATION_DURATION);
                    }

                    if(targetBottom - this._hint.y > HintManager.MIN_DISTANCE + HintManager.VERTICAL_PADDING)
                    {
                        this._hint.y -= HintManager.MIN_DISTANCE;
                    }
                    else
                    {
                        this._hint.y = targetBottom + HintManager.VERTICAL_PADDING + oscillation;
                    }

                    this._hint.zoomY = -1;
                }

                this._hint.x = globalPos.x + ((this._activeHint.window.width - this._hint.width) / 2);
                break;
            }
            default:
            {
                const desktopWidth = this._activeHint.window.desktop?.width ?? 0;

                if(globalPos.x + (this._activeHint.window.width / 2) > (desktopWidth / 2))
                {
                    this._hint.x = globalPos.x - this._hint.width - HintManager.VERTICAL_PADDING - oscillation;
                    this._hint.zoomX = 1;
                }
                else
                {
                    this._hint.x = globalPos.x + this._activeHint.window.width + HintManager.VERTICAL_PADDING + oscillation;
                    this._hint.zoomX = -1;
                }

                this._hint.y = globalPos.y + ((this._activeHint.window.height - this._hint.height) / 2);
            }
        }

        if(this._hint.zoomX !== previousZoomX || this._hint.zoomY !== previousZoomY)
        {
            this._hint.invalidate();
        }

        this._hint.visible = this._activeHint.window.visible;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HintManager.as::dispose()
    public dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;

        this.hideHint();
        this._registeredWindows.clear();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HintManager.as::getTargetRect()
    private getTargetRect(window: IWindow): { x: number; y: number; width: number; height: number }
    {
        const globalPos = {x: 0, y: 0};
        window.getGlobalPosition(globalPos);

        if(!this._hint || !this._activeHint)
        {
            return {
                x: globalPos.x,
                y: globalPos.y,
                width: window.width,
                height: window.height
            };
        }

        const rect = {x: 0, y: 0, width: this._hint.width, height: this._hint.height};

        switch(this._activeHint.style - 1)
        {
            case 0:
                if(globalPos.y - this._hint.height - HintManager.VERTICAL_PADDING > 0)
                {
                    rect.y = globalPos.y - this._hint.height - HintManager.VERTICAL_PADDING;
                }
                else
                {
                    rect.y = globalPos.y + window.height + HintManager.VERTICAL_PADDING;
                }

                rect.x = globalPos.x + ((window.width - this._hint.width) / 2);
                break;
            default:
                if(globalPos.x + (window.width / 2) > ((window.desktop?.width ?? 0) / 2))
                {
                    rect.x = globalPos.x - this._hint.width - HintManager.VERTICAL_PADDING;
                }
                else
                {
                    rect.x = globalPos.x + window.width + HintManager.VERTICAL_PADDING;
                }

                rect.y = globalPos.y + ((window.height - this._hint.height) / 2);
        }

        return rect;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HintManager.as::animateHint()
    // TS note: in AS3 registerForUpdates() was called in motionComplete() (after animation).
    // In TS the animation is driven by the update loop itself, so registerForUpdates() must
    // be called before the animation starts.
    private animateHint(rect: { x: number; y: number; width: number; height: number }): void
    {
        if(!this._hint || !this._currentRect) return;

        this._hint.x = rect.x;
        this._hint.y = rect.y;
        this._hint.visible = true;

        const dx = rect.x - this._currentRect.x;
        const dy = rect.y - this._currentRect.y;
        const distance = Math.sqrt((dx * dx) + (dy * dy));
        const duration = 500 - Math.abs((1 / Math.max(1, distance)) * 100 * 500 * 0.5);

        const targetWidth = this._hint.width;
        const targetHeight = this._hint.height;

        this._hint.width *= 0.4;
        this._hint.height *= 0.4;

        this._animationFromRect = {
            x: rect.x,
            y: rect.y,
            width: this._hint.width,
            height: this._hint.height
        };
        this._animationToRect = {
            x: this._currentRect.x,
            y: this._currentRect.y,
            width: targetWidth,
            height: targetHeight
        };
        this._animationDuration = duration;
        this._animationStartTime = performance.now();
        this._animationActive = true;

        this.registerForUpdates();
    }

    // TS-only: registers with the window manager's update loop (AS3 used ENTER_FRAME)
    private registerForUpdates(): void
    {
        const updateAwareManager = this._windowManager as unknown as {
            registerUpdateReceiver?: (receiver: IWindowUpdateReceiver, priority: number) => void
            context?: {
                registerUpdateReceiver?: (receiver: IWindowUpdateReceiver, priority: number) => void
            }
        };

        updateAwareManager.registerUpdateReceiver?.(this, 10);
        updateAwareManager.context?.registerUpdateReceiver?.(this, 10);
    }

    // TS-only: unregisters from the window manager's update loop
    private unregisterFromUpdates(): void
    {
        const updateAwareManager = this._windowManager as unknown as {
            removeUpdateReceiver?: (receiver: IWindowUpdateReceiver) => void
            context?: {
                removeUpdateReceiver?: (receiver: IWindowUpdateReceiver) => void
            }
        };

        updateAwareManager.removeUpdateReceiver?.(this);
        updateAwareManager.context?.removeUpdateReceiver?.(this);
    }
}

interface IHintWindow extends IWindow
{
    assetUri: string;
    fitSizeToContents: boolean;
    zoomX: number;
    zoomY: number;
}
