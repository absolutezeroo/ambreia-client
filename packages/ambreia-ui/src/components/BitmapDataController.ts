import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import {WindowController} from '../WindowController';
import type {WindowEvent} from '../events/WindowEvent';
import type {PropertyStruct} from '../utils/PropertyStruct';
import {PIVOT_NAMES, pivotFromName} from '../enum/PivotPoint';

/**
 * Controller for bitmap data windows.
 *
 * Base class for bitmap-based window types. Manages a single ImageBitmap
 * with pivot, stretch, zoom, wrap, greyscale, rotation, and etching properties.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BitmapDataController.as
 */
export class BitmapDataController extends WindowController 
{
    private _pivot: number = 0;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BitmapDataController.as::_etchingPoint
    // Split into two primitives rather than kept as one Point object; the field's AS3 default
    // `new Point(0, -1)` is why _etchingPointX defaults to 0 here and _etchingPointY (below)
    // is primed to -1 in finalize().
    private _etchingPointX: number = 0;
    // Declared without a non-default initializer: WindowController's
    // applyProperties() phase dispatches to our `set etching()`/
    // `set properties()` overrides before finalize() runs, so a non-default
    // initializer here would clobber a value already applied from
    // `properties`. Default primed with `??=` in finalize() instead (see
    // StrokeController for the same pattern).
    private _etchingPointY: number | null = null;

    constructor(
        name: string,
        type: number,
        style: number,
        param: number,
        context: IWindowContext,
        rect: { x: number; y: number; width: number; height: number },
        parent: IWindow | null = null,
        procedure: ((event: WindowEvent, window: IWindow) => void) | null = null,
        tags: string[] | null = null,
        properties: unknown[] | null = null,
        id: number = 0,
        dynamicStyle: string = ''
    ) 
    {
        super(name, type, style, param, context, rect, parent, procedure, tags, properties, id, dynamicStyle);
    }

    // AS3: .../src/com/sulake/core/window/components/BitmapDataController.as::_bitmapData
    protected _bitmapData: ImageBitmap | null = null;

    /**
     * The bitmap data for this window.
     */
    // AS3: .../src/com/sulake/core/window/components/BitmapDataController.as::get bitmapData()
    public get bitmapData(): ImageBitmap | null 
    {
        return this._bitmapData;
    }

    public set bitmapData(value: ImageBitmap | null) 
    {
        this._bitmapData = value;
    }

    // AS3: ThemeManager.as's base property-defaults map (every theme clones it, and
    // none override this back) sets stretched_x=true universally - not a hardcoded
    // false as this port previously had it. BitmapDataController.as reads its actual
    // default per-window from getThemeManager().getPropertyDefaults(style), a
    // per-style theme lookup this port doesn't implement; but since AS3 itself never
    // varies this specific property across any real theme/style, hardcoding the same
    // universal value here is faithful, not a simplification.
    private _stretchedX: boolean = true;

    /**
     * Whether the bitmap is stretched horizontally.
     */
    // AS3: BitmapDataController.as::get stretchedX()
    public get stretchedX(): boolean
    {
        return this._stretchedX;
    }

    // AS3: BitmapDataController.as::set stretchedX()
    public set stretchedX(value: boolean)
    {
        this._stretchedX = value;
    }

    // AS3: same ThemeManager.as universal default as stretchedX (stretched_y=true).
    private _stretchedY: boolean = true;

    /**
     * Whether the bitmap is stretched vertically.
     */
    // AS3: .../src/com/sulake/core/window/components/BitmapDataController.as::get stretchedY()
    public get stretchedY(): boolean 
    {
        return this._stretchedY;
    }

    // AS3: .../src/com/sulake/core/window/components/BitmapDataController.as::set stretchedY()
    public set stretchedY(value: boolean) 
    {
        this._stretchedY = value;
    }

    // Declared without a non-default initializer: see `_etchingPointY` above for why.
    private _zoomX: number | null = null;

    /**
     * Horizontal zoom factor.
     */
    // AS3: .../src/com/sulake/core/window/components/BitmapDataController.as::get zoomX()
    public get zoomX(): number
    {
        return this._zoomX ?? 1.0;
    }

    // AS3: .../src/com/sulake/core/window/components/BitmapDataController.as::set zoomX()
    public set zoomX(value: number)
    {
        this._zoomX = value;
        this.fitSize();
    }

    // Declared without a non-default initializer: see `_etchingPointY` above for why.
    private _zoomY: number | null = null;

    /**
     * Vertical zoom factor.
     */
    // AS3: .../src/com/sulake/core/window/components/BitmapDataController.as::get zoomY()
    public get zoomY(): number 
    {
        return this._zoomY ?? 1.0;
    }

    // AS3: .../src/com/sulake/core/window/components/BitmapDataController.as::set zoomY()
    public set zoomY(value: number) 
    {
        this._zoomY = value;
        this.fitSize();
    }

    private _fitSizeToContents: boolean = false;

    /**
     * Whether to auto-resize the window to fit the bitmap dimensions.
     */
    // AS3: .../src/com/sulake/core/window/components/BitmapDataController.as::get fitSizeToContents()
    public get fitSizeToContents(): boolean 
    {
        return this._fitSizeToContents;
    }

    // AS3: .../src/com/sulake/core/window/components/BitmapDataController.as::set fitSizeToContents()
    public set fitSizeToContents(value: boolean) 
    {
        this._fitSizeToContents = value;
        this.fitSize();
    }

    private _greyscale: boolean = false;

    /**
     * Whether the bitmap is rendered in greyscale.
     */
    // AS3: .../src/com/sulake/core/window/components/BitmapDataController.as::get greyscale()
    public get greyscale(): boolean 
    {
        return this._greyscale;
    }

    // AS3: .../src/com/sulake/core/window/components/BitmapDataController.as::set greyscale()
    public set greyscale(value: boolean) 
    {
        this._greyscale = value;
    }

    // AS3: .../src/com/sulake/core/window/components/BitmapDataController.as::_etchingColor
    private _etchingColor: number = 0;

    /**
     * The etching color used for the shadow/outline effect.
     */
    // AS3: .../src/com/sulake/core/window/components/BitmapDataController.as::get etchingColor()
    public get etchingColor(): number 
    {
        return this._etchingColor;
    }

    // AS3: .../src/com/sulake/core/window/components/BitmapDataController.as::set etchingColor()
    public set etchingColor(value: number) 
    {
        this._etchingColor = value;
    }

    /**
     * Returns the etching offset point as [x, y].
     */
    // AS3: .../src/com/sulake/core/window/components/BitmapDataController.as::get etchingPoint()
    public get etchingPoint(): { x: number; y: number } 
    {
        return {x: this._etchingPointX, y: this._etchingPointY ?? -1};
    }

    /**
     * Sets etching from an array [color, offsetX, offsetY].
     */
    // AS3: .../src/com/sulake/core/window/components/BitmapDataController.as::set etching()
    public set etching(value: unknown[]) 
    {
        this._etchingColor = value[0] as number;
        this._etchingPointX = value[1] as number;
        this._etchingPointY = value[2] as number;
    }

    private _wrapX: boolean = false;

    /**
     * Whether the bitmap wraps horizontally.
     */
    // AS3: .../src/com/sulake/core/window/components/BitmapDataController.as::get wrapX()
    public get wrapX(): boolean 
    {
        return this._wrapX;
    }

    // AS3: .../src/com/sulake/core/window/components/BitmapDataController.as::set wrapX()
    public set wrapX(value: boolean) 
    {
        this._wrapX = value;
    }

    private _wrapY: boolean = false;

    /**
     * Whether the bitmap wraps vertically.
     */
    // AS3: .../src/com/sulake/core/window/components/BitmapDataController.as::get wrapY()
    public get wrapY(): boolean 
    {
        return this._wrapY;
    }

    // AS3: .../src/com/sulake/core/window/components/BitmapDataController.as::set wrapY()
    public set wrapY(value: boolean) 
    {
        this._wrapY = value;
    }

    private _flipX: boolean = false;

    /**
     * Whether the bitmap is flipped horizontally.
     */
    // AS3: .../src/com/sulake/core/window/components/BitmapDataController.as::get flipX()
    public get flipX(): boolean 
    {
        return this._flipX;
    }

    // AS3: .../src/com/sulake/core/window/components/BitmapDataController.as::set flipX()
    public set flipX(value: boolean) 
    {
        this._flipX = value;
    }

    private _flipY: boolean = false;

    /**
     * Whether the bitmap is flipped vertically.
     */
    // AS3: .../src/com/sulake/core/window/components/BitmapDataController.as::get flipY()
    public get flipY(): boolean 
    {
        return this._flipY;
    }

    // AS3: .../src/com/sulake/core/window/components/BitmapDataController.as::set flipY()
    public set flipY(value: boolean) 
    {
        this._flipY = value;
    }

    private _rotation: number = 0;

    /**
     * Rotation angle for the bitmap.
     */
    // AS3: .../src/com/sulake/core/window/components/BitmapDataController.as::get rotation()
    public get rotation(): number 
    {
        return this._rotation;
    }

    // AS3: .../src/com/sulake/core/window/components/BitmapDataController.as::set rotation()
    public set rotation(value: number) 
    {
        this._rotation = value;
    }

    /**
     * The pivot point for bitmap rendering.
     */
    // AS3: .../src/com/sulake/core/window/components/BitmapDataController.as::get pivotPoint()
    public get pivotPoint(): number 
    {
        return this._pivot;
    }

    // AS3: .../src/com/sulake/core/window/components/BitmapDataController.as::set pivotPoint()
    public set pivotPoint(value: number) 
    {
        this._pivot = value;
    }

    public override get properties(): unknown[] 
    {
        const props = super.properties;

        props.push(this.createProperty('pivot_point', PIVOT_NAMES[this._pivot] ?? PIVOT_NAMES[0]));
        props.push(this.createProperty('stretched_x', this._stretchedX));
        props.push(this.createProperty('stretched_y', this._stretchedY));
        props.push(this.createProperty('wrap_x', this._wrapX));
        props.push(this.createProperty('wrap_y', this._wrapY));
        props.push(this.createProperty('flip_x', this._flipX));
        props.push(this.createProperty('flip_y', this._flipY));
        props.push(this.createProperty('zoom_x', this._zoomX));
        props.push(this.createProperty('zoom_y', this._zoomY));
        props.push(this.createProperty('greyscale', this._greyscale));
        props.push(this.createProperty('etching_color', this._etchingColor));
        props.push(this.createProperty('fit_size_to_contents', this._fitSizeToContents));
        props.push(this.createProperty('rotation', this._rotation));

        return props;
    }

    public override set properties(value: unknown[]) 
    {
        for(const item of value) 
        {
            const prop = item as PropertyStruct;

            switch(prop.key) 
            {
                case 'pivot_point':
                    this._pivot = this.readPivotPoint(prop.value);
                    break;
                case 'stretched_x':
                    this._stretchedX = this.readBoolean(prop.value);
                    break;
                case 'stretched_y':
                    this._stretchedY = this.readBoolean(prop.value);
                    break;
                case 'zoom_x':
                    this._zoomX = this.readNumber(prop.value, 1);
                    break;
                case 'zoom_y':
                    this._zoomY = this.readNumber(prop.value, 1);
                    break;
                case 'wrap_x':
                    this._wrapX = this.readBoolean(prop.value);
                    break;
                case 'wrap_y':
                    this._wrapY = this.readBoolean(prop.value);
                    break;
                case 'flip_x':
                    this._flipX = this.readBoolean(prop.value);
                    break;
                case 'flip_y':
                    this._flipY = this.readBoolean(prop.value);
                    break;
                case 'greyscale':
                    this._greyscale = this.readBoolean(prop.value);
                    break;
                case 'etching_color':
                    this._etchingColor = this.readNumber(prop.value, 0);
                    break;
                case 'fit_size_to_contents':
                    this.fitSizeToContents = this.readBoolean(prop.value);
                    break;
                case 'rotation':
                    this._rotation = this.readNumber(prop.value, 0);
                    break;
            }
        }

        super.properties = value;
    }

    public override clone(): IWindow 
    {
        const cloned = super.clone() as BitmapDataController;

        cloned._bitmapData = this._bitmapData;
        cloned._pivot = this._pivot;
        cloned._stretchedX = this._stretchedX;
        cloned._stretchedY = this._stretchedY;
        cloned._zoomX = this._zoomX;
        cloned._zoomY = this._zoomY;
        cloned._fitSizeToContents = this._fitSizeToContents;
        cloned._greyscale = this._greyscale;
        cloned._etchingColor = this._etchingColor;
        cloned._etchingPointX = this._etchingPointX;
        cloned._etchingPointY = this._etchingPointY;
        cloned._wrapX = this._wrapX;
        cloned._wrapY = this._wrapY;
        cloned._flipX = this._flipX;
        cloned._flipY = this._flipY;
        cloned._rotation = this._rotation;

        return cloned;
    }

    public override dispose(): void 
    {
        if(this._disposed) return;

        this._bitmapData = null;

        super.dispose();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BitmapDataController.as::BitmapDataController()
    protected override finalize(): void
    {
        super.finalize();

        this._hasVisualContent = true;
        this._etchingPointY ??= -1;
        this._zoomX ??= 1.0;
        this._zoomY ??= 1.0;
    }

    /**
     * Resizes the window to match the bitmap dimensions (scaled by zoom).
     */
    // AS3: .../src/com/sulake/core/window/components/BitmapDataController.as::fitSize()
    protected fitSize(): void 
    {
        if(!this._fitSizeToContents || !this._bitmapData) return;

        this.width = Math.abs(this._bitmapData.width * this.zoomX);
        this.height = Math.abs(this._bitmapData.height * this.zoomY);
    }

    private readBoolean(value: unknown): boolean 
    {
        if(typeof value === 'boolean') return value;
        if(typeof value === 'string') return value.toLowerCase() === 'true';

        return !!value;
    }

    private readNumber(value: unknown, fallback: number): number 
    {
        const parsed = Number(value);

        return Number.isFinite(parsed) ? parsed : fallback;
    }

    private readPivotPoint(value: unknown): number 
    {
        if(typeof value === 'number') return value;

        if(typeof value === 'string') 
        {
            const pivot = pivotFromName(value);

            return pivot >= 0 ? pivot : 0;
        }

        return 0;
    }
}
