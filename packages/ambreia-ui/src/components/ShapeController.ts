import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import {ContainerController} from './ContainerController';
import type {WindowEvent} from '../events/WindowEvent';
import type {PropertyStruct} from '../utils/PropertyStruct';

/**
 * Controller for vector shape windows (rectangle, round rectangle, ellipse, rhombus).
 *
 * Draws a filled shape with an optional stroke, using the inherited `color`
 * for the fill and dedicated stroke properties for the outline. Actual
 * drawing is performed by {@link ShapeSkinRenderer}.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ShapeController.as
 */
export class ShapeController extends ContainerController
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ShapeController.as::SHAPE_RECTANGLE
    public static readonly SHAPE_RECTANGLE: string = 'rectangle';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ShapeController.as::SHAPE_ROUND_RECTANGLE
    public static readonly SHAPE_ROUND_RECTANGLE: string = 'round_rectangle';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ShapeController.as::SHAPE_ELLIPSE
    public static readonly SHAPE_ELLIPSE: string = 'ellipse';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ShapeController.as::SHAPE_RHOMBUS
    public static readonly SHAPE_RHOMBUS: string = 'rhombus';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ShapeController.as::SHAPES
    public static readonly SHAPES: readonly string[] = ['rectangle', 'round_rectangle', 'ellipse', 'rhombus'];

    // Declared without initializers: WindowController's applyProperties()
    // phase dispatches to our `set properties()` override before finalize()
    // runs, so a plain `= 'rectangle'` here would clobber a value set from
    // `properties`. Defaults are primed with `??=` in finalize() instead
    // (see BubbleController for the same pattern).
    private _shape: string | null = null;
    // AS3: .../src/com/sulake/core/window/components/ShapeController.as::_radius
    private _radius: number | null = null;
    // AS3: .../src/com/sulake/core/window/components/ShapeController.as::_strokeColor
    private _strokeColor: number | null = null;
    // AS3: .../src/com/sulake/core/window/components/ShapeController.as::_strokeHsvShade
    private _strokeHsvShade: number | null = null;
    // AS3: .../src/com/sulake/core/window/components/ShapeController.as::_strokeThickness
    private _strokeThickness: number | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ShapeController.as::ShapeController()
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
        id: number = 0
    )
    {
        super(name, type, style, param, context, rect, parent, procedure, tags, properties, id);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ShapeController.as::ShapeController()
    protected override finalize(): void
    {
        super.finalize();

        this._hasVisualContent = true;
        this._shape ??= 'rectangle';
        this._radius ??= 0;
        this._strokeColor ??= 0xFF000000;
        this._strokeHsvShade ??= 0;
        this._strokeThickness ??= 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ShapeController.as::normalizeShape()
    public static normalizeShape(value: string): string
    {
        return ShapeController.SHAPES.indexOf(value) >= 0 ? value : 'rectangle';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ShapeController.as::get shape()
    public get shape(): string
    {
        return this._shape ?? 'rectangle';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ShapeController.as::set shape()
    public set shape(value: string)
    {
        const normalized = ShapeController.normalizeShape(value);

        if(this._shape !== normalized)
        {
            this._shape = normalized;
            this.invalidate();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ShapeController.as::get radius()
    public get radius(): number
    {
        return this._radius ?? 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ShapeController.as::set radius()
    public set radius(value: number)
    {
        const normalized = Number.isNaN(value) ? 0 : Math.max(0, value);

        if(this._radius !== normalized)
        {
            this._radius = normalized;
            this.invalidate();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ShapeController.as::get strokeColor()
    public get strokeColor(): number
    {
        return this._strokeColor ?? 0xFF000000;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ShapeController.as::set strokeColor()
    public set strokeColor(value: number)
    {
        if(this._strokeColor !== value)
        {
            this._strokeColor = value;
            this.invalidate();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ShapeController.as::get strokeHsvShade()
    public get strokeHsvShade(): number
    {
        return this._strokeHsvShade ?? 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ShapeController.as::set strokeHsvShade()
    public set strokeHsvShade(value: number)
    {
        const normalized = Number.isNaN(value) ? 0 : value;

        if(this._strokeHsvShade !== normalized)
        {
            this._strokeHsvShade = normalized;
            this.invalidate();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ShapeController.as::get strokeThickness()
    public get strokeThickness(): number
    {
        return this._strokeThickness ?? 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ShapeController.as::set strokeThickness()
    public set strokeThickness(value: number)
    {
        const normalized = Number.isNaN(value) ? 0 : Math.max(0, value);

        if(this._strokeThickness !== normalized)
        {
            this._strokeThickness = normalized;
            this.invalidate();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ShapeController.as::get properties()
    public override get properties(): unknown[]
    {
        const props = super.properties;

        props.push(this.createProperty('shape', this._shape));
        props.push(this.createProperty('radius', this._radius));
        props.push(this.createProperty('stroke_color', this._strokeColor));
        props.push(this.createProperty('stroke_hsv_shade', this._strokeHsvShade));
        props.push(this.createProperty('stroke_thickness', this._strokeThickness));

        return props;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ShapeController.as::set properties()
    public override set properties(value: unknown[])
    {
        for(const item of value)
        {
            const prop = item as PropertyStruct;

            switch(prop.key)
            {
                case 'shape':
                    this.shape = String(prop.value);
                    break;
                case 'radius':
                    this.radius = Number(prop.value);
                    break;
                case 'stroke_color':
                    this.strokeColor = Number(prop.value) >>> 0;
                    break;
                case 'stroke_hsv_shade':
                    this.strokeHsvShade = Number(prop.value);
                    break;
                case 'stroke_thickness':
                    this.strokeThickness = Number(prop.value);
                    break;
            }
        }

        super.properties = value;
    }
}
