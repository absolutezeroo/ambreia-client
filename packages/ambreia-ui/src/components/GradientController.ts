import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import {WindowController} from '../WindowController';
import type {WindowEvent} from '../events/WindowEvent';
import type {PropertyStruct} from '../utils/PropertyStruct';

/**
 * Controller for two-color gradient fill windows (linear or radial, 8 directions).
 *
 * Actual drawing is performed by {@link GradientSkinRenderer}.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/GradientController.as
 */
export class GradientController extends WindowController
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/GradientController.as::MODE_LINEAR
    public static readonly MODE_LINEAR: string = 'linear';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/GradientController.as::MODE_RADIAL
    public static readonly MODE_RADIAL: string = 'radial';
    // Derived name. Obfuscated as `_SafeStr_10782` in the primary tree and
    // recovered in none; the readable siblings DIRECTION_UP_RIGHT and
    // DIRECTION_DOWN_RIGHT fix the naming, and the value is the source's own.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/GradientController.as::_SafeStr_10782
    public static readonly DIRECTION_UP_LEFT: string = 'up_left';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/GradientController.as::DIRECTION_UP_RIGHT
    public static readonly DIRECTION_UP_RIGHT: string = 'up_right';
    // Derived name, on the same basis as DIRECTION_UP_LEFT above.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/GradientController.as::_SafeStr_10927
    public static readonly DIRECTION_DOWN_LEFT: string = 'down_left';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/GradientController.as::DIRECTION_DOWN_RIGHT
    public static readonly DIRECTION_DOWN_RIGHT: string = 'down_right';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/GradientController.as::MODES
    public static readonly MODES: readonly string[] = ['linear', 'radial'];
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/GradientController.as::_SafeStr_6668 (DIRECTIONS)
    public static readonly DIRECTIONS: readonly string[] = [
        'up', 'down', 'left', 'right', 'up_left', 'up_right', 'down_left', 'down_right',
    ];

    // Declared without initializers: WindowController's applyProperties()
    // phase dispatches to our `set properties()` override before finalize()
    // runs, so plain initializers here would clobber a value set from
    // `properties`. Defaults are primed with `??=` in finalize() instead
    // (see BubbleController for the same pattern).
    // AS3: .../src/com/sulake/core/window/components/GradientController.as::_color1
    private _color1: number | null = null;
    // AS3: .../src/com/sulake/core/window/components/GradientController.as::_color2
    private _color2: number | null = null;
    // AS3: .../src/com/sulake/core/window/components/GradientController.as::_mode
    private _mode: string | null = null;
    private _direction: string | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/GradientController.as::GradientController()
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

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/GradientController.as::GradientController()
    protected override finalize(): void
    {
        super.finalize();

        this._color1 ??= 0xFFFFFFFF;
        this._color2 ??= 0xFF000000;
        this._mode ??= 'linear';
        this._direction ??= 'down';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/GradientController.as::normalizeMode()
    public static normalizeMode(value: string): string
    {
        return value === 'radial' ? 'radial' : 'linear';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/GradientController.as::normalizeDirection()
    public static normalizeDirection(value: string): string
    {
        return GradientController.DIRECTIONS.indexOf(value) >= 0 ? value : 'down';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/GradientController.as::get color1()
    public get color1(): number
    {
        return this._color1 ?? 0xFFFFFFFF;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/GradientController.as::set color1()
    public set color1(value: number)
    {
        if(this._color1 !== value)
        {
            this._color1 = value;
            this.invalidate();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/GradientController.as::get color2()
    public get color2(): number
    {
        return this._color2 ?? 0xFF000000;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/GradientController.as::set color2()
    public set color2(value: number)
    {
        if(this._color2 !== value)
        {
            this._color2 = value;
            this.invalidate();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/GradientController.as::get mode()
    public get mode(): string
    {
        return this._mode ?? 'linear';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/GradientController.as::set mode()
    public set mode(value: string)
    {
        const normalized = GradientController.normalizeMode(value);

        if(this._mode !== normalized)
        {
            this._mode = normalized;
            this.invalidate();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/GradientController.as::get direction()
    public get direction(): string
    {
        return this._direction ?? 'down';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/GradientController.as::set direction()
    public set direction(value: string)
    {
        const normalized = GradientController.normalizeDirection(value);

        if(this._direction !== normalized)
        {
            this._direction = normalized;
            this.invalidate();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/GradientController.as::get properties()
    public override get properties(): unknown[]
    {
        const props = super.properties;

        props.push(this.createProperty('color1', this._color1));
        props.push(this.createProperty('color2', this._color2));
        props.push(this.createProperty('mode', this._mode));
        props.push(this.createProperty('direction', this._direction));

        return props;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/GradientController.as::set properties()
    public override set properties(value: unknown[])
    {
        for(const item of value)
        {
            const prop = item as PropertyStruct;

            switch(prop.key)
            {
                case 'color1':
                    this.color1 = Number(prop.value) >>> 0;
                    break;
                case 'color2':
                    this.color2 = Number(prop.value) >>> 0;
                    break;
                case 'mode':
                    this.mode = String(prop.value);
                    break;
                case 'direction':
                    this.direction = String(prop.value);
                    break;
            }
        }

        super.properties = value;
    }
}
