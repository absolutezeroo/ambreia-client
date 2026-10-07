import {platform} from '@ambreia/common/platform/Platform';
import type {IWindow} from './IWindow';
import type {DynamicStyle} from './dynamicstyle/DynamicStyle';
import type {IWindowContext} from './IWindowContext';
import type {IGraphicContext} from './graphics/IGraphicContext';
import type {IGraphicContextHost} from './graphics/IGraphicContextHost';
import type {IRectLimiter} from './utils/IRectLimiter';
import type {IPropertyMap} from './theme/IPropertyMap';
import {GraphicContext} from './graphics/GraphicContext';
import {WindowModel} from './WindowModel';
import {WindowEvent} from './events/WindowEvent';
import {WindowMouseEvent} from './events/WindowMouseEvent';
import {WindowDisposeEvent} from './events/WindowDisposeEvent';
import {WindowEventDispatcher} from './events/WindowEventDispatcher';
import type {WindowEventListener} from './events/WindowEventDispatcher';
import {WindowRectLimits} from './utils/WindowRectLimits';
import {PropertyStruct} from './utils/PropertyStruct';
import {WindowParam} from './enum/WindowParam';
import {DynamicStyleManager} from './dynamicstyle/DynamicStyleManager';
import {resolveLocalizationTokens} from './utils/WindowParser';
import {hitTestAlpha, isDrawBuffer} from './utils/BitmapHitTest';
import {Logger} from '@ambreia/common/utils/Logger';

const log = Logger.getLogger('core.window.WindowController');

type WindowRectangle = { x: number; y: number; width: number; height: number };

/**
 * Core window controller implementing the full IWindow API.
 *
 * Extends {@link WindowModel} with behavior: event dispatch, coordinate
 * conversion, hit testing, child management, and state transitions.
 * In AS3 this also extended Sprite; in TypeScript we are engine-only
 * and expose rendering metadata through an optional {@link IGraphicContext}.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/WindowController.as
 */
export class WindowController extends WindowModel implements IWindow, IGraphicContextHost 
{
    // AS3: .../src/com/sulake/core/window/WindowController.as::TAG_EXCLUDE
    public static readonly TAG_EXCLUDE: string = '_EXCLUDE';
    // AS3: .../src/com/sulake/core/window/WindowController.as::TAG_INTERNAL
    public static readonly TAG_INTERNAL: string = '_INTERNAL';
    // AS3: .../src/com/sulake/core/window/WindowController.as::TAG_COLORIZE
    public static readonly TAG_COLORIZE: string = '_COLORIZE';
    // AS3: .../src/com/sulake/core/window/WindowController.as::TAG_IGNORE_INHERITED_STYLE
    public static readonly TAG_IGNORE_INHERITED_STYLE: string = '_IGNORE_INHERITED_STYLE';
    private static _nextUniqueId: number = 0;
    private static readonly _tempRect: { x: number; y: number; width: number; height: number } = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
    };

    private static readonly POINT_ZERO: { x: number; y: number } = {x: 0, y: 0};
    protected _eventDispatcher: WindowEventDispatcher | null = null;
    protected _graphicContext: IGraphicContext | null = null;
    protected _hasVisualContent: boolean = true;
    protected _rectLimits: WindowRectLimits | null = null;
    private _parentRect: { x: number; y: number; width: number; height: number } = {x: 0, y: 0, width: 0, height: 0};
    private _uniqueId: number;
    private _propertyMap: IPropertyMap | null = null;
    private _graphicsSetup: boolean = false;
    private _dynamicStyleInstance: DynamicStyle | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/WindowController.as::_lookupCache
    private _lookupCache: Map<string, IWindow> | null = null;

    constructor(
        name: string,
        type: number,
        style: number,
        param: number,
        context: IWindowContext,
        rect: WindowRectangle | null,
        // Unused here by design: the constructor only stores base fields (matching AS3's field-init
        // ordering constraint - see completeConstruction()'s own comment above its definition).
        // parent/procedure/properties are wired up by completeConstruction(), called separately by
        // WindowContext.create() once construction (and every subclass field initializer) has run.
        _parent: IWindow | null = null,
        _procedure: ((event: WindowEvent, window: IWindow) => void) | null = null,
        tags: string[] | null = null,
        _properties: unknown[] | null = null,
        id: number = 0,
        dynamicStyle: string = ''
    )
    {
        const effectiveRect = rect ?? WindowController.resolveDefaultRectangle(context, type, style);

        super(id, name, type, style, param, context, effectiveRect, tags, dynamicStyle);

        this._uniqueId = WindowController._nextUniqueId++;
        this._parentRect = {x: 0, y: 0, width: 0, height: 0};
    }

    // The backing field lives on `WindowModel`, `protected`, exactly as AS3 declares it.

    /** Returns whether this window ignores mouse events. */
    // AS3: .../src/com/sulake/core/window/WindowController.as::get ignoreMouseEvents()
    public get ignoreMouseEvents(): boolean 
    {
        return this._ignoreMouseEvents;
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::set ignoreMouseEvents()
    public set ignoreMouseEvents(value: boolean) 
    {
        this._ignoreMouseEvents = value;
    }

    protected _procedure: ((event: WindowEvent, window: IWindow) => void) | null = null;

    /** The window procedure, bubbles up to parent if not set locally. */
    // AS3: .../src/com/sulake/core/window/WindowController.as::get procedure()
    public get procedure(): ((event: WindowEvent, window: IWindow) => void) | null 
    {
        if(this._procedure !== null) return this._procedure;

        if(this._parent !== null) return this._parent.procedure;

        return WindowController.nullEventProc;
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::set procedure()
    public set procedure(value: ((event: WindowEvent, window: IWindow) => void) | null) 
    {
        this._procedure = value;
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::_parent
    protected _parent: WindowController | null = null;

    /** The parent window. */
    // AS3: .../src/com/sulake/core/window/WindowController.as::get parent()
    public get parent(): IWindow | null 
    {
        return this._parent;
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::set parent()
    public set parent(value: IWindow | null) 
    {
        if(value === this) 
        {
            throw new Error('Attempted to assign self as parent!');
        }

        if(value !== null && value.context !== this._context) 
        {
            this._context = value.context as IWindowContext;

            if(this._children) 
            {
                for(const child of this._children) 
                {
                    (child as WindowController).parent = this;
                }
            }
        }

        const oldParent: IWindow | null = this._parent;

        if(this._parent !== value) 
        {
            if(this._parent !== null) 
            {
                this._parent.removeChild(this);
            }

            this._parent = value as WindowController | null;

            let event: WindowEvent;

            if(this._parent !== null) 
            {
                const parentRect = this._parent.rectangle;
                this._parentRect.x = parentRect.x;
                this._parentRect.y = parentRect.y;
                this._parentRect.width = parentRect.width;
                this._parentRect.height = parentRect.height;
                this._previousRect.x = this._x;
                this._previousRect.y = this._y;
                this._previousRect.width = this._width;
                this._previousRect.height = this._height;
                event = WindowEvent.allocate(WindowEvent.WE_PARENT_ADDED, this, this._parent);
                this.update(this, event);
            }
            else 
            {
                this._parentRect.x = 0;
                this._parentRect.y = 0;
                this._parentRect.width = 0;
                this._parentRect.height = 0;
                event = WindowEvent.allocate(WindowEvent.WE_PARENT_REMOVED, this, oldParent);
                this.update(this, event);
            }

            event.recycle();
        }
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::_children
    protected _children: IWindow[] | null = null;

    /** Direct access to the children array. */
    // AS3: .../src/com/sulake/core/window/WindowController.as::get children()
    public get children(): IWindow[] | null 
    {
        return this._children;
    }

    protected _debug: boolean = false;

    /** Debug mode flag. */
    // AS3: .../src/com/sulake/core/window/WindowController.as::get debug()
    public get debug(): boolean 
    {
        return this._debug;
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::set debug()
    public set debug(value: boolean) 
    {
        this._debug = value;
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::_immediateClickMode
    protected _immediateClickMode: boolean = false;

    /** Whether immediate click mode is enabled. */
    // AS3: .../src/com/sulake/core/window/WindowController.as::get immediateClickMode()
    public get immediateClickMode(): boolean 
    {
        return this._immediateClickMode;
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::set immediateClickMode()
    public set immediateClickMode(value: boolean) 
    {
        if(value !== this._immediateClickMode) 
        {
            this._immediateClickMode = value;

            const gc = this.getGraphicContext(false);

            if(gc) 
            {
                gc.mouse = this._immediateClickMode;

                const interactiveGc = gc as unknown as {
                    addEventListener?: (type: string, listener: (event: unknown) => void) => void;
                    removeEventListener?: (type: string, listener: (event: unknown) => void) => void;
                };

                if(this._immediateClickMode) 
                {
                    interactiveGc.addEventListener?.('click', this._immediateClickHandlerBound);
                }
                else 
                {
                    interactiveGc.removeEventListener?.('click', this._immediateClickHandlerBound);
                }
            }
        }
    }

    /** Rectangle limits for the window. Created lazily. */
    // AS3: .../src/com/sulake/core/window/WindowController.as::get limits()
    public get limits(): IRectLimiter 
    {
        if(!this._rectLimits) 
        {
            this._rectLimits = new WindowRectLimits(this);
        }

        return this._rectLimits;
    }

    /** The host window (topmost non-desktop ancestor). */
    // AS3: .../src/com/sulake/core/window/WindowController.as::get host()
    public get host(): IWindow 
    {
        const desktop = this.desktop;

        return (this._parent === desktop) ? this : (this._parent as WindowController).host;
    }

    /** The desktop window of this context. */
    // AS3: .../src/com/sulake/core/window/WindowController.as::get desktop()
    public get desktop(): IWindow | null 
    {
        return this._context.getDesktopWindow();
    }

    /** Filters (delegated to graphic context). */
    // AS3: .../src/com/sulake/core/window/WindowController.as::get filters()
    public get filters(): unknown[] 
    {
        const gc = this._graphicContext;

        return gc ? (gc.filters ?? []) : [];
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::set filters()
    public set filters(value: unknown[]) 
    {
        if(this._graphicContext) 
        {
            this._graphicContext.filters = value;
        }
    }

    /** Properties array (stub for compatibility). */
    // AS3: .../src/com/sulake/core/window/WindowController.as::get properties()
    public get properties(): unknown[] 
    {
        return [];
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::set properties()
    public set properties(_value: unknown[]) 
    {
        // Stub: properties are handled via PropertyStruct
    }

    /** Etching (stub for compatibility). */
    public get etching(): unknown[] 
    {
        return [];
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::set etching()
    public set etching(_value: unknown[]) 
    {
        // Stub: etching is a visual feature not needed in engine
    }

    public get x(): number 
    {
        return this._x;
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::set x()
    public set x(value: number) 
    {
        if(value !== this._x) 
        {
            this.setRectangle(value, this._y, this._width, this._height);
        }
    }

    public get y(): number 
    {
        return this._y;
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::set y()
    public set y(value: number) 
    {
        if(value !== this._y) 
        {
            this.setRectangle(this._x, value, this._width, this._height);
        }
    }

    public get width(): number 
    {
        return this._width;
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::set width()
    public set width(value: number) 
    {
        if(value !== this._width) 
        {
            this.setRectangle(this._x, this._y, value, this._height);
        }
    }

    public get height(): number 
    {
        return this._height;
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::set height()
    public set height(value: number) 
    {
        if(value !== this._height) 
        {
            this.setRectangle(this._x, this._y, this._width, value);
        }
    }

    public get position(): { x: number; y: number } 
    {
        return {x: this._x, y: this._y};
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::set position()
    public set position(value: { x: number; y: number }) 
    {
        this.setRectangle(value.x, value.y, this._width, this._height);
    }

    public get rectangle(): { x: number; y: number; width: number; height: number } 
    {
        return {x: this._x, y: this._y, width: this._width, height: this._height};
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::set rectangle()
    public set rectangle(value: { x: number; y: number; width: number; height: number }) 
    {
        this.setRectangle(value.x, value.y, value.width, value.height);
    }

    public get background(): boolean 
    {
        return this._background;
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::set background()
    public set background(value: boolean) 
    {
        this._background = value;
        this._fillColor = value ? (this._fillColor | this._alphaColor) : (this._fillColor & 0xFFFFFF);
        this._hasVisualContent = this._hasVisualContent || value;
        this._context.invalidate(this, null, 1);
    }

    public get color(): number 
    {
        return this._fillColor;
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::set color()
    public set color(value: number) 
    {
        this._alphaColor = value & 0xFF000000;
        this._fillColor = this._background ? value : (value & 0xFFFFFF);
        this._context.invalidate(this, null, 1);
    }

    public get alpha(): number 
    {
        return this._alphaColor >>> 24;
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::set alpha()
    public set alpha(value: number) 
    {
        this._alphaColor = value << 24;
        this._fillColor = this._background ? (this._alphaColor | this._fillColor) : (0xFFFFFF & this._fillColor);
        this._context.invalidate(this, null, 1);
    }

    public get blend(): number 
    {
        return this._blend;
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::set blend()
    public set blend(value: number) 
    {
        value = value > 1 ? 1 : (value < 0 ? 0 : value);

        if(value !== this._blend) 
        {
            this._blend = value;
            this._context.invalidate(this, null, 16);
        }
    }

    public get visible(): boolean 
    {
        return this._visible;
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::set visible()
    public set visible(value: boolean) 
    {
        if(value !== this._visible) 
        {
            this._visible = value;

            if(this._graphicContext && !value) 
            {
                this._graphicContext.visible = false;
            }

            this._context.invalidate(this, null, 1);

            const event = WindowEvent.allocate(WindowEvent.WE_CHILD_VISIBILITY, this, this);
            this.update(this, event);
            event.recycle();
        }
    }

    public get type(): number 
    {
        return this._type;
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::set type()
    public set type(value: number) 
    {
        if(value !== this._type) 
        {
            this._type = value;
            this._context.invalidate(this, null, 1);
        }
    }

    public get caption(): string 
    {
        return this._caption;
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::set caption()
    public set caption(value: string) 
    {
        value = resolveLocalizationTokens(value ?? '');

        if(value !== this._caption) 
        {
            this._caption = value;
            this._context.invalidate(this, null, 1);
        }
    }

    public get tags(): string[] 
    {
        if(!this._tags) this._tags = [];

        return this._tags;
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::set tags()
    public set tags(value: string[]) 
    {
        if(value !== null) 
        {
            this._tags = value;
        }
    }

    public get mouseThreshold(): number 
    {
        return this._mouseThreshold;
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::set mouseThreshold()
    public set mouseThreshold(value: number) 
    {
        this._mouseThreshold = value > 0xFF ? 0xFF : value;
    }

    public get state(): number 
    {
        return this._state;
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::set state()
    public set state(value: number) 
    {
        if(value !== this._state) 
        {
            this._state = value;
            this._context.invalidate(this, null, 8);
        }
    }

    public get style(): number 
    {
        return this._style;
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::set style()
    public set style(value: number) 
    {
        if(value !== this._style) 
        {
            this._style = value;

            // Propagate style to internal children
            const internalChildren: IWindow[] = [];
            this.groupChildrenWithTag(WindowController.TAG_INTERNAL, internalChildren);

            for(let i = internalChildren.length - 1; i >= 0; i--) 
            {
                const child = internalChildren[i] as WindowController;

                if(child.tags.indexOf(WindowController.TAG_IGNORE_INHERITED_STYLE) === -1) 
                {
                    child.style = this._style;
                }
            }

            this._context.invalidate(this, null, 1);

            // Update property map from theme
            try 
            {
                this._propertyMap = this._context.getWindowFactory().getThemeManager().getPropertyDefaults(this._style) ?? null;
            }
            catch (_) 
            {
                // Theme manager not available
            }
        }
    }

    public get param(): number 
    {
        return this._param;
    }

    public set param(value: number) 
    {
        this._param = value;
    }

    public get dynamicStyle(): string 
    {
        return this._dynamicStyleName;
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::set dynamicStyle()
    public set dynamicStyle(value: string) 
    {
        this._dynamicStyleName = value;
        this._context.invalidate(this, null, 1);
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::get dynamicStyleColor()
    public get dynamicStyleColor(): {
        redMultiplier: number;
        greenMultiplier: number;
        blueMultiplier: number;
        alphaMultiplier: number;
        redOffset: number;
        greenOffset: number;
        blueOffset: number;
        alphaOffset: number;
    } | null 
    {
        return this._dynamicStyleColorTransform;
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::set dynamicStyleColor()
    public set dynamicStyleColor(value: {
        redMultiplier: number;
        greenMultiplier: number;
        blueMultiplier: number;
        alphaMultiplier: number;
        redOffset: number;
        greenOffset: number;
        blueOffset: number;
        alphaOffset: number;
    } | null) 
    {
        this._dynamicStyleColorTransform = value;
    }

    public get clipping(): boolean 
    {
        return this._clipping;
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::set clipping()
    public set clipping(value: boolean) 
    {
        if(value !== this._clipping) 
        {
            this._clipping = value;
            this._context.invalidate(this, null, 1);
        }
    }

    public get id(): number 
    {
        return this._id;
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::set id()
    public set id(value: number) 
    {
        this._id = value;
    }

    public get name(): string 
    {
        return this._name;
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::set name()
    public set name(value: string) 
    {
        this._name = value;
    }

    public get offsetX(): number 
    {
        return this._offsetX;
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::set offsetX()
    public set offsetX(value: number) 
    {
        this._offsetX = value;
    }

    public get offsetY(): number 
    {
        return this._offsetY;
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::set offsetY()
    public set offsetY(value: number) 
    {
        this._offsetY = value;
    }

    /** The number of children. */
    // AS3: .../src/com/sulake/core/window/WindowController.as::get numChildren()
    public get numChildren(): number 
    {
        return this._children ? this._children.length : 0;
    }

    /**
     * Expands the parent to accommodate a child that extends beyond its bounds.
     *
     * @param parent - The parent window to expand
     * @param child - The child window that may exceed bounds
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::expandToAccommodateChild()
    public static expandToAccommodateChild(parent: WindowController, child: IWindow): void 
    {
        let offsetX: number = 0;
        let offsetY: number = 0;
        let newWidth: number = parent.width;
        let newHeight: number = parent.height;
        let changed: boolean = false;

        if(child.x < 0) 
        {
            offsetX = child.x;
            newWidth = newWidth - offsetX;
            child.x = 0;
            changed = true;
        }

        if(child.right > newWidth) 
        {
            newWidth = child.x + child.width;
            changed = true;
        }

        if(child.y < 0) 
        {
            offsetY = child.y;
            newHeight = newHeight - offsetY;
            child.y = 0;
            changed = true;
        }

        if(child.bottom > newHeight) 
        {
            newHeight = child.y + child.height;
            changed = true;
        }

        if(changed) 
        {
            const savedParam: number = parent.param & (0x020000 | 0x024000);

            if(savedParam) 
            {
                parent.setParamFlag(savedParam, false);
            }

            parent.setRectangle(parent.x + offsetX, parent.y + offsetY, newWidth, newHeight);

            if(offsetY !== 0 || offsetX !== 0) 
            {
                const numKids: number = parent.numChildren;

                for(let i = 0; i < numKids; i++) 
                {
                    const kid = parent.getChildAt(i);

                    if(kid) 
                    {
                        kid.offset(-offsetX, -offsetY);
                    }
                }
            }

            if(savedParam) 
            {
                parent.setParamFlag(savedParam, true);
            }
        }
    }

    /**
     * Resizes the parent window to the maximum extent of its children.
     *
     * @param parent - The parent window to resize
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::resizeToAccommodateChildren()
    public static resizeToAccommodateChildren(parent: WindowController): void 
    {
        let maxRight: number = -2147483648;
        let maxBottom: number = -2147483648;
        let changed: boolean = false;
        const numKids: number = parent.numChildren;

        for(let i = 0; i < numKids; i++) 
        {
            const child = parent.getChildAt(i);

            if(!child) continue;

            if(child.visible && child.x + child.width > maxRight) 
            {
                maxRight = child.x + child.width;
                changed = true;
            }

            if(child.visible && child.y + child.height > maxBottom) 
            {
                maxBottom = child.y + child.height;
                changed = true;
            }
        }

        if(changed) 
        {
            const savedParam: number = parent.param & (0x020000 | 0x024000);

            if(savedParam) 
            {
                parent.setParamFlag(savedParam, false);
            }

            parent.width = maxRight;
            parent.height = maxBottom;

            if(savedParam) 
            {
                parent.setParamFlag(savedParam, true);
            }
        }
    }

    /**
     * Recursively calculates the total mouse region covering a window and all children.
     *
     * @param controller - The controller to calculate for
     * @param out - The rectangle to expand with results
     * @see sources/win63_version/core/window/WindowController.as line 145
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::calculateMouseRegion()
    public static calculateMouseRegion(controller: WindowController, out: {
        x: number;
        y: number;
        width: number;
        height: number
    }): void 
    {
        const globalRect: { x: number; y: number; width: number; height: number } = {x: 0, y: 0, width: 0, height: 0};
        controller.getGlobalRectangle(globalRect);

        const numKids: number = controller.numChildren;
        const gx: number = globalRect.x;
        const gy: number = globalRect.y;

        if(gx < out.x) out.x = gx;
        if(gy < out.y) out.y = gy;

        const gRight = globalRect.x + globalRect.width;
        const gBottom = globalRect.y + globalRect.height;
        const outRight = out.x + out.width;
        const outBottom = out.y + out.height;

        if(gRight > outRight) out.width = gRight - out.x;
        if(gBottom > outBottom) out.height = gBottom - out.y;

        for(let i = 0; i < numKids; i++) 
        {
            WindowController.calculateMouseRegion(controller.getChildAt(i) as WindowController, out);
        }
    }

    private static resolveDefaultRectangle(context: IWindowContext, type: number, style: number): WindowRectangle 
    {
        try 
        {
            const layout = context.getWindowFactory()?.getLayoutByTypeAndStyle(type, style);

            if(layout) 
            {
                const dimensions = WindowController.resolveLayoutDimensions(layout);

                return {
                    x: 0,
                    y: 0,
                    width: dimensions.width || 10,
                    height: dimensions.height || 10
                };
            }
        }
        catch (_) 
        {
            // Theme/layout may be unavailable during bootstrap.
        }

        return {x: 0, y: 0, width: 10, height: 10};
    }

    private static resolveLayoutDimensions(layout: unknown): { width: number; height: number } 
    {
        // Legacy object payload support.
        if(layout && typeof layout === 'object' && !(layout instanceof Document) && !(layout instanceof Element)) 
        {
            const source = layout as Record<string, unknown>;

            return {
                width: typeof source.layoutWidth === 'number' ? source.layoutWidth : 0,
                height: typeof source.layoutHeight === 'number' ? source.layoutHeight : 0
            };
        }

        const root = WindowController.resolveLayoutDocumentElement(layout);

        if(!root) 
        {
            return {width: 0, height: 0};
        }

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/WindowController.as::WindowController()
        // Flash reads width/height from the layout XML returned by getLayoutByTypeAndStyle(),
        // before WindowParser descends into its child <window>. Converted JSON layouts keep
        // those dimensions on <layout>, so preserve that root for sizing.
        let width = WindowController.readIntAttribute(root, 'width');
        let height = WindowController.readIntAttribute(root, 'height');

        if((width === 0 || height === 0) && root.nodeName === 'layout') 
        {
            const windowRoot = WindowController.resolveLayoutRootElement(root);

            if(windowRoot) 
            {
                width = width || WindowController.readIntAttribute(windowRoot, 'width');
                height = height || WindowController.readIntAttribute(windowRoot, 'height');
            }
        }

        return {width, height};
    }

    private static resolveLayoutDocumentElement(layout: unknown): Element | null 
    {
        if(layout instanceof Element) 
        {
            return layout;
        }

        if(layout instanceof Document) 
        {
            return layout.documentElement;
        }

        if(typeof layout === 'string') 
        {
            try 
            {
                const doc = platform().parseXml(layout);
                const parserError = doc.getElementsByTagName('parsererror');

                if(parserError.length > 0) 
                {
                    return null;
                }

                return doc.documentElement;
            }
            catch (_) 
            {
                return null;
            }
        }

        return null;
    }

    private static resolveLayoutRootElement(layout: unknown): Element | null 
    {
        if(layout instanceof Element) 
        {
            if(layout.nodeName === 'layout') 
            {
                for(let i = 0; i < layout.children.length; i++) 
                {
                    const child = layout.children.item(i);

                    if(child && child.nodeName === 'window') 
                    {
                        return child;
                    }
                }

                return null;
            }

            return layout;
        }

        if(layout instanceof Document) 
        {
            return WindowController.resolveLayoutRootElement(layout.documentElement);
        }

        if(typeof layout === 'string') 
        {
            try 
            {
                const doc = platform().parseXml(layout);
                const parserError = doc.getElementsByTagName('parsererror');

                if(parserError.length > 0) 
                {
                    return null;
                }

                return WindowController.resolveLayoutRootElement(doc.documentElement);
            }
            catch (_) 
            {
                return null;
            }
        }

        return null;
    }

    private static readIntAttribute(element: Element, name: string): number 
    {
        const raw = element.getAttribute(name);

        if(!raw) 
        {
            return 0;
        }

        const parsed = Number.parseInt(raw, 10);

        return Number.isFinite(parsed) ? parsed : 0;
    }

    /**
     * No-op event procedure used as fallback when no procedure is set.
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::nullEventProc()
    private static nullEventProc(_event: WindowEvent, _window: IWindow): void 
    {
        // Intentionally empty
    }

    /**
     * Orchestrates the post-construction phases below, in AS3 constructor
     * order. Called by the factory once `new` has returned (the full
     * prototype chain's constructors, and thus every subclass field
     * initializer, have already run) so each phase observes a fully
     * allocated object — matching the AS3 runtime, where these same steps
     * execute inside this base constructor while subclass fields still sit
     * at their type-default (subclass field initializers only run after
     * this constructor returns).
     *
     * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/WindowController.as::WindowController()
     */
    public completeConstruction(
        properties: unknown[] | null,
        procedure: ((event: WindowEvent, window: IWindow) => void) | null,
        parent: IWindow | null
    ): void 
    {
        this.resolveTheme();
        this.buildLayoutChildren();
        this.applyDefaultAttributes();
        this.applyProperties(properties);
        this.setProcedure(procedure);
        this.attachToParent(parent);
        this.finalize();
    }

    /** Returns whether a graphic context exists or can be created. */
    // AS3: .../src/com/sulake/core/window/WindowController.as::hasGraphicsContext()
    public hasGraphicsContext(): boolean 
    {
        return this._graphicContext !== null || !this.testParamFlag(16);
    }

    /**
     * Gets or lazily creates the graphic context.
     *
     * @param createIfMissing - Whether to create one if it does not exist
     * @returns The graphic context, or null
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/WindowController.as::getGraphicContext()
    // TODO(AS3): two subclasses override this and neither override is ported, on purpose.
    // `ContainerController.as::getGraphicContext()` builds a GC_TYPE_CONTAINER (a Sprite, no draw
    // buffer) when param flag 16 (USE_PARENT_GRAPHIC_CONTEXT) is set, and
    // `DesktopController.as::getGraphicContext()` builds type 256 — no display object at all —
    // with mouseEnabled/doubleClickEnabled true. Both would remove the buffer here, because
    // `GraphicContext.allocateDrawBuffer()` returns null unless the type was GC_TYPE_BITMAP: a
    // flagged container with a background, or the desktop itself, would stop painting. AS3 can
    // afford it — a flagged window draws into its parent's context there — and this port does not
    // implement that: every window owns its buffer. Porting the two overrides means porting
    // draw-into-parent first, in WindowRendererItem.
    public getGraphicContext(createIfMissing: boolean): IGraphicContext | null 
    {
        if(createIfMissing && !this._graphicContext) 
        {
            this._graphicContext = new GraphicContext(
                `GC {${this._name}}`,
                GraphicContext.GC_TYPE_BITMAP,
                {x: this._x, y: this._y, width: this._width, height: this._height}
            );
            this._graphicContext.visible = this._visible;

            if(this._immediateClickMode) 
            {
                this._graphicContext.mouse = true;

                const interactiveGc = this._graphicContext as unknown as {
                    addEventListener?: (type: string, listener: (event: unknown) => void) => void;
                };
                interactiveGc.addEventListener?.('click', this._immediateClickHandlerBound);
            }
        }

        return this._graphicContext;
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::setupGraphicsContext()
    public setupGraphicsContext(): IGraphicContext | null 
    {
        this._graphicContext = this.getGraphicContext(true);

        if(!this._graphicContext) 
        {
            return null;
        }

        if(this._parent) 
        {
            (this._parent as WindowController).setupGraphicsContext();
        }

        if(this._children && this._children.length > 0) 
        {
            if(this._graphicContext.numChildContexts !== this.numChildren) 
            {
                let index: number = 0;

                for(const child of this._children) 
                {
                    const childGc = (child as WindowController).getGraphicContext(true);

                    if(childGc) 
                    {
                        this._graphicContext.addChildContextAt(childGc, index++);
                    }
                }
            }
        }

        this._graphicsSetup = true;

        return this._graphicContext;
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::releaseGraphicsContext()
    public releaseGraphicsContext(): void 
    {
        this._graphicsSetup = false;
    }

    /**
     * Sets position and/or size, dispatching appropriate events.
     *
     * This is the core method for all geometry changes. All individual
     * setters for x, y, width, height delegate here.
     *
     * @param newX - New x position
     * @param newY - New y position
     * @param newWidth - New width
     * @param newHeight - New height
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::setRectangle()
    public setRectangle(newX: number, newY: number, newWidth: number, newHeight: number): void
    {
        // Apply rect limits
        if(this._rectLimits)
        {
            newHeight = Math.max(this._rectLimits.minHeight, newHeight);
            newHeight = Math.min(this._rectLimits.maxHeight, newHeight);
            newWidth = Math.max(this._rectLimits.minWidth, newWidth);
            newWidth = Math.min(this._rectLimits.maxWidth, newWidth);
        }

        let relocated: boolean = (newX !== this._x) || (newY !== this._y);
        // AS3 keeps the width-only comparison in its own local (`_loc11_`) because the
        // horizontal anchor block below is gated on it, not on `resized`.
        const widthChanged: boolean = newWidth !== this._width;
        let resized: boolean = widthChanged || (newHeight !== this._height);

        // Handle anchor-based repositioning on resize (param bits for resize origin)
        if(resized && !relocated)
        {
            const hAnchor: number = this._param & 0x0C0000;

            // AS3 guards the whole horizontal branch with `if(_loc11_)` - the width having
            // changed. Without it a height-only resize still takes the branch: the deltas are
            // zero so `newX` does not move, but `relocated` is forced true, which turns a pure
            // resize into a relocation - firing WE_RELOCATE/WE_RELOCATED, overwriting
            // `_previousRect.x/y`, and switching the clamp-to-parent block below from its
            // size-clamping branch to its position-clamping one.
            if(widthChanged)
            {
                if(hAnchor === 0xC0000)
                {
                    // Center horizontally
                    newX = Math.floor(newX - ((newWidth - this._width) / 2));
                    relocated = true;
                }
                else if(hAnchor === 0x40000)
                {
                    // Anchor right
                    newX = newX - (newWidth - this._width);
                    relocated = true;
                }
            }

            const vAnchor: number = this._param & 0x300000;

            if(vAnchor === 0x300000) 
            {
                // Center vertically
                newY = Math.floor(newY - ((newHeight - this._height) / 2));
                relocated = true;
            }
            else if(vAnchor === 0x100000) 
            {
                // Anchor bottom
                newY = newY - (newHeight - this._height);
                relocated = true;
            }
        }

        // Clamp to parent if constrained (param flag 32 = constrain to parent)
        if(this.testParamFlag(32))
        {
            // AS3: `if(_parent != null && _parent.name != "_CONTEXT_SUBSTITUTE_PARENT")`. The
            // substitute parent is the placeholder a context hands to a not-yet-attached window;
            // clamping a window's rect against it constrains the window to a stand-in rather than
            // to the container it will actually live in.
            if(this._parent !== null && this._parent.name !== '_CONTEXT_SUBSTITUTE_PARENT')
            {
                newX = newX < 0 ? 0 : newX;
                newY = newY < 0 ? 0 : newY;

                if(relocated) 
                {
                    newX = newX - ((newX + newWidth > this._parent.width) ? (newX + newWidth - this._parent.width) : 0);
                    newY = newY - ((newY + newHeight > this._parent.height) ? (newY + newHeight - this._parent.height) : 0);
                    relocated = (newX !== this._x) || (newY !== this._y);
                }
                else 
                {
                    newWidth = newWidth - ((newX + newWidth > this._parent.width) ? (newX + newWidth - this._parent.width) : 0);
                    newHeight = newHeight - ((newY + newHeight > this._parent.height) ? (newY + newHeight - this._parent.height) : 0);
                    resized = (newWidth !== this._width) || (newHeight !== this._height);
                }
            }
        }

        if(relocated || resized) 
        {
            let event: WindowEvent;

            // Dispatch pre-events (cancelable)
            if(relocated) 
            {
                event = WindowEvent.allocate(WindowEvent.WE_RELOCATE, this, null, true);
                this.update(this, event);

                if(event.isWindowOperationPrevented()) 
                {
                    relocated = false;
                }

                event.recycle();
            }

            if(resized) 
            {
                event = WindowEvent.allocate(WindowEvent.WE_RESIZE, this, null, true);
                this.update(this, event);

                if(event.isWindowOperationPrevented()) 
                {
                    resized = false;
                }

                event.recycle();
            }

            // Apply changes
            if(relocated) 
            {
                this._previousRect.x = this._x;
                this._previousRect.y = this._y;
                this._previousRect.width = this._width;
                this._previousRect.height = this._height;
                this._x = newX;
                this._y = newY;
            }

            if(resized) 
            {
                this._previousRect.width = this._width;
                this._previousRect.height = this._height;
                this._width = newWidth;
                this._height = newHeight;
            }

            // Dispatch post-events
            if(relocated) 
            {
                event = WindowEvent.allocate(WindowEvent.WE_RELOCATED, this, null);
                this.update(this, event);
                event.recycle();
            }

            if(resized) 
            {
                event = WindowEvent.allocate(WindowEvent.WE_RESIZED, this, null);
                this.update(this, event);
                event.recycle();
            }
        }
    }

    public override invalidate(rect: { x: number; y: number; width: number; height: number } | null = null): void 
    {
        this._context.invalidate(this, rect, 1);
    }

    /** Resolves the layout. Override in subclasses. */
    // AS3: .../src/com/sulake/core/window/WindowController.as::resolve()
    public resolve(): number 
    {
        return 0;
    }

    /**
     * Returns the target window where layout children should be added.
     *
     * Base implementation returns `this`. Compound elements (FrameController,
     * TabContextController) override to redirect children to their content
     * container, matching AS3 `buildFromXML()` behavior where FrameController
     * passes `content` instead of `this` to `parseAndConstruct()`.
     *
     * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/FrameController.as line 127
     */
    public getLayoutChildTarget(): IWindow 
    {
        return this;
    }

    /** Centers this window within its parent. */
    // AS3: .../src/com/sulake/core/window/WindowController.as::center()
    public center(): void 
    {
        if(this._parent !== null) 
        {
            this.x = Math.floor(this._parent.width / 2) - Math.floor(this._width / 2);
            this.y = Math.floor(this._parent.height / 2) - Math.floor(this._height / 2);
        }
    }

    /**
     * Offsets the window position by the given deltas.
     *
     * @param dx - Horizontal offset
     * @param dy - Vertical offset
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::offset()
    public offset(dx: number, dy: number): void 
    {
        this.setRectangle(this._x + dx, this._y + dy, this._width, this._height);
    }

    /**
     * Scales the window by the given deltas (adds to current size).
     *
     * @param sx - Horizontal scale delta
     * @param sy - Vertical scale delta
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::scale()
    public scale(sx: number, sy: number): void 
    {
        this.setRectangle(this._x, this._y, this._width + sx, this._height + sy);
    }

    /**
     * Builds child windows from an XML layout definition.
     *
     * @param layout - The XML layout payload
     * @param namedWindows - Optional map to collect named windows
     * @returns `true` if construction succeeded
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::buildFromXML()
    public buildFromXML(layout: string | Document | Element, namedWindows: Map<string, IWindow> | null = null): boolean 
    {
        try 
        {
            const parser = this._context.getWindowParser();

            return parser.parseAndConstruct(layout, this, namedWindows) !== null;
        }
        catch (_) 
        {
            return false;
        }
    }

    /**
     * Returns the draw buffer for rendering.
     * If this window shares its parent's graphic context (param flag 16),
     * delegates to the parent.
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::fetchDrawBuffer()
    public fetchDrawBuffer(): unknown 
    {
        if(this.testParamFlag(16)) 
        {
            return this._parent !== null ? this._parent.fetchDrawBuffer() : null;
        }

        const gc = this.getGraphicContext(true);

        return gc ? gc.fetchDrawBuffer() : null;
    }

    /**
     * Gets the draw region for this window.
     *
     * @param out - The rectangle to populate
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::getDrawRegion()
    public getDrawRegion(out: { x: number; y: number; width: number; height: number }): void 
    {
        if(!this.testParamFlag(16)) 
        {
            out.x = 0;
            out.y = 0;
            out.width = this._width;
            out.height = this._height;
        }
        else 
        {
            if(this._parent !== null) 
            {
                this._parent.getDrawRegion(out);
                out.x = out.x + this._x;
                out.y = out.y + this._y;
                out.width = this._width;
                out.height = this._height;
            }
            else 
            {
                out.x = 0;
                out.y = 0;
                out.width = 0;
                out.height = 0;
            }
        }
    }

    /**
     * Routes an event through the window procedure and event listeners,
     * then handles built-in state transitions for mouse and window events.
     *
     * @param source - The originating window controller
     * @param event - The event to route
     * @returns `true` if the event was handled
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::update()
    public update(source: WindowController, event: WindowEvent): boolean 
    {
        // Param flag 9 = ignore events
        if(!this.testParamFlag(9)) 
        {
            const proc = this.procedure;

            if(proc) 
            {
                proc(event, this);
            }

            if(this._disposed) 
            {
                return true;
            }

            if(!event.isWindowOperationPrevented()) 
            {
                if(this.hasEventListener(event.type)) 
                {
                    this._eventDispatcher!.dispatchEvent(event);

                    if(this._disposed) 
                    {
                        return true;
                    }
                }
            }

            if(event.cancelable) 
            {
                if(event.isWindowOperationPrevented()) 
                {
                    return true;
                }
            }
        }

        // Handle mouse events
        if(event instanceof WindowMouseEvent) 
        {
            switch(event.type) 
            {
                case WindowMouseEvent.DOWN:
                    if(this.activate()) 
                    {
                        if(event.cancelable) 
                        {
                            event.preventDefault();
                        }
                    }

                    if(this.disposed) return true;

                    this.setStateFlag(16, true);

                    // Mouse services: listener, dragger, scaler
                    try 
                    {
                        const services = this._context.getWindowServices();

                        // Mouse listener
                        const mouseListener = services.getMouseListenerService();
                        mouseListener.begin(this);
                        mouseListener.eventTypes.push(WindowMouseEvent.UP);
                        mouseListener.areaLimit = 3;

                        // Drag initiation: walk up to find DRAGGING_TARGET
                        if(this.testParamFlag(WindowParam.MOUSE_DRAGGING_TRIGGER))
                        {
                            // Not a closure `this` workaround - `target` walks up the parent
                            // chain starting at `this` and is reassigned each iteration.
                            // eslint-disable-next-line @typescript-eslint/no-this-alias
                            let target: IWindow | null = this;

                            while(target !== null) 
                            {
                                if(target.testParamFlag(WindowParam.MOUSE_DRAGGING_TARGET)) 
                                {
                                    services.getMouseDraggingService().begin(target);
                                    break;
                                }

                                target = target.parent;
                            }
                        }

                        // Scale initiation: walk up to find SCALING_TARGET
                        if((this._param & WindowParam.MOUSE_SCALING_TRIGGER) > 0)
                        {
                            // Not a closure `this` workaround - `target` walks up the parent
                            // chain starting at `this` and is reassigned each iteration.
                            // eslint-disable-next-line @typescript-eslint/no-this-alias
                            let target: IWindow | null = this;

                            while(target !== null) 
                            {
                                if(target.testParamFlag(WindowParam.MOUSE_SCALING_TARGET)) 
                                {
                                    services.getMouseScalingService().begin(target, this._param & WindowParam.MOUSE_SCALING_TRIGGER);
                                    break;
                                }

                                target = target.parent;
                            }
                        }
                    }
                    catch (_) 
                    {
                        // Services may not be available
                    }
                    break;

                case WindowMouseEvent.UP:
                    if(this.testStateFlag(16)) 
                    {
                        this.setStateFlag(16, false);
                    }

                    try 
                    {
                        const services = this._context.getWindowServices();
                        services.getMouseListenerService().end(this);

                        // End drag
                        if(this.testParamFlag(WindowParam.MOUSE_DRAGGING_TARGET)) 
                        {
                            services.getMouseDraggingService().end(this);
                        }

                        // End scale
                        if(this.testParamFlag(WindowParam.MOUSE_SCALING_TARGET)) 
                        {
                            services.getMouseScalingService().end(this);
                        }
                    }
                    catch (_) 
                    {
                        // Services may not be available
                    }
                    break;

                case WindowMouseEvent.OUT:
                    if(this.testStateFlag(4)) 
                    {
                        this.setStateFlag(4, false);
                    }

                    if(this.testStateFlag(16)) 
                    {
                        this.setStateFlag(16, false);
                    }
                    break;

                case WindowMouseEvent.OVER:
                    if(!this.testStateFlag(4)) 
                    {
                        this.setStateFlag(4, true);
                    }
                    break;

                case WindowMouseEvent.WHEEL:
                case WindowMouseEvent.WHEEL_HORIZONTAL:
                    return false;
            }
        }
        else if(event instanceof WindowEvent) 
        {
            let childEvent: WindowEvent;

            switch(event.type) 
            {
                case WindowEvent.WE_RESIZED:
                    if(source === this) 
                    {
                        // Compute invalidation region
                        const tempRect = WindowController._tempRect;
                        tempRect.x = Math.min(this._x, this._previousRect.x);
                        tempRect.y = Math.min(this._y, this._previousRect.y);
                        const tempRight = Math.max(this._x + this._width, this._previousRect.x + this._previousRect.width);
                        const tempBottom = Math.max(this._y + this._height, this._previousRect.y + this._previousRect.height);
                        tempRect.width = tempRight - tempRect.x;
                        tempRect.height = tempBottom - tempRect.y;
                        tempRect.x -= this._x;
                        tempRect.y -= this._y;
                        this._context.invalidate(this, tempRect, 2);

                        // Notify children
                        childEvent = WindowEvent.allocate(WindowEvent.WE_PARENT_RESIZED, this, null);
                        this.notifyChildren(childEvent);
                        childEvent.recycle();

                        // Scale relative to parent if param flags indicate
                        if(this.testParamFlag(192, 192) || this.testParamFlag(0x0C00, 0x0C00)) 
                        {
                            this.updateScaleRelativeToParent();
                        }

                        // Propagate to parent
                        if(this._parent !== null)
                        {
                            const savedParam = this._param;
                            this._param = this._param & 0xFFFFF33F;

                            if(this.testParamFlag(0x400000))
                            {
                                this._parent.width = this._parent.width + (this._width - this._previousRect.width);
                            }

                            if(this.testParamFlag(0x800000)) 
                            {
                                this._parent.height = this._parent.height + (this._height - this._previousRect.height);
                            }

                            this._param = savedParam;

                            childEvent = WindowEvent.allocate(WindowEvent.WE_CHILD_RESIZED, this._parent, this);
                            this._parent.update(this, childEvent);
                            childEvent.recycle();
                        }
                    }
                    break;

                case WindowEvent.WE_RELOCATED:
                    if(source === this) 
                    {
                        // Compute invalidation region
                        const tempRectR = WindowController._tempRect;
                        tempRectR.x = Math.min(this._x, this._previousRect.x);
                        tempRectR.y = Math.min(this._y, this._previousRect.y);
                        const tempRightR = Math.max(this._x + this._width, this._previousRect.x + this._previousRect.width);
                        const tempBottomR = Math.max(this._y + this._height, this._previousRect.y + this._previousRect.height);
                        tempRectR.width = tempRightR - tempRectR.x;
                        tempRectR.height = tempBottomR - tempRectR.y;
                        tempRectR.x -= this._x;
                        tempRectR.y -= this._y;
                        this._context.invalidate(this, tempRectR, 4);

                        // Notify children
                        childEvent = WindowEvent.allocate(WindowEvent.WE_PARENT_RELOCATED, this, null);
                        this.notifyChildren(childEvent);
                        childEvent.recycle();

                        // Propagate to parent
                        if(this._parent !== null) 
                        {
                            childEvent = WindowEvent.allocate(WindowEvent.WE_CHILD_RELOCATED, this._parent, this);
                            this._parent.update(this, childEvent);
                            childEvent.recycle();
                        }
                    }
                    break;

                case WindowEvent.WE_ACTIVATED:
                    if(source === this) 
                    {
                        childEvent = WindowEvent.allocate(WindowEvent.WE_PARENT_ACTIVATED, this, null);
                        this.notifyChildren(childEvent);
                        childEvent.recycle();

                        if(this._parent !== null) 
                        {
                            childEvent = WindowEvent.allocate(WindowEvent.WE_CHILD_ACTIVATED, this._parent, this);
                            this._parent.update(this, childEvent);
                            childEvent.recycle();
                        }
                    }
                    break;

                case WindowEvent.WE_PARENT_ADDED:
                    if(this.testParamFlag(192, 192) || this.testParamFlag(0x0C00, 0x0C00)) 
                    {
                        this.updateScaleRelativeToParent();
                    }

                    this._context.invalidate(this, null, 1);
                    break;

                case WindowEvent.WE_PARENT_RESIZED:
                    if(this._parent) 
                    {
                        this._parent.getRegionProperties(null, this._parentRect);
                    }

                    this.updateScaleRelativeToParent();
                    break;

                case WindowEvent.WE_CHILD_ADDED:
                    if(this.testParamFlag(147456)) 
                    {
                        this.scaleToAccommodateChildren();
                    }
                    else if(this.testParamFlag(0x20000)) 
                    {
                        WindowController.expandToAccommodateChild(this, event.related!);
                    }

                    this.renderDynamicStyle();
                    break;

                case WindowEvent.WE_CHILD_REMOVED:
                    if(this.testParamFlag(147456)) 
                    {
                        this.scaleToAccommodateChildren();
                    }
                    break;

                case WindowEvent.WE_CHILD_ACTIVATED:
                    this.activate();
                    break;

                case WindowEvent.WE_CHILD_RESIZED:
                    if(this.testParamFlag(147456)) 
                    {
                        this.scaleToAccommodateChildren();
                    }
                    else if(this.testParamFlag(0x20000)) 
                    {
                        WindowController.expandToAccommodateChild(this, event.related!);
                    }
                    break;

                case WindowEvent.WE_CHILD_RELOCATED:
                    if(this.testParamFlag(147456)) 
                    {
                        this.scaleToAccommodateChildren();
                    }
                    else if(this.testParamFlag(0x20000)) 
                    {
                        WindowController.expandToAccommodateChild(this, event.related!);
                    }
                    break;

                case WindowEvent.WE_CHILD_VISIBILITY:
                    if(source === this) 
                    {
                        if(this._parent !== null) 
                        {
                            childEvent = WindowEvent.allocate(WindowEvent.WE_CHILD_VISIBILITY, this._parent, this);
                            this._parent.update(this, childEvent);
                            childEvent.recycle();
                        }
                    }
                    break;
            }
        }

        return true;
    }

    /**
     * Gets the local position of this window.
     *
     * @param out - Point to populate
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::getLocalPosition()
    public getLocalPosition(out: { x: number; y: number }): void 
    {
        out.x = this._x;
        out.y = this._y;
    }

    /**
     * Gets the local rectangle of this window.
     *
     * @param out - Rectangle to populate
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::getLocalRectangle()
    public getLocalRectangle(out: { x: number; y: number; width: number; height: number }): void 
    {
        out.x = this._x;
        out.y = this._y;
        out.width = this._width;
        out.height = this._height;
    }

    /**
     * Tests whether a local-space point is within this window's bounds.
     *
     * @param point - The point in local coordinates
     * @returns `true` if the point is inside the window
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::hitTestLocalPoint()
    public hitTestLocalPoint(point: { x: number; y: number }): boolean 
    {
        return (
            point.x >= this._x &&
            point.x < (this._x + this._width) &&
            point.y >= this._y &&
            point.y < (this._y + this._height)
        );
    }

    /**
     * Tests whether a local-space rectangle intersects this window's bounds.
     *
     * @param rect - The rectangle in local coordinates
     * @returns `true` if the rectangles intersect
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::hitTestLocalRectangle()
    public hitTestLocalRectangle(rect: { x: number; y: number; width: number; height: number }): boolean 
    {
        return !(
            rect.x >= this._x + this._width ||
            rect.x + rect.width <= this._x ||
            rect.y >= this._y + this._height ||
            rect.y + rect.height <= this._y
        );
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::validateLocalPointIntersection()
    public validateLocalPointIntersection(point: { x: number; y: number }, drawBuffer: unknown): boolean 
    {
        return this.testLocalPointHitAgainstAlpha(point, drawBuffer, this._mouseThreshold);
    }

    /**
     * Gets the global position of this window by accumulating parent positions.
     *
     * @param out - Point to populate
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::getGlobalPosition()
    public getGlobalPosition(out: { x: number; y: number }): void 
    {
        if(this._parent !== null) 
        {
            this._parent.getGlobalPosition(out);
            out.x = out.x + this._x;
            out.y = out.y + this._y;
        }
        else 
        {
            out.x = this._x;
            out.y = this._y;
        }
    }

    /**
     * Sets the position so that the global position matches the given point.
     *
     * @param point - The desired global position
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::setGlobalPosition()
    public setGlobalPosition(point: { x: number; y: number }): void 
    {
        const current: { x: number; y: number } = {x: 0, y: 0};

        if(this._parent !== null) 
        {
            this._parent.getGlobalPosition(current);
            current.x = current.x + this._x;
            current.y = current.y + this._y;
        }
        else 
        {
            current.x = this._x;
            current.y = this._y;
        }

        this.x = this._x + (point.x - current.x);
        this.y = this._y + (point.y - current.y);
    }

    /**
     * Gets the global rectangle of this window.
     *
     * @param out - Rectangle to populate
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::getGlobalRectangle()
    public getGlobalRectangle(out: { x: number; y: number; width: number; height: number }): void 
    {
        if(this._parent !== null) 
        {
            this._parent.getGlobalRectangle(out);
            out.x = out.x + this._x;
            out.y = out.y + this._y;
        }
        else 
        {
            out.x = this._x;
            out.y = this._y;
        }

        out.width = this._width;
        out.height = this._height;
    }

    /**
     * Sets position and size so that the global rectangle matches.
     *
     * @param rect - The desired global rectangle
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::setGlobalRectangle()
    public setGlobalRectangle(rect: { x: number; y: number; width: number; height: number }): void 
    {
        const current: { x: number; y: number } = {x: 0, y: 0};

        if(this._parent !== null) 
        {
            this._parent.getGlobalPosition(current);
            current.x = current.x + this._x;
            current.y = current.y + this._y;
        }
        else 
        {
            current.x = this._x;
            current.y = this._y;
        }

        this.setRectangle(
            this._x + (rect.x - current.x),
            this._y + (rect.y - current.y),
            rect.width,
            rect.height
        );
    }

    /**
     * Tests whether a global-space point is within this window's global bounds.
     *
     * @param point - The point in global coordinates
     * @returns `true` if the point is inside
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::hitTestGlobalPoint()
    public hitTestGlobalPoint(point: { x: number; y: number }): boolean 
    {
        const rect: { x: number; y: number; width: number; height: number } = {x: 0, y: 0, width: 0, height: 0};
        this.getGlobalRectangle(rect);

        return (
            point.x >= rect.x &&
            point.x < rect.x + rect.width &&
            point.y >= rect.y &&
            point.y < rect.y + rect.height
        );
    }

    /**
     * Tests whether a global-space rectangle intersects this window's global bounds.
     *
     * @param rect - The rectangle in global coordinates
     * @returns `true` if they intersect
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::hitTestGlobalRectangle()
    public hitTestGlobalRectangle(rect: { x: number; y: number; width: number; height: number }): boolean 
    {
        const global: { x: number; y: number; width: number; height: number } = {x: 0, y: 0, width: 0, height: 0};
        this.getGlobalRectangle(global);

        return !(
            rect.x >= global.x + global.width ||
            rect.x + rect.width <= global.x ||
            rect.y >= global.y + global.height ||
            rect.y + rect.height <= global.y
        );
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::validateGlobalPointIntersection()
    public validateGlobalPointIntersection(point: { x: number; y: number }, drawBuffer: unknown): boolean 
    {
        const local: { x: number; y: number } = {x: 0, y: 0};
        this.getGlobalPosition(local);
        local.x = point.x - local.x;
        local.y = point.y - local.y;

        return this.testLocalPointHitAgainstAlpha(local, drawBuffer, this._mouseThreshold);
    }

    /**
     * Converts a point from local space to global space.
     *
     * @param point - The point to convert (modified in place)
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::convertPointFromLocalToGlobalSpace()
    public convertPointFromLocalToGlobalSpace(point: { x: number; y: number }): void 
    {
        const localX: number = point.x;
        const localY: number = point.y;

        if(this._parent === null) 
        {
            point.x = this._x;
            point.y = this._y;
        }
        else 
        {
            this._parent.getGlobalPosition(point);
            point.x = point.x + this._x;
            point.y = point.y + this._y;
        }

        point.x = point.x + localX;
        point.y = point.y + localY;
    }

    /**
     * Converts a point from global space to local space.
     *
     * @param point - The point to convert (modified in place)
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::convertPointFromGlobalToLocalSpace()
    public convertPointFromGlobalToLocalSpace(point: { x: number; y: number }): void 
    {
        const globalX: number = point.x;
        const globalY: number = point.y;

        if(this._parent === null) 
        {
            point.x = this._x;
            point.y = this._y;
        }
        else 
        {
            this._parent.getGlobalPosition(point);
            point.x = point.x + this._x;
            point.y = point.y + this._y;
        }

        point.x = globalX - point.x;
        point.y = globalY - point.y;
    }

    /** Returns the vertical scale relative to the initial size. */
    // AS3: .../src/com/sulake/core/window/WindowController.as::resolveVerticalScale()
    public resolveVerticalScale(): number 
    {
        return this._height / this._initialRect.height;
    }

    /** Returns the horizontal scale relative to the initial size. */
    // AS3: .../src/com/sulake/core/window/WindowController.as::resolveHorizontalScale()
    public resolveHorizontalScale(): number 
    {
        return this._width / this._initialRect.width;
    }

    /**
     * Gets the relative mouse position within this window.
     *
     * @param out - Point to populate with relative coordinates
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::getRelativeMousePosition()
    public getRelativeMousePosition(out: { x: number; y: number }): void 
    {
        this.getGlobalPosition(out);
        const desktop = this._context.getDesktopWindow() as unknown as {
            mouseX?: number;
            mouseY?: number;
            x?: number;
            y?: number
        } | null;

        if(desktop) 
        {
            const mouseX = (typeof desktop.mouseX === 'number') ? desktop.mouseX : (desktop.x ?? 0);
            const mouseY = (typeof desktop.mouseY === 'number') ? desktop.mouseY : (desktop.y ?? 0);
            out.x = mouseX - out.x;
            out.y = mouseY - out.y;
        }
    }

    /**
     * Gets the absolute mouse position from the desktop.
     *
     * @param out - Point to populate with absolute coordinates
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::getAbsoluteMousePosition()
    public getAbsoluteMousePosition(out: { x: number; y: number }): void 
    {
        const desktop = this._context.getDesktopWindow() as unknown as {
            mouseX?: number;
            mouseY?: number;
            x?: number;
            y?: number
        } | null;

        if(desktop) 
        {
            out.x = (typeof desktop.mouseX === 'number') ? desktop.mouseX : (desktop.x ?? 0);
            out.y = (typeof desktop.mouseY === 'number') ? desktop.mouseY : (desktop.y ?? 0);
        }
    }

    /**
     * Gets the mouse interaction region for this window.
     *
     * @param out - Rectangle to populate
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::getMouseRegion()
    public getMouseRegion(out: { x: number; y: number; width: number; height: number }): void 
    {
        this.getGlobalRectangle(out);

        if(out.width < 0) out.width = 0;
        if(out.height < 0) out.height = 0;

        // If sharing parent graphic context, clip to parent mouse region
        if(this.testParamFlag(16) && this._parent !== null) 
        {
            const parentRegion: { x: number; y: number; width: number; height: number } = {
                x: 0,
                y: 0,
                width: 0,
                height: 0
            };
            (this._parent as IWindow).getMouseRegion(parentRegion);

            if(out.x < parentRegion.x) out.x = parentRegion.x;
            if(out.y < parentRegion.y) out.y = parentRegion.y;

            const outRight = out.x + out.width;
            const outBottom = out.y + out.height;
            const parentRight = parentRegion.x + parentRegion.width;
            const parentBottom = parentRegion.y + parentRegion.height;

            if(outRight > parentRight) out.width = parentRight - out.x;
            if(outBottom > parentBottom) out.height = parentBottom - out.y;
        }
    }

    /**
     * Finds an ancestor (or self) by name.
     *
     * @param name - The name to search for
     * @returns The matching window, or null
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::findParentByName()
    public findParentByName(name: string): IWindow | null 
    {
        if(this._name === name) return this;

        if(this._parent !== null) 
        {
            if(this._parent.name === name) return this._parent;

            return this._parent.findParentByName(name);
        }

        return null;
    }

    /**
     * Tests whether a local-space point is within the window bounds.
     *
     * Unlike hitTestLocalPoint, this checks against (0,0)-(width,height),
     * i.e. the window's own coordinate space without position offset.
     *
     * @param point - The point in local coordinates
     * @returns `true` if the point is inside bounds
     * @see sources/win63_version/core/window/WindowController.as line 1603
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::isInWindowBounds()
    public isInWindowBounds(point: { x: number; y: number }): boolean 
    {
        return point.x >= 0 && point.x < this._width && point.y >= 0 && point.y < this._height;
    }

    /**
     * Returns whether this window can use a shared graphic context.
     *
     * @returns Always `true` for base WindowController
     * @see sources/win63_version/core/window/WindowController.as line 1608
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::isCapableOfUsingSharedGraphicContext()
    public isCapableOfUsingSharedGraphicContext(): boolean 
    {
        return true;
    }

    /**
     * Finds the deepest child under a global point.
     *
     * Walks the child tree from top to bottom (back-to-front rendering order).
     * Returns the deepest visible child whose mouse region contains the point.
     *
     * @param point - The point in global coordinates
     * @returns The topmost child under the point, or null
     * @see sources/win63_version/core/window/WindowController.as line 2111
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::getChildUnderPoint()
    public getChildUnderPoint(point: { x: number; y: number }): IWindow | null 
    {
        if(this._visible) 
        {
            const region: { x: number; y: number; width: number; height: number } = {x: 0, y: 0, width: 0, height: 0};
            this.getMouseRegion(region);

            const inRegion: boolean = (
                point.x >= region.x &&
                point.x < region.x + region.width &&
                point.y >= region.y &&
                point.y < region.y + region.height
            );

            const numKids: number = this.numChildren;

            if(inRegion) 
            {
                let i: number = numKids;

                while(i > 0) 
                {
                    const child = (this._children![i - 1] as WindowController).getChildUnderPoint(point);

                    if(child !== null) 
                    {
                        return child;
                    }

                    i--;
                }
            }

            // Check self
            if(this.validateGlobalPointIntersection(point, null)) 
            {
                return this;
            }
        }

        return null;
    }

    /**
     * Collects all children (and self) that contain the given local point.
     *
     * Walks recursively, translating the point into each child's coordinate space.
     * If this window has clipping enabled, children outside bounds are skipped.
     *
     * @param point - The point in local coordinates (modified during recursion)
     * @param result - Array to populate with matching windows
     * @see sources/win63_version/core/window/WindowController.as line 2141
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::groupChildrenUnderPoint()
    public groupChildrenUnderPoint(point: { x: number; y: number }, result: IWindow[]): void 
    {
        if(this._visible) 
        {
            if(point.x >= this._x && point.x < this._x + this._width &&
                point.y >= this._y && point.y < this._y + this._height) 
            {
                result.push(this);

                if(this._children) 
                {
                    point.x -= this._x;
                    point.y -= this._y;

                    for(const child of this._children) 
                    {
                        (child as WindowController).groupChildrenUnderPoint(point, result);
                    }

                    point.x += this._x;
                    point.y += this._y;
                }
            }
            else if(!this._clipping) 
            {
                if(this._children) 
                {
                    point.x -= this._x;
                    point.y -= this._y;

                    for(const child of this._children) 
                    {
                        (child as WindowController).groupChildrenUnderPoint(point, result);
                    }

                    point.x += this._x;
                    point.y += this._y;
                }
            }
        }
    }

    /**
     * Collects children under a point filtered by param flags.
     *
     * Like groupChildrenUnderPoint but only includes windows whose param
     * flags match the given filter mask.
     *
     * @param point - The point in local coordinates (modified during recursion)
     * @param result - Array to populate with matching windows
     * @param paramFilter - Param flag mask to filter by
     * @see sources/win63_version/core/window/WindowController.as line 2174
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::groupParameterFilteredChildrenUnderPoint()
    public groupParameterFilteredChildrenUnderPoint(point: {
        x: number;
        y: number
    }, result: IWindow[], paramFilter: number = 0): void 
    {
        if(this._visible) 
        {
            if(point.x >= this._x && point.x < this._x + this._width &&
                point.y >= this._y && point.y < this._y + this._height) 
            {
                if((this._param & paramFilter) === paramFilter) 
                {
                    result.push(this);
                }

                if(this._children) 
                {
                    point.x -= this._x;
                    point.y -= this._y;

                    for(const child of this._children) 
                    {
                        (child as WindowController).groupParameterFilteredChildrenUnderPoint(point, result, paramFilter);
                    }

                    point.x += this._x;
                    point.y += this._y;
                }
            }
            else if(!this._clipping) 
            {
                if(this._children) 
                {
                    point.x -= this._x;
                    point.y -= this._y;

                    for(const child of this._children) 
                    {
                        (child as WindowController).groupParameterFilteredChildrenUnderPoint(point, result, paramFilter);
                    }

                    point.x += this._x;
                    point.y += this._y;
                }
            }
        }
    }

    /**
     * Gets whether a state flag is set.
     *
     * @param flag - The flag bitmask
     * @returns `true` if the flag is set
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::getStateFlag()
    public getStateFlag(flag: number): boolean 
    {
        return (this._state & flag) !== 0;
    }

    /**
     * Sets or clears a state flag.
     *
     * @param flag - The flag bitmask
     * @param value - Whether to set (true) or clear (false)
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::setStateFlag()
    public setStateFlag(flag: number, value: boolean = true): void 
    {
        const previous: number = this._state;

        this._state = value ? (this._state | flag) : (this._state & ~flag);

        if(this._state !== previous) 
        {
            this.renderDynamicStyle();
            this._context.invalidate(this, null, 8);
        }
    }

    /**
     * Gets whether a style flag is set.
     *
     * @param flag - The flag bitmask
     * @returns `true` if the flag is set
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::getStyleFlag()
    public getStyleFlag(flag: number): boolean 
    {
        return (this._style & flag) !== 0;
    }

    /**
     * Sets or clears a style flag.
     *
     * @param flag - The flag bitmask
     * @param value - Whether to set (true) or clear (false)
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::setStyleFlag()
    public setStyleFlag(flag: number, value: boolean = true): void 
    {
        const previous: number = this._style;

        this._style = value ? (this._style | flag) : (this._style & ~flag);

        if(this._style !== previous) 
        {
            // Propagate to internal children
            const internalChildren: IWindow[] = [];
            this.groupChildrenWithTag(WindowController.TAG_INTERNAL, internalChildren);

            for(let i = internalChildren.length - 1; i >= 0; i--) 
            {
                const child = internalChildren[i] as WindowController;

                if(child.tags.indexOf(WindowController.TAG_IGNORE_INHERITED_STYLE) === -1) 
                {
                    child.style = this._style;
                }
            }

            this._context.invalidate(this, null, 1);
        }
    }

    /**
     * Gets whether a param flag is set.
     *
     * @param flag - The flag bitmask
     * @returns `true` if the flag is set
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::getParamFlag()
    public getParamFlag(flag: number): boolean 
    {
        return (this._param & flag) !== 0;
    }

    /**
     * Sets or clears a param flag.
     *
     * @param flag - The flag bitmask
     * @param value - Whether to set (true) or clear (false)
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::setParamFlag()
    public setParamFlag(flag: number, value: boolean = true): void 
    {
        const previous: number = this._param;

        this._param = value ? (this._param | flag) : (this._param & ~flag);

        if(this._param !== previous) 
        {
            if(!(this._param & 0x10)) 
            {
                if(!this._graphicContext) 
                {
                    this.setupGraphicsContext();
                    this._context.invalidate(this, null, 1);
                }
            }
            else if(this._param & 0x10) 
            {
                if(this._graphicContext) 
                {
                    this._context.invalidate(this, null, 1);
                }
            }
        }
    }

    /**
     * Activates this window.
     *
     * @returns `true` if activation succeeded
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::activate()
    public activate(): boolean 
    {
        let event = WindowEvent.allocate(WindowEvent.WE_ACTIVATE, this, null);
        this.update(this, event);

        if(event.isDefaultPrevented()) 
        {
            event.recycle();

            return false;
        }

        event.recycle();

        this.setStateFlag(1, true);

        event = WindowEvent.allocate(WindowEvent.WE_ACTIVATED, this, null);
        this.update(this, event);
        event.recycle();

        return true;
    }

    /**
     * Deactivates this window.
     *
     * @returns `true` if deactivation succeeded
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::deactivate()
    public deactivate(): boolean 
    {
        if(!this.getStateFlag(1)) 
        {
            return true;
        }

        let event = WindowEvent.allocate(WindowEvent.WE_DEACTIVATE, this, null);
        this.update(this, event);

        if(event.isDefaultPrevented()) 
        {
            event.recycle();

            return false;
        }

        event.recycle();

        this.setStateFlag(1, false);

        event = WindowEvent.allocate(WindowEvent.WE_DEACTIVATED, this, null);
        this.update(this, event);
        event.recycle();

        return true;
    }

    /**
     * Minimizes this window.
     *
     * @returns `true` if minimization succeeded
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::minimize()
    public minimize(): boolean 
    {
        if(this._state & 0x40) 
        {
            return false;
        }

        let event = WindowEvent.allocate(WindowEvent.WE_MINIMIZE, this, null);
        this.update(this, event);

        if(event.isDefaultPrevented()) 
        {
            event.recycle();

            return false;
        }

        event.recycle();

        this.setStateFlag(64, true);

        event = WindowEvent.allocate(WindowEvent.WE_MINIMIZED, this, null);
        this.update(this, event);
        event.recycle();

        return true;
    }

    /**
     * Maximizes this window.
     *
     * @returns `true` if maximization succeeded
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::maximize()
    public maximize(): boolean 
    {
        if(this._state & 0x40) 
        {
            return false;
        }

        let event = WindowEvent.allocate(WindowEvent.WE_MAXIMIZE, this, null);
        this.update(this, event);

        if(event.isDefaultPrevented()) 
        {
            event.recycle();

            return false;
        }

        event.recycle();

        this.setStateFlag(64, true);

        event = WindowEvent.allocate(WindowEvent.WE_MAXIMIZED, this, null);
        this.update(this, event);
        event.recycle();

        return true;
    }

    /**
     * Restores this window from minimized/maximized state.
     *
     * @returns `true` if restoration succeeded
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::restore()
    public restore(): boolean 
    {
        let event = WindowEvent.allocate(WindowEvent.WE_RESTORE, this, null);
        this.update(this, event);

        if(event.isDefaultPrevented()) 
        {
            event.recycle();

            return false;
        }

        event.recycle();

        this.setStateFlag(64, false);

        event = WindowEvent.allocate(WindowEvent.WE_RESTORED, this, null);
        this.update(this, event);
        event.recycle();

        return true;
    }

    /**
     * Locks this window.
     *
     * @returns `true` if locking succeeded
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::lock()
    public lock(): boolean 
    {
        if(this.getStateFlag(64)) 
        {
            return true;
        }

        let event = WindowEvent.allocate(WindowEvent.WE_LOCK, this, null);
        this.update(this, event);

        if(event.isDefaultPrevented()) 
        {
            event.recycle();

            return false;
        }

        event.recycle();

        this.setStateFlag(64, true);

        event = WindowEvent.allocate(WindowEvent.WE_LOCKED, this, null);
        this.update(this, event);
        event.recycle();

        return true;
    }

    /**
     * Unlocks this window.
     *
     * @returns `true` if unlocking succeeded
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::unlock()
    public unlock(): boolean 
    {
        if(!this.getStateFlag(64)) 
        {
            return true;
        }

        let event = WindowEvent.allocate(WindowEvent.WE_UNLOCK, this, null);
        this.update(this, event);

        if(event.isDefaultPrevented()) 
        {
            event.recycle();

            return false;
        }

        event.recycle();

        this.setStateFlag(64, false);

        event = WindowEvent.allocate(WindowEvent.WE_UNLOCKED, this, null);
        this.update(this, event);
        event.recycle();

        return true;
    }

    /**
     * Enables this window (clears disabled state).
     *
     * @returns `true` if enabling succeeded
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::enable()
    public enable(): boolean 
    {
        if(!this.getStateFlag(32)) 
        {
            return true;
        }

        let event = WindowEvent.allocate(WindowEvent.WE_ENABLE, this, null);
        this.update(this, event);

        if(event.isDefaultPrevented()) 
        {
            event.recycle();

            return false;
        }

        event.recycle();

        this.setStateFlag(32, false);

        event = WindowEvent.allocate(WindowEvent.WE_ENABLED, this, null);
        this.update(this, event);
        event.recycle();

        return true;
    }

    /**
     * Disables this window.
     *
     * @returns `true` if disabling succeeded
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::disable()
    public disable(): boolean 
    {
        if(this.getStateFlag(32)) 
        {
            return true;
        }

        let event = WindowEvent.allocate(WindowEvent.WE_DISABLE, this, null);
        this.update(this, event);

        if(event.isDefaultPrevented()) 
        {
            event.recycle();

            return false;
        }

        event.recycle();

        this.setStateFlag(32, true);

        event = WindowEvent.allocate(WindowEvent.WE_DISABLED, this, null);
        this.update(this, event);
        event.recycle();

        return true;
    }

    /**
     * Sets focus on this window.
     *
     * Dispatches WE_FOCUS (pre) and WE_FOCUSED (post) events.
     * Sets state flag 2 (focused).
     *
     * @returns `true` if focusing succeeded
     * @see sources/win63_version/core/window/WindowController.as line 2069
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::focus()
    public focus(): boolean 
    {
        if(this.getStateFlag(2)) 
        {
            return true;
        }

        let event = WindowEvent.allocate(WindowEvent.WE_FOCUS, this, null);
        this.update(this, event);

        if(event.isDefaultPrevented()) 
        {
            event.recycle();

            return false;
        }

        event.recycle();

        this.setStateFlag(2, true);

        event = WindowEvent.allocate(WindowEvent.WE_FOCUSED, this, null);
        this.update(this, event);
        event.recycle();

        return true;
    }

    /**
     * Removes focus from this window.
     *
     * Dispatches WE_UNFOCUS (pre) and WE_UNFOCUSED (post) events.
     * Clears state flag 2 (focused).
     *
     * @returns `true` if unfocusing succeeded
     * @see sources/win63_version/core/window/WindowController.as line 2090
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::unfocus()
    public unfocus(): boolean 
    {
        if(!this.getStateFlag(2)) 
        {
            return true;
        }

        let event = WindowEvent.allocate(WindowEvent.WE_UNFOCUS, this, null);
        this.update(this, event);

        if(event.isDefaultPrevented()) 
        {
            event.recycle();

            return false;
        }

        event.recycle();

        this.setStateFlag(2, false);

        event = WindowEvent.allocate(WindowEvent.WE_UNFOCUSED, this, null);
        this.update(this, event);
        event.recycle();

        return true;
    }

    /** Returns whether this window is enabled (not disabled). */
    // AS3: .../src/com/sulake/core/window/WindowController.as::isEnabled()
    public isEnabled(): boolean 
    {
        return !this.getStateFlag(32);
    }

    /**
     * Destroys this window, dispatching destroy events and disposing.
     *
     * @returns `true` if destruction succeeded
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::destroy()
    public destroy(): boolean 
    {
        if(this._state === 0x40000000) 
        {
            return true;
        }

        this._state = 0x40000000;

        let event = WindowEvent.allocate(WindowEvent.WE_DESTROY, this, null);
        this.update(this, event);

        if(event.isDefaultPrevented()) 
        {
            event.recycle();

            return false;
        }

        event.recycle();

        event = WindowEvent.allocate(WindowEvent.WE_DESTROYED, this, null);
        this.update(this, event);
        event.recycle();

        this.dispose();

        return true;
    }

    /**
     * Registers an event listener.
     *
     * @param type - The event type string
     * @param listener - The callback function
     * @param priority - Listener priority (higher = first)
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::addEventListener()
    public addEventListener(type: string, listener: WindowEventListener, priority: number = 0): void
    {
        if(!this._disposed) 
        {
            if(!this._eventDispatcher) 
            {
                this._eventDispatcher = new WindowEventDispatcher();
            }

            this._eventDispatcher.addEventListener(type, listener, priority);
        }
    }

    /**
     * Returns whether any listener is registered for the given type.
     *
     * @param type - The event type string
     * @returns `true` if a listener exists
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::hasEventListener()
    public hasEventListener(type: string): boolean 
    {
        if(this._disposed || !this._eventDispatcher) return false;

        return this._eventDispatcher.hasEventListener(type);
    }

    /**
     * Removes a previously registered event listener.
     *
     * @param type - The event type string
     * @param listener - The callback function to remove
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::removeEventListener()
    public removeEventListener(type: string, listener: WindowEventListener): void
    {
        if(!this._disposed && this._eventDispatcher) 
        {
            this._eventDispatcher.removeEventListener(type, listener);
        }
    }

    /**
     * Creates a property struct with a custom value.
     *
     * @param key - The property key
     * @param value - The property value
     * @returns A new PropertyStruct
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::createProperty()
    public createProperty(key: string, value: unknown): PropertyStruct 
    {
        if(this._propertyMap) 
        {
            const defaultValue = this._propertyMap.get(key);

            if(defaultValue) 
            {
                return defaultValue.withValue(value);
            }
        }

        return new PropertyStruct(key, value);
    }

    /**
     * Gets the default property for the given key from the theme.
     *
     * @param key - The property key
     * @returns The default PropertyStruct, or null
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::getDefaultProperty()
    public getDefaultProperty(key: string): PropertyStruct | null 
    {
        if(this._propertyMap) 
        {
            return this._propertyMap.get(key);
        }

        return null;
    }

    /**
     * Enables or disables children by name.
     *
     * @param doEnable - Whether to enable (true) or disable (false)
     * @param exceptions - Names of children to target
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::enableChildren()
    public enableChildren(doEnable: boolean, exceptions: string[]): void 
    {
        for(const name of exceptions) 
        {
            const child = this.findChildByName(name);

            if(child !== null) 
            {
                if(doEnable) 
                {
                    child.enable();
                }
                else 
                {
                    child.disable();
                }
            }
        }
    }

    /**
     * Activates or deactivates children by name.
     *
     * @param doActivate - Whether to activate (true) or deactivate (false)
     * @param exceptions - Names of children to target
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::activateChildren()
    public activateChildren(doActivate: boolean, exceptions: string[]): void 
    {
        for(const name of exceptions) 
        {
            const child = this.findChildByName(name);

            if(child !== null) 
            {
                if(doActivate) 
                {
                    child.activate();
                }
                else 
                {
                    child.deactivate();
                }
            }
        }
    }

    /**
     * Sets visibility of children by name.
     *
     * @param isVisible - Whether to make visible (true) or hide (false)
     * @param exceptions - Names of children to target
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::setVisibleChildren()
    public setVisibleChildren(isVisible: boolean, exceptions: string[]): void 
    {
        for(const name of exceptions) 
        {
            const child = this.findChildByName(name);

            if(child !== null) 
            {
                child.visible = isVisible;
            }
        }
    }

    /**
     * Adds a child window. Removes it from its previous parent first.
     *
     * @param child - The window to add
     * @returns The added window
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::addChild()
    public addChild(child: IWindow): IWindow 
    {
        const wc = child as WindowController;

        if(wc.parent !== null) 
        {
            (wc.parent as WindowController).removeChild(wc);
        }

        if(!this._children) 
        {
            this._children = [];
        }

        this._children.push(wc);
        wc.parent = this;

        if(this._graphicsSetup || wc.hasGraphicsContext()) 
        {
            const parentGc = this.setupGraphicsContext();
            const childGc = wc.getGraphicContext(true);

            if(parentGc && childGc && parentGc.getChildContextIndex(childGc) === -1) 
            {
                parentGc.addChildContext(childGc);
            }
        }

        const event = WindowEvent.allocate(WindowEvent.WE_CHILD_ADDED, this, child);
        this.update(this, event);
        event.recycle();

        return child;
    }

    /**
     * Adds a child window at a specific index.
     *
     * @param child - The window to add
     * @param index - The position to insert at
     * @returns The added window
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::addChildAt()
    public addChildAt(child: IWindow, index: number): IWindow 
    {
        const wc = child as WindowController;

        if(wc.parent !== null) 
        {
            (wc.parent as WindowController).removeChild(wc);
        }

        if(!this._children) 
        {
            this._children = [];
        }

        this._children.splice(index, 0, wc);
        wc.parent = this;

        if(this._graphicsSetup || wc.hasGraphicsContext()) 
        {
            const parentGc = this.setupGraphicsContext();
            const childGc = wc.getGraphicContext(true);

            if(parentGc && childGc && parentGc.getChildContextIndex(childGc) === -1) 
            {
                parentGc.addChildContextAt(childGc, index);
            }
        }

        const event = WindowEvent.allocate(WindowEvent.WE_CHILD_ADDED, this, child);
        this.update(this, event);
        event.recycle();

        return child;
    }

    /**
     * Gets the child at the given index.
     *
     * @param index - The child index
     * @returns The child window, or null if out of range
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::getChildAt()
    public getChildAt(index: number): IWindow | null 
    {
        if(!this._children) return null;

        return (index < this._children.length && index >= 0) ? this._children[index] : null;
    }

    /**
     * Gets a child by its ID.
     *
     * @param id - The child ID
     * @returns The matching child, or null
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::getChildByID()
    public getChildByID(id: number): IWindow | null 
    {
        if(this._children) 
        {
            for(const child of this._children) 
            {
                if(child.id === id) return child;
            }
        }

        return null;
    }

    /**
     * Gets a direct child by name (shallow search).
     *
     * @param name - The child name
     * @returns The matching child, or null
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::getChildByName()
    public getChildByName(name: string): IWindow | null 
    {
        if(this._children) 
        {
            for(const child of this._children) 
            {
                if(child.name === name) return child;
            }
        }

        return null;
    }

    /**
     * Finds a child by name recursively (deep search).
     *
     * @param name - The child name to find
     * @returns The matching window, or null
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::findChildByName()
    public findChildByName(name: string): IWindow | null 
    {
        if(this._lookupCache && this._lookupCache.has(name)) 
        {
            return this._lookupCache.get(name) ?? null;
        }

        if(this._children) 
        {
            // First pass: direct children
            for(const child of this._children) 
            {
                if(child.name === name) 
                {
                    if(this._lookupCache) this._lookupCache.set(name, child);

                    return child;
                }
            }

            // Second pass: recurse
            for(const child of this._children) 
            {
                const found = (child as WindowController).findChildByName(name);

                if(found) 
                {
                    if(this._lookupCache) this._lookupCache.set(name, found);

                    return found;
                }
            }
        }

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/WindowController.as::enableLookupCache()
    public enableLookupCache(): void 
    {
        if(!this._lookupCache) this._lookupCache = new Map();
    }

    /**
     * Gets a direct child by tag (shallow search).
     *
     * @param tag - The tag to search for
     * @returns The matching child, or null
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::getChildByTag()
    public getChildByTag(tag: string): IWindow | null 
    {
        if(this._children) 
        {
            for(const child of this._children) 
            {
                if(child.tags.indexOf(tag) > -1) return child;
            }
        }

        return null;
    }

    /**
     * Finds a child by tag recursively (deep search).
     *
     * @param tag - The tag to search for
     * @returns The matching window, or null
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::findChildByTag()
    public findChildByTag(tag: string): IWindow | null 
    {
        if(this._tags && this._tags.indexOf(tag) > -1) 
        {
            return this;
        }

        let found = this.getChildByTag(tag) as WindowController | null;

        if(found === null && this._children) 
        {
            for(const child of this._children) 
            {
                found = (child as WindowController).findChildByTag(tag) as WindowController | null;

                if(found !== null) break;
            }
        }

        return found;
    }

    /**
     * Gets the index of a child window.
     *
     * @param child - The child to find
     * @returns The index, or -1 if not found
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::getChildIndex()
    public getChildIndex(child: IWindow): number 
    {
        return this._children ? this._children.indexOf(child) : -1;
    }

    /**
     * Removes a child window.
     *
     * @param child - The window to remove
     * @returns The removed window, or null if not found
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::removeChild()
    public removeChild(child: IWindow): IWindow | null 
    {
        if(!this._children) return null;

        const index: number = this._children.indexOf(child);

        if(index < 0) return null;

        this._children.splice(index, 1);
        child.parent = null;

        const childGraphicHost = child as unknown as IGraphicContextHost;

        if(this._graphicContext && childGraphicHost && childGraphicHost.hasGraphicsContext()) 
        {
            const childGc = childGraphicHost.getGraphicContext(true);

            if(childGc) 
            {
                this._graphicContext.removeChildContext(childGc);
            }
        }

        const event = WindowEvent.allocate(WindowEvent.WE_CHILD_REMOVED, this, child);
        this.update(this, event);
        event.recycle();

        return child;
    }

    /**
     * Removes a child at the given index.
     *
     * @param index - The index of the child to remove
     * @returns The removed window, or null
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::removeChildAt()
    public removeChildAt(index: number): IWindow | null 
    {
        const child = this.getChildAt(index);

        return child ? this.removeChild(child) : null;
    }

    /**
     * Sets the display index of a child window.
     *
     * @param child - The child to reindex
     * @param index - The new index
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::setChildIndex()
    public setChildIndex(child: IWindow, index: number): void 
    {
        if(!this._children) return;

        const currentIndex: number = this._children.indexOf(child);

        if(currentIndex > -1 && index !== currentIndex) 
        {
            this._children.splice(currentIndex, 1);
            this._children.splice(index, 0, child);

            const wc = child as WindowController;

            if(this._graphicContext && wc.hasGraphicsContext()) 
            {
                const childGc = wc.getGraphicContext(true);

                if(childGc) 
                {
                    this._graphicContext.setChildContextIndex(childGc, this.getChildIndex(wc));
                }
            }
        }
    }

    /**
     * Swaps the positions of two child windows.
     *
     * @param childA - First child
     * @param childB - Second child
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::swapChildren()
    public swapChildren(childA: IWindow, childB: IWindow): void 
    {
        if(!this._children) return;
        if(!childA || !childB || childA === childB) return;

        let indexA: number = this._children.indexOf(childA);
        let indexB: number = this._children.indexOf(childB);

        if(indexA < 0 || indexB < 0) return;

        // Ensure indexA < indexB for correct splicing
        if(indexB < indexA) 
        {
            const temp = childA;
            childA = childB;
            childB = temp;
            const tempIdx = indexA;
            indexA = indexB;
            indexB = tempIdx;
        }

        this._children.splice(indexB, 1);
        this._children.splice(indexA, 1);
        this._children.splice(indexA, 0, childB);
        this._children.splice(indexB, 0, childA);

        const childAWindow = childA as WindowController;
        const childBWindow = childB as WindowController;

        if(this._graphicContext && (childAWindow.hasGraphicsContext() || childBWindow.hasGraphicsContext())) 
        {
            const gcA = childAWindow.getGraphicContext(true);
            const gcB = childBWindow.getGraphicContext(true);

            if(gcA && gcB) 
            {
                this._graphicContext.swapChildContexts(gcA, gcB);
            }
        }
    }

    /**
     * Swaps two children by their indices.
     *
     * @param indexA - First child index
     * @param indexB - Second child index
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::swapChildrenAt()
    public swapChildrenAt(indexA: number, indexB: number): void 
    {
        if(!this._children) return;

        const childA = this._children[indexA];
        const childB = this._children[indexB];

        if(childA && childB) 
        {
            this.swapChildren(childA, childB);

            if(this._graphicContext) 
            {
                this._graphicContext.swapChildContextsAt(indexA, indexB);
            }
        }
    }

    /**
     * Collects children matching an ID into the result array.
     *
     * @param id - The ID to match
     * @param result - The array to populate
     * @param depth - How many levels deep to search (0 = this level only, -1 = infinite)
     * @returns The number of matches found
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::groupChildrenWithID()
    public groupChildrenWithID(id: number, result: IWindow[], depth: number = 0): number 
    {
        if(!this._children) return 0;

        let count: number = 0;

        for(const child of this._children) 
        {
            if(child.id === id) 
            {
                result.push(child);
                count++;
            }

            if(depth > 0 || depth < 0) 
            {
                count += (child as WindowController).groupChildrenWithID(id, result, depth - 1);
            }
        }

        return count;
    }

    /**
     * Collects children matching a tag into the result array.
     *
     * @param tag - The tag to match
     * @param result - The array to populate
     * @param depth - How many levels deep to search (0 = this level only, -1 = infinite)
     * @returns The number of matches found
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::groupChildrenWithTag()
    public groupChildrenWithTag(tag: string, result: IWindow[], depth: number = 0): number 
    {
        if(!this._children) return 0;

        let count: number = 0;

        for(const child of this._children) 
        {
            if(child.tags.indexOf(tag) > -1) 
            {
                result.push(child);
                count++;
            }

            if(depth > 0 || depth < 0) 
            {
                count += (child as WindowController).groupChildrenWithTag(tag, result, depth - 1);
            }
        }

        return count;
    }

    /**
     * Populates the window with an array of child windows.
     *
     * @param children - The children to add
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::populate()
    public populate(children: IWindow[]): void 
    {
        let hasGraphicChildren: boolean = false;

        if(!this._children) 
        {
            this._children = [];
        }

        for(const child of children) 
        {
            const wc = child as WindowController;

            if(wc && wc.parent !== this) 
            {
                this._children.push(wc);
                wc.parent = this;
                hasGraphicChildren = hasGraphicChildren || wc.hasGraphicsContext();
            }
        }

        if(this._graphicsSetup || hasGraphicChildren) 
        {
            this.setupGraphicsContext();
        }
    }

    /**
     * Gets region property rectangles.
     *
     * @param current - Receives the current rectangle
     * @param previous - Receives the previous rectangle
     * @param minimized - Receives the minimized rectangle
     * @param maximized - Receives the maximized rectangle
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::getRegionProperties()
    public getRegionProperties(
        current: { x: number; y: number; width: number; height: number } | null = null,
        previous: { x: number; y: number; width: number; height: number } | null = null,
        minimized: { x: number; y: number; width: number; height: number } | null = null,
        maximized: { x: number; y: number; width: number; height: number } | null = null
    ): void 
    {
        if(current !== null) 
        {
            current.x = this._x;
            current.y = this._y;
            current.width = this._width;
            current.height = this._height;
        }

        if(previous !== null) 
        {
            previous.x = this._previousRect.x;
            previous.y = this._previousRect.y;
            previous.width = this._previousRect.width;
            previous.height = this._previousRect.height;
        }

        if(minimized !== null && this._minimizedRect !== null) 
        {
            minimized.x = this._minimizedRect.x;
            minimized.y = this._minimizedRect.y;
            minimized.width = this._minimizedRect.width;
            minimized.height = this._minimizedRect.height;
        }

        if(maximized !== null && this._maximizedRect !== null) 
        {
            maximized.x = this._maximizedRect.x;
            maximized.y = this._maximizedRect.y;
            maximized.width = this._maximizedRect.width;
            maximized.height = this._maximizedRect.height;
        }
    }

    /**
     * Sets region property rectangles.
     *
     * @param current - New current rectangle (applied via setRectangle)
     * @param minimized - New minimized rectangle
     * @param maximized - New maximized rectangle
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::setRegionProperties()
    public setRegionProperties(
        current: { x: number; y: number; width: number; height: number } | null = null,
        minimized: { x: number; y: number; width: number; height: number } | null = null,
        maximized: { x: number; y: number; width: number; height: number } | null = null
    ): void 
    {
        if(maximized !== null) 
        {
            if(maximized.width < 0 || maximized.height < 0) 
            {
                throw new Error('Invalid rectangle; maximized size cannot be less than zero!');
            }

            if(!this._maximizedRect) 
            {
                this._maximizedRect = {x: 0, y: 0, width: 0, height: 0};
            }

            this._maximizedRect.x = maximized.x;
            this._maximizedRect.y = maximized.y;
            this._maximizedRect.width = maximized.width;
            this._maximizedRect.height = maximized.height;
        }

        if(minimized !== null) 
        {
            if(minimized.width < 0 || minimized.height < 0) 
            {
                throw new Error('Invalid rectangle; minimized size cannot be less than zero!');
            }

            if(!this._minimizedRect) 
            {
                this._minimizedRect = {x: 0, y: 0, width: 0, height: 0};
            }

            this._minimizedRect.x = minimized.x;
            this._minimizedRect.y = minimized.y;
            this._minimizedRect.width = minimized.width;
            this._minimizedRect.height = minimized.height;
        }

        if(current !== null) 
        {
            this.setRectangle(current.x, current.y, current.width, current.height);
        }
    }

    /**
     * Creates a deep clone of this window and its children.
     *
     * @returns A new WindowController with the same properties
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::clone()
    public clone(): IWindow 
    {
        const cloned = new (this.constructor as typeof WindowController)(
            this._name,
            this._type,
            this._style,
            this._param,
            this._context,
            {x: this._x, y: this._y, width: this._width, height: this._height},
            null,
            this._procedure,
            this._tags ? this._tags.concat() : null,
            null,
            this._id,
            this._dynamicStyleName
        );

        // Route through the same factory phases as regular construction
        // (theme/layout/defaults) instead of relying on the constructor,
        // which now only stores base fields. Properties must be threaded
        // into completeConstruction() itself (applyProperties() runs
        // before finalize()) rather than assigned afterward — AS3's
        // clone() passes `properties` straight into `new _loc2_(...)`,
        // so subclasses like ItemListController see the real
        // resize_on_item_update/spacing/etc. values before finalize()
        // creates `_container` and arms its reflect-to-parent param
        // flags. Applying properties post-hoc (after `_container`
        // already exists) let an early spacing-triggered resize run
        // with the reflect flag still unarmed, silently desyncing the
        // parent's width from `_container`'s — parent is always null
        // for a clone, attached later by the caller.
        const properties = this.properties;

        cloned.completeConstruction(properties.length > 0 ? properties : null, this._procedure, null);

        cloned.dynamicStyle = this._dynamicStyleName;
        cloned._mouseThreshold = this._mouseThreshold;
        cloned._ignoreMouseEvents = this._ignoreMouseEvents;
        cloned._hasVisualContent = this._hasVisualContent;
        cloned._debug = this._debug;
        cloned._parentRect = {...this._parentRect};
        cloned._x = this._x;
        cloned._y = this._y;
        cloned._width = this._width;
        cloned._height = this._height;
        cloned._initialRect = {...this._initialRect};
        cloned._previousRect = {...this._previousRect};
        cloned._minimizedRect = this._minimizedRect ? {...this._minimizedRect} : null;
        cloned._maximizedRect = this._maximizedRect ? {...this._maximizedRect} : null;
        cloned._rectLimits = this._rectLimits ? this._rectLimits.clone(cloned) as WindowRectLimits : null;
        cloned._context = this._context;
        cloned._fillColor = this._fillColor;
        cloned._alphaColor = this._alphaColor;
        cloned.clipping = this._clipping;
        cloned._visible = this._visible;
        cloned._blend = this._blend;
        cloned._param = this._param;
        cloned._state = this._state;
        cloned._name = this._name;
        cloned._id = this._id;
        cloned.caption = this._caption;
        cloned.background = this._background;

        this.cloneChildWindows(cloned);

        return cloned;
    }

    public override toString(): string 
    {
        return `[Window ${this.constructor.name} ${this._name} ${this._uniqueId}]`;
    }

    /**
     * Disposes this window and all its children, releasing all resources.
     */
    public override dispose(): void 
    {
        if(!this._disposed) 
        {
            this.immediateClickMode = false;
            this._procedure = null;

            // Deactivate if not a child window and context is still alive
            if(!this._context.disposed) 
            {
                if(!this.isChildWindow()) 
                {
                    if(this.getStateFlag(1)) 
                    {
                        this.deactivate();
                    }
                }
            }

            // Dispose all children
            if(this._children) 
            {
                while(this._children.length > 0) 
                {
                    const child = this._children.pop();

                    if(child) 
                    {
                        child.dispose();
                    }
                }
            }

            this._children = null;

            // Remove from parent
            if(this.parent) 
            {
                this.parent = null;
            }

            // Dispatch dispose event and clean up dispatcher
            if(this._eventDispatcher) 
            {
                const disposeEvent = WindowDisposeEvent.allocateDispose(this);
                this._eventDispatcher.dispatchEvent(disposeEvent);
                disposeEvent.recycle();
                this._eventDispatcher.dispose();
                this._eventDispatcher = null;
            }

            // Clean up graphic context
            if(this._graphicContext !== null) 
            {
                this._graphicContext.dispose();
                this._graphicContext = null;
            }

            super.dispose();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/WindowController.as::WindowController() (theme lookup, line 92)
    protected resolveTheme(): void 
    {
        try 
        {
            this._propertyMap = this._context.getWindowFactory()?.getThemeManager()?.getPropertyDefaults(this._style) ?? null;
        }
        catch (_) 
        {
            // Theme not available during bootstrap
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/WindowController.as::WindowController() (lines 99-116)
    protected buildLayoutChildren(): void 
    {
        const effectiveRect: WindowRectangle = {x: this._x, y: this._y, width: this._width, height: this._height};

        try 
        {
            const factory = this._context.getWindowFactory();

            if(factory) 
            {
                const layout = factory.getLayoutByTypeAndStyle(this._type, this._style);

                if(layout) 
                {
                    const parser = this._context.getWindowParser();

                    if(parser) 
                    {
                        // Set to layout's natural size before creating children
                        // (AS3 lines 95-100)
                        const dimensions = WindowController.resolveLayoutDimensions(layout);
                        const layoutWidth = dimensions.width;
                        const layoutHeight = dimensions.height;

                        this._initialRect.x = 0;
                        this._initialRect.y = 0;
                        this._initialRect.width = layoutWidth;
                        this._initialRect.height = layoutHeight;
                        this._previousRect.x = 0;
                        this._previousRect.y = 0;
                        this._previousRect.width = layoutWidth;
                        this._previousRect.height = layoutHeight;
                        this._x = 0;
                        this._y = 0;
                        this._width = layoutWidth;
                        this._height = layoutHeight;

                        parser.parseAndConstruct(layout as string | Document | Element, this, null);

                        // Resize to requested size (AS3 lines 102-105)
                        const savedParam = this._param;
                        this._param &= ~0xC00000;
                        this.setRectangle(effectiveRect.x, effectiveRect.y, effectiveRect.width, effectiveRect.height);
                        this._param = savedParam;

                        // Restore _previousRect (AS3 lines 106-109)
                        this._previousRect.x = effectiveRect.x;
                        this._previousRect.y = effectiveRect.y;
                        this._previousRect.width = effectiveRect.width;
                        this._previousRect.height = effectiveRect.height;
                    }
                }
            }
        }
        catch (err) 
        {
            log.warn(`Layout construction failed for type="${this._type}" style="${this._style}":`, err);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/WindowController.as::WindowController() (lines 117-134)
    protected applyDefaultAttributes(): void 
    {
        try 
        {
            const factory = this._context.getWindowFactory();

            if(factory) 
            {
                const defaults = factory.getDefaultsByTypeAndStyle(this._type, this._style);

                if(defaults) 
                {
                    this._blend = defaults.blend;
                    this._mouseThreshold = defaults.threshold;

                    if(this._background !== defaults.background) 
                    {
                        this.background = defaults.background;
                    }

                    if(this._fillColor !== defaults.color) 
                    {
                        this.color = defaults.color;
                    }

                    if(defaults.hasRectLimits()) 
                    {
                        (this.limits as WindowRectLimits).assign(
                            defaults.width_min,
                            defaults.width_max,
                            defaults.height_min,
                            defaults.height_max
                        );
                    }
                }
            }
        }
        catch (_) 
        {
            // Factory not available during bootstrap
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/WindowController.as::WindowController() (lines 135-138)
    protected applyProperties(properties: unknown[] | null): void 
    {
        if(properties) 
        {
            this.properties = properties;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/WindowController.as::WindowController() (line 139)
    protected setProcedure(procedure: ((event: WindowEvent, window: IWindow) => void) | null): void 
    {
        this._procedure = procedure;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/WindowController.as::WindowController() (lines 140-149, plus graphic context ensure at lines 94-97)
    protected attachToParent(parent: IWindow | null): void 
    {
        if(!this._graphicContext) 
        {
            this._graphicContext = this.getGraphicContext(!this.testParamFlag(16));
        }

        if(parent !== null) 
        {
            this._parent = parent as WindowController;
            (parent as WindowController).addChild(this);

            if(this._graphicContext) 
            {
                this._context.invalidate(this, null, 1);
            }
        }
    }

    /**
     * Post-construction hook for subclass-specific setup that must run after
     * `applyProperties()` (matching AS3's own-class field initializers,
     * which run after the base constructor returns). No-op by default.
     */
    protected finalize(): void 
    {
        // No-op by default
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::testLocalPointHitAgainstAlpha()
    protected testLocalPointHitAgainstAlpha(point: {
        x: number;
        y: number
    }, drawBuffer: unknown, threshold: number): boolean 
    {
        if(this._width < 1 || this._height < 1) 
        {
            return false;
        }

        if(this._hasVisualContent && this._mouseThreshold > 0) 
        {
            if(!this.testParamFlag(16)) 
            {
                if(point.x <= this._width && point.y <= this._height) 
                {
                    const gcBuffer = this.getGraphicContext(true)?.fetchDrawBuffer();
                    const hit = this.hitTestDrawBuffer(gcBuffer, threshold, point);

                    if(hit !== null) 
                    {
                        return hit;
                    }
                }
            }
            else 
            {
                const hit = this.hitTestDrawBuffer(drawBuffer, threshold, point);

                if(hit !== null) 
                {
                    return hit;
                }

                return false;
            }
        }

        return this.isInWindowBounds(point);
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::requiresOwnGraphicContext()
    protected requiresOwnGraphicContext(): boolean 
    {
        if(this.testParamFlag(16)) 
        {
            if(this._children) 
            {
                for(const child of this._children) 
                {
                    if((child as WindowController).requiresOwnGraphicContext()) 
                    {
                        return true;
                    }
                }
            }

            return false;
        }

        return true;
    }

    // AS3: .../src/com/sulake/core/window/WindowController.as::immediateClickHandler()
    protected immediateClickHandler(event: unknown): void 
    {
        const nativeMouseEvent = event as {
            stageX?: number;
            stageY?: number;
            altKey?: boolean;
            ctrlKey?: boolean;
            shiftKey?: boolean;
            buttonDown?: boolean;
            delta?: number;
            stopImmediatePropagation?: () => void;
        };

        const stageX = nativeMouseEvent.stageX ?? 0;
        const stageY = nativeMouseEvent.stageY ?? 0;
        const point: { x: number; y: number } = {x: stageX, y: stageY};
        const windowsUnderPoint: IWindow[] = [];
        const desktop = this.desktop as WindowController | null;

        desktop?.groupChildrenUnderPoint(point, windowsUnderPoint);

        while(windowsUnderPoint.length > 0) 
        {
            const current = windowsUnderPoint.pop()!;

            if(current === this) 
            {
                break;
            }

            if(current.getParamFlag(1)) 
            {
                return;
            }
        }

        this.getRelativeMousePosition(point);

        const windowEvent = WindowMouseEvent.allocateMouse(
            WindowMouseEvent.CLICK,
            this,
            null,
            point.x,
            point.y,
            stageX,
            stageY,
            nativeMouseEvent.altKey ?? false,
            nativeMouseEvent.ctrlKey ?? false,
            nativeMouseEvent.shiftKey ?? false,
            nativeMouseEvent.buttonDown ?? false,
            nativeMouseEvent.delta ?? 0
        );

        if(this._eventDispatcher) 
        {
            this._eventDispatcher.dispatchEvent(windowEvent);
        }

        if(!windowEvent.isWindowOperationPrevented()) 
        {
            const proc = this.procedure;

            if(proc !== null) 
            {
                proc(windowEvent, this);
            }
        }

        nativeMouseEvent.stopImmediatePropagation?.();
        windowEvent.recycle();
    }

    /**
     * Clones child windows into the target controller.
     *
     * @param target - The controller to clone children into
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::cloneChildWindows()
    protected cloneChildWindows(target: WindowController): void 
    {
        if(this._children) 
        {
            for(const child of this._children) 
            {
                if(child.tags.indexOf(WindowController.TAG_EXCLUDE) === -1) 
                {
                    target.addChild(child.clone());
                }
            }
        }
    }

    /**
     * Updates the position/size relative to the parent based on param flags.
     * Handles horizontal and vertical anchoring, centering, and stretching.
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::updateScaleRelativeToParent()
    protected updateScaleRelativeToParent(): void 
    {
        if(this._parent === null) return;

        const hasHorizontal: boolean = !this.testParamFlag(0, 192);
        const hasVertical: boolean = !this.testParamFlag(0, 0x0C00);

        let newX: number = this._x;
        let newY: number = this._y;
        let newWidth: number = this._width;
        let newHeight: number = this._height;

        if(hasHorizontal || hasVertical) 
        {
            if(hasHorizontal) 
            {
                const deltaX: number = this._parent.width - this._parentRect.width;
                const hMode: number = this._param & 0xC0;

                if(hMode === 128) 
                {
                    // Stretch width
                    newWidth = newWidth + deltaX;
                }
                else if(hMode === 64) 
                {
                    // Move right
                    newX = newX + deltaX;
                }
                else if(hMode === 192) 
                {
                    // Center
                    if(this._parent.width < newWidth && this.getParamFlag(16)) 
                    {
                        newX = 0;
                    }
                    else 
                    {
                        newX = Math.floor(this._parent.width / 2) - Math.floor(newWidth / 2);
                    }
                }
            }

            if(hasVertical) 
            {
                const deltaY: number = this._parent.height - this._parentRect.height;
                const vMode: number = this._param & 0x0C00;

                if(vMode === 0x0800) 
                {
                    // Stretch height
                    newHeight = newHeight + deltaY;
                }
                else if(vMode === 0x0400) 
                {
                    // Move down
                    newY = newY + deltaY;
                }
                else if(vMode === 0x0C00) 
                {
                    // Center
                    if(this._parent.height < newHeight && this.getParamFlag(16)) 
                    {
                        newY = 0;
                    }
                    else 
                    {
                        newY = Math.floor(this._parent.height / 2) - Math.floor(newHeight / 2);
                    }
                }
            }

            // Temporarily remove scaling params to avoid recursion
            const savedParam: number = this._param;
            this._param = this._param & 0xFF3FF33F;
            this.setRectangle(newX, newY, newWidth, newHeight);
            this._param = savedParam;

            // Port-specific, no AS3 counterpart: consume the delta by re-baselining against the
            // parent's *current* rect.
            //
            // The MOVE (0x40/0x400) and STRETCH (0x80/0x800) modes above are incremental - they add
            // `parent.size - _parentRect.size` - while the CENTER modes are absolute and therefore
            // idempotent. `_parentRect` is only refreshed from WE_PARENT_RESIZED, so any *other*
            // caller replays the same delta; `update()` is one, since a window whose horizontal or
            // vertical mode is CENTER calls this on its own WE_RESIZED (AS3 does that too), and
            // there it applies the incremental mode on the other axis as well.
            //
            // Re-baselining leaves the first, legitimate application intact and makes every repeat
            // a no-op; a genuine parent resize still re-primes `_parentRect` with the parent's
            // previous rect just before this runs, so real deltas are unaffected.
            //
            // This is a guard against replay, not against a bad baseline - a window whose
            // `_parentRect` is still 0x0 consumes the parent's whole size on its first application
            // and this cannot tell that apart. `WindowParser` is what keeps the baseline honest, by
            // appending a container's layout child after construction so `set parent` actually runs
            // (see its `parentIsContainer` note): that is what put the alert dialog's button list
            // back inside its frame.
            this._parentRect.x = this._parent.x;
            this._parentRect.y = this._parent.y;
            this._parentRect.width = this._parent.width;
            this._parentRect.height = this._parent.height;
        }
        else 
        {
            // Clamp to parent only (param flag 32)
            if(this.testParamFlag(32)) 
            {
                if(this._parent !== null) 
                {
                    newX = newX < 0 ? 0 : newX;
                    newY = newY < 0 ? 0 : newY;
                    newX = newX - ((newX + newWidth > this._parent.width) ? (newX + newWidth - this._parent.width) : 0);
                    newY = newY - ((newY + newHeight > this._parent.height) ? (newY + newHeight - this._parent.height) : 0);
                    newWidth = newWidth - ((newX + newWidth > this._parent.width) ? (newX + newWidth - this._parent.width) : 0);
                    newHeight = newHeight - ((newY + newHeight > this._parent.height) ? (newY + newHeight - this._parent.height) : 0);

                    if(newX !== this._x || newY !== this._y || newWidth !== this._width || newHeight !== this._height) 
                    {
                        const savedParam2: number = this._param;
                        this._param = this._param & 0xFF3FF33F;
                        this.setRectangle(newX, newY, newWidth, newHeight);
                        this._param = savedParam2;
                    }
                }
            }
        }
    }

    /**
     * Scales this window to accommodate all of its children.
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::scaleToAccommodateChildren()
    protected scaleToAccommodateChildren(): void 
    {
        if(!this._children) return;

        let minX: number = 0;
        let minY: number = 0;
        let maxRight: number = 0;
        let maxBottom: number = 0;
        let changed: boolean = false;
        const savedChildParams: number[] = [];

        const savedParam: number = this._param & (0x020000 | 0x024000);

        for(const child of this._children) 
        {
            if(child.visible && child.x < minX) 
            {
                maxRight = maxRight - (child.x - minX);
                minX = child.x;
                changed = true;
            }

            if(child.visible && child.x + child.width > maxRight) 
            {
                maxRight = child.x + child.width;
                changed = true;
            }

            if(child.visible && child.y < minY) 
            {
                maxBottom = maxBottom - (child.y - minY);
                minY = child.y;
                changed = true;
            }

            if(child.visible && child.y + child.height > maxBottom) 
            {
                maxBottom = child.y + child.height;
                changed = true;
            }
        }

        if(changed) 
        {
            // Save and clear child scaling params
            for(const child of this._children) 
            {
                const childParam = child.param & (0xC0 | 0x0C00);
                child.setParamFlag(childParam, false);
                savedChildParams.push(childParam);
            }

            if(savedParam) 
            {
                this.setParamFlag(savedParam, false);
            }

            this.setRectangle(this._x + minX, this._y + minY, maxRight, maxBottom);

            // Restore child params
            let i = 0;

            for(const child of this._children) 
            {
                child.offset(-minX, -minY);
                child.setParamFlag(savedChildParams[i++], true);
            }

            if(savedParam) 
            {
                this.setParamFlag(savedParam, true);
            }
        }
    }

    /**
     * Returns whether this is a child window (not directly under desktop).
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::isChildWindow()
    protected isChildWindow(): boolean 
    {
        return this._parent !== this._context.getDesktopWindow();
    }

    /**
     * Dispatches an event through the procedure and event listeners (no built-in handling).
     *
     * @param event - The event to dispatch
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::notifyEventListeners()
    protected notifyEventListeners(event: WindowEvent): void 
    {
        const proc = this.procedure;

        if(proc) 
        {
            proc(event, this);
        }

        if(!event.isWindowOperationPrevented()) 
        {
            if(this.hasEventListener(event.type)) 
            {
                this._eventDispatcher!.dispatchEvent(event);
            }
        }
    }

    private readonly _immediateClickHandlerBound: (event: unknown) => void = (event: unknown): void => 
    {
        this.immediateClickHandler(event);
    };

    private hitTestDrawBuffer(buffer: unknown, threshold: number, point: { x: number; y: number }): boolean | null 
    {
        if(!buffer)
        {
            return null;
        }

        // AS3 calls `param2.hitTest(_POINT_ZERO, param3, param1)` on a BitmapData.
        // The draw buffer is an OffscreenCanvas here and carries no such method,
        // so the per-pixel test lives in BitmapHitTest — with the origin at
        // POINT_ZERO, the sampled pixel is the local point itself.
        if(isDrawBuffer(buffer))
        {
            return hitTestAlpha(
                buffer,
                point.x - WindowController.POINT_ZERO.x,
                point.y - WindowController.POINT_ZERO.y,
                threshold
            );
        }

        return null;
    }

    /**
     * Resolves and applies the dynamic style for the current state.
     *
     * Determines the active state priority: disabled > pressed > hover > default,
     * then applies visual properties (offsets, color transforms, etching) to
     * this window and recursively to all children with tagged child styles.
     *
     * @see sources/win63_version/core/window/WindowController.as line 1260
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::renderDynamicStyle()
    private renderDynamicStyle(): void 
    {
        if(this._dynamicStyleName === '') 
        {
            return;
        }

        if(!this._dynamicStyleInstance || this._dynamicStyleInstance.name !== this._dynamicStyleName) 
        {
            this._dynamicStyleInstance = DynamicStyleManager.getStyle(this._dynamicStyleName);
        }

        let activeState: number;

        if(this.getStateFlag(32)) 
        {
            activeState = 32;
        }
        else if(this.getStateFlag(16)) 
        {
            activeState = 16;
        }
        else if(this.getStateFlag(4)) 
        {
            activeState = 4;
        }
        else 
        {
            activeState = 0;
        }

        this.applyDynamicStyleByState(this, this._dynamicStyleInstance, activeState);

        if(this._children) 
        {
            this.recursivelyUpdateChildrensDynamicStyles(this._children, activeState);
        }
    }

    /**
     * Applies the visual properties of a dynamic style for a given state to a window.
     *
     * Sets offset, color transform, and etching properties based on the
     * style definition for the given state (default, hover, pressed, disabled).
     *
     * @param target - The window to apply the style to
     * @param style - The dynamic style instance
     * @param state - The state flag (0=default, 4=hover, 16=pressed, 32=disabled)
     * @see sources/win63_version/core/window/WindowController.as line 1294
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::applyDynamicStyleByState()
    private applyDynamicStyleByState(target: WindowController, style: DynamicStyle, state: number): void 
    {
        const props = style.getStyleByWindowState(state);

        target._offsetX = (props.offsetX as number) ?? 0;
        target._offsetY = (props.offsetY as number) ?? 0;

        if(target.hasGraphicsContext()) 
        {
            // With graphic context: apply color transform to display object
            target._dynamicStyleColorTransform = style.getColorTransform(state);
        }
        else 
        {
            // Without graphic context: store color transform for renderer
            target._dynamicStyleColorTransform = style.getColorTransform(state);
            target.invalidate();
        }

        const etchingPoint = props.etchingPoint as number[] | null;

        if(etchingPoint) 
        {
            target.etching = [(props.etchingColor as number) ?? 0, etchingPoint[0], etchingPoint[1]];
            target.invalidate();
        }
        else 
        {
            target.etching = [0, 0, 1];
            target.invalidate();
        }
    }

    /**
     * Recursively updates dynamic styles on child windows.
     *
     * For each child, checks if the parent's dynamic style has a child-specific
     * style (keyed by tag like "#icon", "#bg"). If so, applies that child style.
     * Recurses into grandchildren.
     *
     * @param children - The children to process
     * @param state - The parent's active state
     * @see sources/win63_version/core/window/WindowController.as line 1322
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::recursivelyUpdateChildrensDynamicStyles()
    private recursivelyUpdateChildrensDynamicStyles(children: IWindow[], state: number): void 
    {
        for(const child of children) 
        {
            const childStyle = this._dynamicStyleInstance!.getChildStyle(child as WindowController);

            if(childStyle) 
            {
                this.applyDynamicStyleByState(child as WindowController, childStyle, state);
            }

            if((child as WindowController)._children) 
            {
                this.recursivelyUpdateChildrensDynamicStyles((child as WindowController)._children!, state);
            }
        }
    }

    /**
     * Notifies all children with an event.
     *
     * @param event - The event to dispatch to children
     */
    // AS3: .../src/com/sulake/core/window/WindowController.as::notifyChildren()
    private notifyChildren(event: WindowEvent): void 
    {
        if(this._children) 
        {
            for(const child of this._children) 
            {
                (child as WindowController).update(this, event);
            }
        }
    }
}
