import type {IWindow} from './IWindow';
import type {IWindowContext} from './IWindowContext';
import type {IWindowFactory} from './IWindowFactory';
import type {IWidgetFactory} from './IWidgetFactory';
import type {IWindowParser} from './utils/IWindowParser';
import type {IWindowRenderer} from './graphics/IWindowRenderer';
import type {IInternalWindowServices} from './services/IInternalWindowServices';
import type {IInputEventTracker} from './IInputEventTracker';
import type {IResourceManager} from './IResourceManager';
import type {IWindowLocalization} from './IWindowLocalization';
import type {ILocalizable} from './ILocalizable';
import type {IWindowLinkTracker} from './IWindowLinkTracker';
import {Classes} from './Classes';
import {SubstituteParentController} from './components/SubstituteParentController';
import {EventProcessorState} from './utils/EventProcessorState';
import {MouseEventProcessor} from './utils/MouseEventProcessor';
import {MouseEventQueue} from './utils/MouseEventQueue';
import {TabletEventQueue} from './utils/tablet/TabletEventQueue';
import {TabletEventProcessor} from './utils/tablet/TabletEventProcessor';

export type WindowContextResizeHost = {
    width: number;
    height: number;
    addEventListener(type: string, listener: (event?: Event) => void): void;
    removeEventListener(type: string, listener: (event?: Event) => void): void;
};

/**
 * Window context implementation.
 *
 * Represents a single rendering layer. Each context has its own desktop,
 * factory, parser, and service manager. The HabboWindowManagerComponent
 * creates 4 contexts (one per WindowContextLayer).
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/WindowContext.as
 */
export class WindowContext implements IWindowContext 
{
    private static readonly MIN_DESKTOP_SIZE = 10;

    // AS3: .../src/com/sulake/core/window/WindowContext.as::INPUT_MODE_MOUSE
    public static readonly INPUT_MODE_MOUSE: number = 0;
    // AS3: .../src/com/sulake/core/window/WindowContext.as::INPUT_MODE_TOUCH
    public static readonly INPUT_MODE_TOUCH: number = 1;
    // AS3: .../src/com/sulake/core/window/WindowContext.as::ERROR_UNKNOWN
    public static readonly ERROR_UNKNOWN: number = 0;
    // AS3: .../src/com/sulake/core/window/WindowContext.as::ERROR_INVALID_WINDOW
    public static readonly ERROR_INVALID_WINDOW: number = 1;
    // AS3: .../src/com/sulake/core/window/WindowContext.as::ERROR_WINDOW_NOT_FOUND
    public static readonly ERROR_WINDOW_NOT_FOUND: number = 2;
    // AS3: .../src/com/sulake/core/window/WindowContext.as::ERROR_WINDOW_ALREADY_EXISTS
    public static readonly ERROR_WINDOW_ALREADY_EXISTS: number = 3;
    // AS3: .../src/com/sulake/core/window/WindowContext.as::ERROR_UNKNOWN_WINDOW_TYPE
    public static readonly ERROR_UNKNOWN_WINDOW_TYPE: number = 4;
    // AS3: .../src/com/sulake/core/window/WindowContext.as::ERROR_DURING_EVENT_HANDLING
    public static readonly ERROR_DURING_EVENT_HANDLING: number = 5;
    // AS3: .../src/com/sulake/core/window/WindowContext.as::inputEventQueue
    public static inputEventQueue: MouseEventQueue | null = null;
    /**
     * Shared renderer reference (AS3: static var_1836).
     * Set by HabboWindowManager when the renderer is created.
     */
    private static _renderer: IWindowRenderer | null = null;
    private static _inputEventProcessor: MouseEventProcessor | null = null;
    // AS3: .../src/com/sulake/core/window/WindowContext.as::inputEventTrackers
    public inputEventTrackers: IInputEventTracker[] = [];
    // AS3: .../src/com/sulake/core/window/WindowContext.as::_localization
    protected _localization: IWindowLocalization | null = null;
    // AS3: .../src/com/sulake/core/window/WindowContext.as::_windowServices
    protected _services: IInternalWindowServices | null = null;
    protected _parser: IWindowParser | null = null;
    protected _factory: IWindowFactory;
    protected _widgetFactory: IWidgetFactory | null = null;
    protected _desktop: IWindow | null = null;
    protected _substituteParent: IWindow | null = null;
    protected _resourceManager: IResourceManager | null = null;
    // AS3: .../src/com/sulake/core/window/WindowContext.as::_throwErrors
    protected _throwErrors: boolean = true;
    // AS3: .../src/com/sulake/core/window/WindowContext.as::_lastError
    protected _lastError: Error | null = null;
    // AS3: .../src/com/sulake/core/window/WindowContext.as::_lastErrorCode
    protected _lastErrorCode: number = -1;
    protected _updating: boolean = false;
    // AS3: .../src/com/sulake/core/window/WindowContext.as::_rendering
    protected _rendering: boolean = false;
    // Narrowed to the width/height + resize-listener surface AS3 actually reads off
    // DisplayObjectContainer here; addChild(desktop)/doubleClickEnabled have no
    // equivalent because this port's desktop attaches to the PixiJS tree elsewhere
    // (HabboWindowManager), not through WindowContext itself.
    // AS3: .../src/com/sulake/core/window/WindowContext.as::_rootDisplayObject
    private _resizeHost: WindowContextResizeHost | null = null;
    private _resizeListener: ((event?: Event) => void) | null = null;
    private _isListeningToResizeHost: boolean = false;
    private readonly _initialDesktopRect: { x: number; y: number; width: number; height: number };
    // AS3: .../src/com/sulake/core/window/WindowContext.as::_name
    private readonly _name: string;
    private _eventProcessorState: EventProcessorState;

    constructor(
        name: string,
        factory: IWindowFactory,
        rect?: { x: number; y: number; width: number; height: number } | null,
        resizeHost?: WindowContextResizeHost | null
    ) 
    {
        this._name = name;
        this._factory = factory;
        this._resizeHost = resizeHost ?? null;

        const substituteParent = new SubstituteParentController(this);

        substituteParent.completeConstruction(null, null, null);
        this._substituteParent = substituteParent;
        this._eventProcessorState = new EventProcessorState(
            WindowContext._renderer,
            null,
            null,
            null,
            null,
            null,
            this.inputEventTrackers
        );

        if(!rect) 
        {
            rect = {x: 0, y: 0, width: 800, height: 600};
        }

        this._initialDesktopRect = rect;

        if(!WindowContext.inputEventQueue || !WindowContext._inputEventProcessor) 
        {
            WindowContext.inputMode = WindowContext.INPUT_MODE_MOUSE;
        }

        // Desktop and parser are lazily initialized or set externally
    }

    private static _inputMode: number = WindowContext.INPUT_MODE_MOUSE;

    // AS3: .../src/com/sulake/core/window/WindowContext.as::get inputMode()
    public static get inputMode(): number 
    {
        return WindowContext._inputMode;
    }

    // AS3: .../src/com/sulake/core/window/WindowContext.as::set inputMode()
    public static set inputMode(value: number) 
    {
        if(WindowContext.inputEventQueue) 
        {
            WindowContext.inputEventQueue.dispose();
            WindowContext.inputEventQueue = null;
        }

        if(WindowContext._inputEventProcessor) 
        {
            WindowContext._inputEventProcessor.dispose();
            WindowContext._inputEventProcessor = null;
        }

        switch(value) 
        {
            case WindowContext.INPUT_MODE_MOUSE:
                WindowContext.inputEventQueue = new MouseEventQueue();
                WindowContext._inputEventProcessor = new MouseEventProcessor();
                WindowContext._inputMode = value;
                break;
            case WindowContext.INPUT_MODE_TOUCH:
                WindowContext.inputEventQueue = new TabletEventQueue();
                WindowContext._inputEventProcessor = new TabletEventProcessor();
                WindowContext._inputMode = value;
                break;
            default:
                WindowContext.inputMode = WindowContext.INPUT_MODE_MOUSE;
                throw new Error(`Unknown input mode ${value}`);
        }
    }

    // AS3: .../src/com/sulake/core/window/WindowContext.as::_linkEventTrackers
    private _linkEventTrackers: IWindowLinkTracker[] = [];

    // AS3: .../src/com/sulake/core/window/WindowContext.as::get linkEventTrackers()
    public get linkEventTrackers(): IWindowLinkTracker[] 
    {
        return this._linkEventTrackers;
    }

    // AS3: .../src/com/sulake/core/window/WindowContext.as::_disposed
    private _disposed: boolean = false;

    // AS3: .../src/com/sulake/core/window/WindowContext.as::get disposed()
    public get disposed(): boolean 
    {
        return this._disposed;
    }

    public get name(): string 
    {
        return this._name;
    }

    /**
     * Sets the shared window renderer for all contexts.
     *
     * @param renderer - The window renderer
     */
    public static setRenderer(renderer: IWindowRenderer | null): void 
    {
        WindowContext._renderer = renderer;
    }

    public setDesktop(desktop: IWindow): void 
    {
        this._desktop = desktop;
        this._eventProcessorState.desktop = desktop;
        this.attachResizeHostListener();
        this.updateDesktopFromHostOrInitialRect();

        if(!this._eventProcessorState.hovered || this._eventProcessorState.hovered.disposed) 
        {
            this._eventProcessorState.hovered = desktop;
        }
    }

    public setDesktopSize(width: number, height: number): void 
    {
        if(!this._desktop) 
        {
            return;
        }

        if(width < WindowContext.MIN_DESKTOP_SIZE || height < WindowContext.MIN_DESKTOP_SIZE) 
        {
            return;
        }

        this._desktop.limits.maxWidth = width;
        this._desktop.limits.maxHeight = height;
        this._desktop.width = width;
        this._desktop.height = height;
    }

    public setServices(services: IInternalWindowServices): void 
    {
        this._services = services;
    }

    public setParser(parser: IWindowParser): void 
    {
        this._parser = parser;
    }

    public setWidgetFactory(widgetFactory: IWidgetFactory): void 
    {
        this._widgetFactory = widgetFactory;
    }

    public setResourceManager(resourceManager: IResourceManager): void 
    {
        this._resourceManager = resourceManager;
    }

    public setLocalizationManager(localization: IWindowLocalization | null): void 
    {
        this._localization = localization;
    }

    // AS3: .../src/com/sulake/core/window/WindowContext.as::getResourceManager()
    public getResourceManager(): IResourceManager | null 
    {
        return this._resourceManager;
    }

    // AS3: .../src/com/sulake/core/window/WindowContext.as::getWindowServices()
    public getWindowServices(): IInternalWindowServices 
    {
        return this._services!;
    }

    // AS3: .../src/com/sulake/core/window/WindowContext.as::getWindowParser()
    public getWindowParser(): IWindowParser 
    {
        return this._parser!;
    }

    // AS3: .../src/com/sulake/core/window/WindowContext.as::getWindowFactory()
    public getWindowFactory(): IWindowFactory 
    {
        return this._factory;
    }

    // AS3: .../src/com/sulake/core/window/WindowContext.as::getDesktopWindow()
    public getDesktopWindow(): IWindow | null 
    {
        return this._desktop;
    }

    // AS3: .../src/com/sulake/core/window/WindowContext.as::getWidgetFactory()
    public getWidgetFactory(): IWidgetFactory | null 
    {
        return this._widgetFactory;
    }

    // AS3: .../src/com/sulake/core/window/WindowContext.as::findWindowByName()
    public findWindowByName(name: string): IWindow | null 
    {
        if(!this._desktop) return null;

        return (this._desktop as any).findChildByName?.(name) ?? null;
    }

    // AS3: .../src/com/sulake/core/window/WindowContext.as::findWindowByTag()
    public findWindowByTag(tag: string): IWindow | null 
    {
        if(!this._desktop) return null;

        return (this._desktop as any).findChildByTag?.(tag) ?? null;
    }

    // AS3: .../src/com/sulake/core/window/WindowContext.as::groupChildrenWithTag()
    public groupChildrenWithTag(tag: string, result: IWindow[], depth: number = 0): number 
    {
        if(!this._desktop) return 0;

        return (this._desktop as any).groupChildrenWithTag?.(tag, result, depth) ?? 0;
    }

    // AS3: .../src/com/sulake/core/window/WindowContext.as::registerLocalizationListener()
    public registerLocalizationListener(key: string, window: IWindow): void 
    {
        if(!this._localization) 
        {
            return;
        }

        this._localization.registerLocalizationListener(key, window as unknown as ILocalizable);
    }

    // AS3: .../src/com/sulake/core/window/WindowContext.as::removeLocalizationListener()
    public removeLocalizationListener(key: string, window: IWindow): void 
    {
        if(!this._localization) 
        {
            return;
        }

        this._localization.removeLocalizationListener(key, window as unknown as ILocalizable);
    }

    // AS3: .../src/com/sulake/core/window/WindowContext.as::create()
    public create(
        name: string,
        caption: string,
        type: number,
        style: number,
        param: number,
        rect: { x: number; y: number; width: number; height: number } | null,
        procedure: ((event: unknown, window: IWindow) => void) | null,
        parent: IWindow | null,
        id: number,
        tags: string[] | null = null,
        dynamicStyle: string = '',
        properties: unknown[] | null = null
    ): IWindow 
    {
        // eslint-disable-next-line no-useless-assignment
        let window: IWindow = null!;
        const windowClass = Classes.getWindowClassByType(type);

        if(!windowClass) 
        {
            this.handleError(
                WindowContext.ERROR_UNKNOWN_WINDOW_TYPE,
                new Error(`Failed to solve implementation for window "${name}"!`)
            );

            return null!;
        }

        if(parent == null)
        {
            if(param & 0x10) // USE_PARENT_GRAPHIC_CONTEXT
            {
                parent = this._substituteParent;
            }
        }

        const resolvedParent = parent ?? this._desktop;

        // The constructor now only stores base fields (name/type/style/rect/
        // tags/id) - it makes no virtual calls and applies neither properties
        // nor a parent. Theme resolution, layout construction, default
        // attributes, property application, procedure assignment, and parent
        // attachment all happen in `completeConstruction()` below, invoked
        // once `new` has returned and every subclass field initializer up the
        // whole prototype chain has already run. This matches the AS3
        // runtime, where a subclass's own field initializers only take effect
        // after the base constructor - and the property application that
        // happens inside it - has already completed.
        window = <IWindow> new windowClass(
            name, type, style, param, this, rect,
            resolvedParent,
            procedure, tags, null, id
        );

        (window as unknown as {
            completeConstruction(
                properties: unknown[] | null,
                procedure: ((event: unknown, window: IWindow) => void) | null,
                parent: IWindow | null
            ): void
        }).completeConstruction(properties, procedure, resolvedParent);

        window.dynamicStyle = dynamicStyle;

        if(caption && caption.length > 0)
        {
            window.caption = caption;
        }

        return window;
    }

    // AS3: .../src/com/sulake/core/window/WindowContext.as::destroy()
    public destroy(window: IWindow): boolean 
    {
        if(window === this._desktop) 
        {
            this._desktop = null;
        }

        if(window.state !== 0x40000000) 
        {
            window.destroy();
        }

        return true;
    }

    // AS3: .../src/com/sulake/core/window/WindowContext.as::invalidate()
    public invalidate(window: IWindow, rect: {
        x: number;
        y: number;
        width: number;
        height: number
    } | null, flags: number): void 
    {
        if(this._disposed) return;

        if(WindowContext._renderer) 
        {
            WindowContext._renderer.addToRenderQueue(window, rect, flags);
        }
    }

    // AS3: .../src/com/sulake/core/window/WindowContext.as::update()
    public update(_deltaTime: number): void 
    {
        this._updating = true;

        if(this._lastError) 
        {
            const error = this._lastError;
            this._lastError = null;
            this._updating = false;
            throw error;
        }

        if(WindowContext._inputEventProcessor && WindowContext.inputEventQueue) 
        {
            this._eventProcessorState.renderer = WindowContext._renderer;
            this._eventProcessorState.desktop = this._desktop;
            this._eventProcessorState.eventTrackers = this.inputEventTrackers;

            if(!this._eventProcessorState.hovered || this._eventProcessorState.hovered.disposed) 
            {
                this._eventProcessorState.hovered = this._desktop;
            }

            WindowContext._inputEventProcessor.process(this._eventProcessorState, WindowContext.inputEventQueue);

            // The port's stand-in for AS3's `enterFrame` subscription.
            //
            // `WindowMouseOperator.begin()` registers the operator on the stage's `enterFrame`, and
            // `handler()`'s enterFrame branch polls the pointer every frame and calls `operate()`
            // when it has moved — which is what makes an open tooltip follow the cursor. There is
            // no Flash frame event here, and the client only drives the dragging and scaling
            // operators (from `document`, because a drag has to keep tracking off-canvas). Nothing
            // drove the tooltip agent, so `showToolTip()` placed a tooltip once at the pointer
            // position captured by `begin()` and it never moved again.
            // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/services/WindowMouseOperator.as::handler()
            // `_services` directly rather than `getWindowServices()`: that getter asserts non-null,
            // and the field is set by a `setServices()` call after construction and cleared again
            // by `dispose()`, so it is genuinely null at both ends of the context's life. A throw
            // here would take the whole frame loop with it.
            this._services?.getToolTipAgentService().handleMouseMove(
                WindowContext.inputEventQueue.mouseX,
                WindowContext.inputEventQueue.mouseY
            );
        }

        this._updating = false;
    }

    // AS3: .../src/com/sulake/core/window/WindowContext.as::render()
    public render(_deltaTime: number): void 
    {
        this._rendering = true;

        if(WindowContext._renderer) 
        {
            WindowContext._renderer.render();
        }

        this._rendering = false;
    }

    // AS3: .../src/com/sulake/core/window/WindowContext.as::getLastError()
    public getLastError(): Error | null 
    {
        return this._lastError;
    }

    // AS3: .../src/com/sulake/core/window/WindowContext.as::getLastErrorCode()
    public getLastErrorCode(): number 
    {
        return this._lastErrorCode;
    }

    // AS3: .../src/com/sulake/core/window/WindowContext.as::handleError()
    public handleError(code: number, error: Error): void 
    {
        this._lastError = error;
        this._lastErrorCode = code;

        if(this._throwErrors) 
        {
            throw error;
        }
    }

    // AS3: .../src/com/sulake/core/window/WindowContext.as::flushError()
    public flushError(): void 
    {
        this._lastError = null;
        this._lastErrorCode = -1;
    }

    // AS3: .../src/com/sulake/core/window/WindowContext.as::addMouseEventTracker()
    public addMouseEventTracker(tracker: IInputEventTracker): void 
    {
        if(this.inputEventTrackers.indexOf(tracker) < 0) 
        {
            this.inputEventTrackers.push(tracker);
        }
    }

    // AS3: .../src/com/sulake/core/window/WindowContext.as::removeMouseEventTracker()
    public removeMouseEventTracker(tracker: IInputEventTracker): void 
    {
        const index = this.inputEventTrackers.indexOf(tracker);

        if(index > -1) 
        {
            this.inputEventTrackers.splice(index, 1);
        }
    }

    // AS3: .../src/com/sulake/core/window/WindowContext.as::dispose()
    public dispose(): void 
    {
        if(!this._disposed) 
        {
            this._disposed = true;
            this.detachResizeHostListener();

            if(this._desktop) 
            {
                this._desktop.destroy();
                this._desktop = null;
            }

            if(this._parser) 
            {
                this._parser.dispose();
                this._parser = null;
            }

            if(this._substituteParent) 
            {
                this._substituteParent.destroy();
                this._substituteParent = null;
            }

            this._services = null;
            this._factory = null!;
            this._widgetFactory = null;
            this._resourceManager = null;
            this._localization = null;
            this.inputEventTrackers.length = 0;
            this._linkEventTrackers = [];
            this._eventProcessorState.desktop = null;
            this._eventProcessorState.hovered = null;
            this._eventProcessorState.lastClickTarget = null;
            this._eventProcessorState.lastMouseDownTarget = null;
            this._eventProcessorState.lastClickAwayTarget = null;
            this._eventProcessorState.eventTrackers = this.inputEventTrackers;
        }
    }

    private onResizeHost = (): void => 
    {
        if(!this._resizeHost) 
        {
            return;
        }

        this.setDesktopSize(this._resizeHost.width, this._resizeHost.height);
    };

    private attachResizeHostListener(): void 
    {
        if(this._isListeningToResizeHost || !this._resizeHost || this._resizeListener) 
        {
            return;
        }

        this._resizeListener = this.onResizeHost;
        this._resizeHost.addEventListener('resize', this._resizeListener);
        this._isListeningToResizeHost = true;
    }

    private detachResizeHostListener(): void 
    {
        if(!this._isListeningToResizeHost || !this._resizeHost || !this._resizeListener) 
        {
            return;
        }

        this._resizeHost.removeEventListener('resize', this._resizeListener);
        this._isListeningToResizeHost = false;
        this._resizeListener = null;
    }

    private updateDesktopFromHostOrInitialRect(): void 
    {
        if(!this._desktop) 
        {
            return;
        }

        if(this._resizeHost) 
        {
            this.setDesktopSize(this._resizeHost.width, this._resizeHost.height);
        }
        else 
        {
            this.setDesktopSize(this._initialDesktopRect.width, this._initialDesktopRect.height);
        }
    }
}
