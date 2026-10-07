import type {IWindowContext} from './IWindowContext';

/**
 * Base data model for all windows.
 *
 * Stores position, size, visual properties, type, style, state, and param.
 * WindowController extends this with behavior.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/WindowModel.as
 */
export class WindowModel
{
    // AS3: .../src/com/sulake/core/window/WindowModel.as::_offsetX
    protected _offsetX: number = 0;
    // AS3: .../src/com/sulake/core/window/WindowModel.as::_offsetY
    protected _offsetY: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/WindowModel.as::_initialRect
    protected _initialRect: { x: number; y: number; width: number; height: number };
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/WindowModel.as::_previousRect
    protected _previousRect: { x: number; y: number; width: number; height: number };
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/WindowModel.as::_minimizedRect
    protected _minimizedRect: { x: number; y: number; width: number; height: number } | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/WindowModel.as::_maximizedRect
    protected _maximizedRect: { x: number; y: number; width: number; height: number } | null = null;
    // AS3: .../src/com/sulake/core/window/WindowModel.as::_fillColor
    protected _fillColor: number = 0xFFFFFF;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/WindowModel.as::_dynamicStyleColorTransform
    protected _dynamicStyleColorTransform: {
        redMultiplier: number;
        greenMultiplier: number;
        blueMultiplier: number;
        alphaMultiplier: number;
        redOffset: number;
        greenOffset: number;
        blueOffset: number;
        alphaOffset: number;
    } | null = null;

    // AS3: .../src/com/sulake/core/window/WindowModel.as::_alphaColor
    protected _alphaColor: number = 0;
    protected _dynamicStyleName: string = '';

    constructor(
        id: number,
        name: string,
        type: number,
        style: number,
        param: number,
        context: IWindowContext,
        rect: { x: number; y: number; width: number; height: number },
        tags: string[] | null = null,
        dynamicStyle: string = ''
    )
    {
        this._id = id;
        this._name = name;
        this._type = type;
        this._param = param;
        this._state = 0;
        this._style = style;
        this._tags = tags;
        this._context = context;
        this._dynamicStyleName = dynamicStyle;
        this._x = rect.x;
        this._y = rect.y;
        this._width = rect.width;
        this._height = rect.height;
        this._initialRect = {x: rect.x, y: rect.y, width: rect.width, height: rect.height};
        this._previousRect = {x: rect.x, y: rect.y, width: rect.width, height: rect.height};
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/WindowModel.as::_x
    protected _x: number;

    // AS3: .../src/com/sulake/core/window/WindowModel.as::get x()
    public get x(): number
    {
        return this._x;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/WindowModel.as::_y
    protected _y: number;

    // AS3: .../src/com/sulake/core/window/WindowModel.as::get y()
    public get y(): number
    {
        return this._y;
    }

    protected _width: number;

    // AS3: .../src/com/sulake/core/window/WindowModel.as::get width()
    public get width(): number
    {
        return this._width;
    }

    protected _height: number;

    // AS3: .../src/com/sulake/core/window/WindowModel.as::get height()
    public get height(): number
    {
        return this._height;
    }

    // AS3: .../src/com/sulake/core/window/WindowModel.as::_context
    protected _context: IWindowContext;

    // AS3: .../src/com/sulake/core/window/WindowModel.as::get context()
    public get context(): IWindowContext
    {
        return this._context;
    }

    // AS3: .../src/com/sulake/core/window/WindowModel.as::_background
    protected _background: boolean = false;

    // AS3: .../src/com/sulake/core/window/WindowModel.as::get background()
    public get background(): boolean
    {
        return this._background;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/WindowModel.as::_mouseThreshold
    protected _mouseThreshold: number = 10;

    // AS3: .../src/com/sulake/core/window/WindowModel.as::_ignoreMouseEvents
    protected _ignoreMouseEvents: boolean = false;

    // AS3: .../src/com/sulake/core/window/WindowModel.as::get mouseThreshold()
    public get mouseThreshold(): number
    {
        return this._mouseThreshold;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/WindowModel.as::_clipping
    protected _clipping: boolean = true;

    // AS3: .../src/com/sulake/core/window/WindowModel.as::get clipping()
    public get clipping(): boolean
    {
        return this._clipping;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/WindowModel.as::_visible
    protected _visible: boolean = true;

    // AS3: .../src/com/sulake/core/window/WindowModel.as::get visible()
    public get visible(): boolean
    {
        return this._visible;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/WindowModel.as::_blend
    protected _blend: number = 1;

    // AS3: .../src/com/sulake/core/window/WindowModel.as::get blend()
    public get blend(): number
    {
        return this._blend;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/WindowModel.as::_param
    protected _param: number;

    // AS3: .../src/com/sulake/core/window/WindowModel.as::get param()
    public get param(): number
    {
        return this._param;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/WindowModel.as::_state
    protected _state: number;

    // AS3: .../src/com/sulake/core/window/WindowModel.as::get state()
    public get state(): number
    {
        return this._state;
    }

    // AS3: .../src/com/sulake/core/window/WindowModel.as::_style
    protected _style: number;

    // AS3: .../src/com/sulake/core/window/WindowModel.as::get style()
    public get style(): number
    {
        return this._style;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/WindowModel.as::_type
    protected _type: number;

    // AS3: .../src/com/sulake/core/window/WindowModel.as::get type()
    public get type(): number
    {
        return this._type;
    }

    // AS3: .../src/com/sulake/core/window/WindowModel.as::_caption
    protected _caption: string = '';

    // AS3: .../src/com/sulake/core/window/WindowModel.as::get caption()
    public get caption(): string
    {
        return this._caption;
    }

    // AS3: .../src/com/sulake/core/window/WindowModel.as::_name
    protected _name: string;

    // AS3: .../src/com/sulake/core/window/WindowModel.as::get name()
    public get name(): string
    {
        return this._name;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/WindowModel.as::_id
    protected _id: number;

    // AS3: .../src/com/sulake/core/window/WindowModel.as::get id()
    public get id(): number
    {
        return this._id;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/WindowModel.as::_tags
    protected _tags: string[] | null;

    // AS3: .../src/com/sulake/core/window/WindowModel.as::get tags()
    public get tags(): string[]
    {
        if(!this._tags) this._tags = [];

        return this._tags;
    }

    // AS3: .../src/com/sulake/core/window/WindowModel.as::_disposed
    protected _disposed: boolean = false;

    // AS3: .../src/com/sulake/core/window/WindowModel.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: .../src/com/sulake/core/window/WindowModel.as::get position()
    public get position(): { x: number; y: number }
    {
        return {x: this._x, y: this._y};
    }

    // AS3: .../src/com/sulake/core/window/WindowModel.as::get rectangle()
    public get rectangle(): { x: number; y: number; width: number; height: number }
    {
        return {x: this._x, y: this._y, width: this._width, height: this._height};
    }

    // AS3: .../src/com/sulake/core/window/WindowModel.as::get color()
    public get color(): number
    {
        return this._fillColor;
    }

    // AS3: .../src/com/sulake/core/window/WindowModel.as::get alpha()
    public get alpha(): number
    {
        return this._alphaColor >>> 24;
    }

    // AS3: .../src/com/sulake/core/window/WindowModel.as::get left()
    public get left(): number
    {
        return this._x;
    }

    // AS3: .../src/com/sulake/core/window/WindowModel.as::get top()
    public get top(): number
    {
        return this._y;
    }

    // AS3: .../src/com/sulake/core/window/WindowModel.as::get right()
    public get right(): number
    {
        return this._x + this._width;
    }

    // AS3: .../src/com/sulake/core/window/WindowModel.as::get bottom()
    public get bottom(): number
    {
        return this._y + this._height;
    }

    // AS3: .../src/com/sulake/core/window/WindowModel.as::get renderingX()
    public get renderingX(): number
    {
        return this._offsetX + this._x;
    }

    // AS3: .../src/com/sulake/core/window/WindowModel.as::get renderingY()
    public get renderingY(): number
    {
        return this._offsetY + this._y;
    }

    // AS3: .../src/com/sulake/core/window/WindowModel.as::get renderingWidth()
    public get renderingWidth(): number
    {
        return this._width + Math.abs(this.etchingPoint.x);
    }

    // AS3: .../src/com/sulake/core/window/WindowModel.as::get renderingHeight()
    public get renderingHeight(): number
    {
        return this._height + Math.abs(this.etchingPoint.y);
    }

    // AS3: .../src/com/sulake/core/window/WindowModel.as::get renderingRectangle()
    public get renderingRectangle(): { x: number; y: number; width: number; height: number }
    {
        return {
            x: this.renderingX,
            y: this.renderingY,
            width: this.renderingWidth,
            height: this.renderingHeight
        };
    }

    // AS3: .../src/com/sulake/core/window/WindowModel.as::get etchingPoint()
    public get etchingPoint(): { x: number; y: number }
    {
        return {x: 0, y: 0};
    }

    // AS3: .../src/com/sulake/core/window/WindowModel.as::get dynamicStyle()
    public get dynamicStyle(): string
    {
        return this._dynamicStyleName;
    }

    // AS3: .../src/com/sulake/core/window/WindowModel.as::dispose()
    public dispose(): void
    {
        if(!this._disposed)
        {
            this._disposed = true;
            this._context = null!;
            this._state = 0x40000000;
            this._tags = null;
            this._x = 0;
            this._y = 0;
            this._width = 0;
            this._height = 0;
        }
    }

    // AS3: .../src/com/sulake/core/window/WindowModel.as::invalidate()
    public invalidate(_rect: { x: number; y: number; width: number; height: number } | null = null): void
    {
        // Override in subclass
    }

    // AS3: .../src/com/sulake/core/window/WindowModel.as::getInitialWidth()
    public getInitialWidth(): number
    {
        return this._initialRect.width;
    }

    // AS3: .../src/com/sulake/core/window/WindowModel.as::getInitialHeight()
    public getInitialHeight(): number
    {
        return this._initialRect.height;
    }

    // AS3: .../src/com/sulake/core/window/WindowModel.as::getPreviousWidth()
    public getPreviousWidth(): number
    {
        return this._previousRect.width;
    }

    // AS3: .../src/com/sulake/core/window/WindowModel.as::getPreviousHeight()
    public getPreviousHeight(): number
    {
        return this._previousRect.height;
    }

    // AS3: .../src/com/sulake/core/window/WindowModel.as::getMinimizedWidth()
    public getMinimizedWidth(): number
    {
        return this._minimizedRect ? this._minimizedRect.width : 0;
    }

    // AS3: .../src/com/sulake/core/window/WindowModel.as::getMinimizedHeight()
    public getMinimizedHeight(): number
    {
        return this._minimizedRect ? this._minimizedRect.height : 0;
    }

    // AS3: .../src/com/sulake/core/window/WindowModel.as::getMaximizedWidth()
    public getMaximizedWidth(): number
    {
        return this._maximizedRect ? this._maximizedRect.width : 2147483647;
    }

    // AS3: .../src/com/sulake/core/window/WindowModel.as::getMaximizedHeight()
    public getMaximizedHeight(): number
    {
        return this._maximizedRect ? this._maximizedRect.height : 2147483647;
    }

    // AS3: .../src/com/sulake/core/window/WindowModel.as::testTypeFlag()
    public testTypeFlag(flag: number, mask: number = 0): boolean
    {
        if(mask > 0)
        {
            return ((this._type & mask) ^ flag) === 0;
        }

        return (this._type & flag) === flag;
    }

    // AS3: .../src/com/sulake/core/window/WindowModel.as::testStateFlag()
    public testStateFlag(flag: number, mask: number = 0): boolean
    {
        if(mask > 0)
        {
            return ((this._state & mask) ^ flag) === 0;
        }

        return (this._state & flag) === flag;
    }

    // AS3: .../src/com/sulake/core/window/WindowModel.as::testStyleFlag()
    public testStyleFlag(flag: number, mask: number = 0): boolean
    {
        if(mask > 0)
        {
            return ((this._style & mask) ^ flag) === 0;
        }

        return (this._style & flag) === flag;
    }

    // AS3: .../src/com/sulake/core/window/WindowModel.as::testParamFlag()
    public testParamFlag(flag: number, mask: number = 0): boolean
    {
        if(mask > 0)
        {
            return ((this._param & mask) ^ flag) === 0;
        }

        return (this._param & flag) === flag;
    }
}
