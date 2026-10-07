import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import {StaticBitmapWrapperController} from './StaticBitmapWrapperController';
import type {WindowEvent} from '../events/WindowEvent';
import type {PropertyStruct} from '../utils/PropertyStruct';

/**
 * Controller for bitmap-fill windows: stretch/tile/center/cover/contain a
 * bitmap into the target rect, with optional tint and tile spacing.
 *
 * Actual drawing is performed by {@link BitmapFillSkinRenderer}.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BitmapFillController.as
 */
export class BitmapFillController extends StaticBitmapWrapperController
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BitmapFillController.as::FILL_MODE_STRETCH
    public static readonly FILL_MODE_STRETCH: string = 'stretch';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BitmapFillController.as::FILL_MODE_TILE
    public static readonly FILL_MODE_TILE: string = 'tile';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BitmapFillController.as::FILL_MODE_CENTER
    public static readonly FILL_MODE_CENTER: string = 'center';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BitmapFillController.as::FILL_MODE_COVER
    public static readonly FILL_MODE_COVER: string = 'cover';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BitmapFillController.as::FILL_MODE_CONTAIN
    public static readonly FILL_MODE_CONTAIN: string = 'contain';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BitmapFillController.as::FILL_MODES
    public static readonly FILL_MODES: readonly string[] = ['stretch', 'tile', 'center', 'cover', 'contain'];

    // Declared without initializers: WindowController's applyProperties()
    // phase dispatches to our `set properties()` override before finalize()
    // runs, so plain initializers here would clobber a value set from
    // `properties`. Defaults are primed with `??=` in finalize() instead
    // (see BubbleController for the same pattern) — here primed from the
    // theme's property defaults, matching the AS3 constructor which reads
    // them before calling super().
    // AS3: .../src/com/sulake/core/window/components/BitmapFillController.as::_fillMode
    private _fillMode: string | null = null;
    // AS3: .../src/com/sulake/core/window/components/BitmapFillController.as::_tint
    private _tint: boolean | null = null;
    private _spacing: number | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BitmapFillController.as::BitmapFillController()
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

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BitmapFillController.as::BitmapFillController()
    protected override finalize(): void
    {
        super.finalize();

        const defaults = this._context.getWindowFactory()?.getThemeManager()?.getPropertyDefaults(this._style) ?? null;

        this._fillMode ??= BitmapFillController.normalizeFillMode(String(defaults?.getValue('fill_mode') ?? 'stretch'));
        this._tint ??= BitmapFillController.parseBoolean(defaults?.getValue('tint') ?? false);
        this._spacing ??= BitmapFillController.normalizeSpacing(Number(defaults?.getValue('spacing') ?? 0));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BitmapFillController.as::normalizeFillMode()
    public static normalizeFillMode(value: string): string
    {
        return BitmapFillController.FILL_MODES.indexOf(value) >= 0 ? value : 'stretch';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BitmapFillController.as::normalizeSpacing()
    public static normalizeSpacing(value: number): number
    {
        return Number.isNaN(value) ? 0 : Math.max(0, value);
    }

    // AS3: .../src/com/sulake/core/window/components/BitmapFillController.as::parseBoolean()
    private static parseBoolean(value: unknown): boolean
    {
        if(typeof value === 'boolean')
        {
            return value;
        }

        if(typeof value === 'string')
        {
            const trimmed = value.replace(/^\s+|\s+$/g, '').toLowerCase();

            return trimmed === 'true' || trimmed === '1';
        }

        return !!value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BitmapFillController.as::get fillMode()
    public get fillMode(): string
    {
        return this._fillMode ?? 'stretch';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BitmapFillController.as::set fillMode()
    public set fillMode(value: string)
    {
        const normalized = BitmapFillController.normalizeFillMode(value);

        if(this.fillMode !== normalized)
        {
            this._fillMode = normalized;
            this.invalidate();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BitmapFillController.as::get tint()
    public get tint(): boolean
    {
        return this._tint ?? false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BitmapFillController.as::set tint()
    public set tint(value: boolean)
    {
        if(this.tint !== value)
        {
            this._tint = value;
            this.invalidate();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BitmapFillController.as::get spacing()
    public get spacing(): number
    {
        return this._spacing ?? 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BitmapFillController.as::set spacing()
    public set spacing(value: number)
    {
        const normalized = BitmapFillController.normalizeSpacing(value);

        if(this.spacing !== normalized)
        {
            this._spacing = normalized;
            this.invalidate();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BitmapFillController.as::get properties()
    public override get properties(): unknown[]
    {
        const props = super.properties;

        props.push(this.createProperty('fill_mode', this.fillMode));
        props.push(this.createProperty('tint', this.tint));
        props.push(this.createProperty('spacing', this.spacing));

        return props;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BitmapFillController.as::set properties()
    public override set properties(value: unknown[])
    {
        let changed = false;

        for(const item of value)
        {
            const prop = item as PropertyStruct;

            switch(prop.key)
            {
                case 'fill_mode':
                {
                    const normalized = BitmapFillController.normalizeFillMode(String(prop.value));

                    if(this.fillMode !== normalized)
                    {
                        this._fillMode = normalized;
                        changed = true;
                    }

                    break;
                }
                case 'tint':
                {
                    const normalized = BitmapFillController.parseBoolean(prop.value);

                    if(this.tint !== normalized)
                    {
                        this._tint = normalized;
                        changed = true;
                    }

                    break;
                }
                case 'spacing':
                {
                    const normalized = BitmapFillController.normalizeSpacing(Number(prop.value));

                    if(this.spacing !== normalized)
                    {
                        this._spacing = normalized;
                        changed = true;
                    }

                    break;
                }
            }
        }

        if(changed)
        {
            this.invalidate();
        }

        super.properties = value;
    }
}
