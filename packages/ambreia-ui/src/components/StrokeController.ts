import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import {WindowController} from '../WindowController';
import type {WindowEvent} from '../events/WindowEvent';
import type {PropertyStruct} from '../utils/PropertyStruct';

/**
 * Controller for stroke-only (border-with-no-fill) windows, with a
 * per-side bitmask (top/right/bottom/left) and optional corner radius.
 *
 * Actual drawing is performed by {@link StrokeSkinRenderer}.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/StrokeController.as
 */
export class StrokeController extends WindowController
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/StrokeController.as::SIDE_TOP
    public static readonly SIDE_TOP: number = 1;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/StrokeController.as::SIDE_RIGHT
    public static readonly SIDE_RIGHT: number = 2;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/StrokeController.as::SIDE_BOTTOM
    public static readonly SIDE_BOTTOM: number = 4;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/StrokeController.as::SIDE_LEFT
    public static readonly SIDE_LEFT: number = 8;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/StrokeController.as::SIDES_ALL
    public static readonly SIDES_ALL: string = 'all';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/StrokeController.as::SIDE_MASK_ALL
    private static readonly SIDE_MASK_ALL: number = 15;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/StrokeController.as::SIDE_NAMES
    public static readonly SIDE_NAMES: readonly string[] = ['top', 'right', 'bottom', 'left'];

    // Declared without initializers: WindowController's applyProperties()
    // phase dispatches to our `set properties()` override before finalize()
    // runs, so plain initializers here would clobber a value set from
    // `properties`. Defaults are primed with `??=` in finalize() instead
    // (see BubbleController for the same pattern).
    // AS3: .../src/com/sulake/core/window/components/StrokeController.as::_radius
    private _radius: number | null = null;
    // AS3: .../src/com/sulake/core/window/components/StrokeController.as::_strokeThickness
    private _strokeThickness: number | null = null;
    // AS3: .../src/com/sulake/core/window/components/StrokeController.as::_sides
    private _sides: string | null = null;
    private _sideMask: number | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/StrokeController.as::StrokeController()
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

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/StrokeController.as::StrokeController()
    protected override finalize(): void
    {
        super.finalize();

        this._radius ??= 0;
        this._strokeThickness ??= 0;
        this._sides ??= 'all';
        this._sideMask ??= StrokeController.SIDE_MASK_ALL;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/StrokeController.as::sidesFromString()
    public static sidesFromString(value: string | null): number
    {
        if(value === null)
        {
            return StrokeController.SIDE_MASK_ALL;
        }

        const trimmed = StrokeController.trim(value).toLowerCase();

        if(trimmed === '' || trimmed === 'all')
        {
            return StrokeController.SIDE_MASK_ALL;
        }

        let mask = 0;

        for(const part of trimmed.split(','))
        {
            switch(StrokeController.trim(part))
            {
                case 'all':
                    return StrokeController.SIDE_MASK_ALL;
                case 'top':
                    mask |= StrokeController.SIDE_TOP;
                    break;
                case 'right':
                    mask |= StrokeController.SIDE_RIGHT;
                    break;
                case 'bottom':
                    mask |= StrokeController.SIDE_BOTTOM;
                    break;
                case 'left':
                    mask |= StrokeController.SIDE_LEFT;
                    break;
            }
        }

        return mask === 0 ? StrokeController.SIDE_MASK_ALL : mask;
    }

    // AS3: .../src/com/sulake/core/window/components/StrokeController.as::clampNumber()
    private static clampNumber(value: number): number
    {
        return Number.isNaN(value) ? 0 : Math.max(0, value);
    }

    // AS3: .../src/com/sulake/core/window/components/StrokeController.as::normalizeSideMask()
    private static normalizeSideMask(mask: number): number
    {
        const masked = mask & 0x0F;

        return masked === 0 ? StrokeController.SIDE_MASK_ALL : masked;
    }

    // AS3: .../src/com/sulake/core/window/components/StrokeController.as::sidesToString()
    private static sidesToString(mask: number): string
    {
        mask = StrokeController.normalizeSideMask(mask);

        if(mask === StrokeController.SIDE_MASK_ALL)
        {
            return 'all';
        }

        const parts: string[] = [];

        if((mask & StrokeController.SIDE_TOP) !== 0) parts.push(StrokeController.SIDE_NAMES[0]);
        if((mask & StrokeController.SIDE_RIGHT) !== 0) parts.push(StrokeController.SIDE_NAMES[1]);
        if((mask & StrokeController.SIDE_BOTTOM) !== 0) parts.push(StrokeController.SIDE_NAMES[2]);
        if((mask & StrokeController.SIDE_LEFT) !== 0) parts.push(StrokeController.SIDE_NAMES[3]);

        return parts.join(',');
    }

    // AS3: .../src/com/sulake/core/window/components/StrokeController.as::trim()
    private static trim(value: string | null): string
    {
        return value === null ? '' : value.replace(/^\s+|\s+$/g, '');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/StrokeController.as::get radius()
    public get radius(): number
    {
        return this._radius ?? 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/StrokeController.as::set radius()
    public set radius(value: number)
    {
        const normalized = StrokeController.clampNumber(value);

        if(this._radius !== normalized)
        {
            this._radius = normalized;
            this.invalidate();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/StrokeController.as::get strokeThickness()
    public get strokeThickness(): number
    {
        return this._strokeThickness ?? 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/StrokeController.as::set strokeThickness()
    public set strokeThickness(value: number)
    {
        const normalized = StrokeController.clampNumber(value);

        if(this._strokeThickness !== normalized)
        {
            this._strokeThickness = normalized;
            this.invalidate();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/StrokeController.as::get sides()
    public get sides(): string
    {
        return this._sides ?? 'all';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/StrokeController.as::set sides()
    public set sides(value: string)
    {
        this.setSidesMask(StrokeController.sidesFromString(value));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/StrokeController.as::get sideMask()
    public get sideMask(): number
    {
        return this._sideMask ?? StrokeController.SIDE_MASK_ALL;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/StrokeController.as::set sideMask()
    public set sideMask(value: number)
    {
        this.setSidesMask(StrokeController.normalizeSideMask(value));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/StrokeController.as::get properties()
    public override get properties(): unknown[]
    {
        const props = super.properties;

        props.push(this.createProperty('radius', this._radius));
        props.push(this.createProperty('stroke_thickness', this._strokeThickness));
        props.push(this.createProperty('sides', this._sides));

        return props;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/StrokeController.as::set properties()
    public override set properties(value: unknown[])
    {
        let changed = false;

        for(const item of value)
        {
            const prop = item as PropertyStruct;

            switch(prop.key)
            {
                case 'radius':
                {
                    const normalized = StrokeController.clampNumber(Number(prop.value));

                    if(this._radius !== normalized)
                    {
                        this._radius = normalized;
                        changed = true;
                    }

                    break;
                }
                case 'stroke_thickness':
                {
                    const normalized = StrokeController.clampNumber(Number(prop.value));

                    if(this._strokeThickness !== normalized)
                    {
                        this._strokeThickness = normalized;
                        changed = true;
                    }

                    break;
                }
                case 'sides':
                    if(this.updateSides(StrokeController.sidesFromString(String(prop.value))))
                    {
                        changed = true;
                    }

                    break;
            }
        }

        if(changed)
        {
            this.invalidate();
        }

        super.properties = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/StrokeController.as::setSidesMask()
    private setSidesMask(mask: number): void
    {
        if(this.updateSides(mask))
        {
            this.invalidate();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/StrokeController.as::updateSides()
    private updateSides(mask: number): boolean
    {
        mask = StrokeController.normalizeSideMask(mask);

        const sides = StrokeController.sidesToString(mask);

        if(this._sideMask !== mask || this._sides !== sides)
        {
            this._sideMask = mask;
            this._sides = sides;

            return true;
        }

        return false;
    }
}
