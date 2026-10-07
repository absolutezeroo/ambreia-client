/**
 * Layout entity for skin rendering.
 *
 * Defines the destination placement of a single piece in the skin layout.
 * Scale modes control how the piece adapts to changes in window dimensions.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayoutEntity.as
 */
export class SkinLayoutEntity
{
    // The AS3 names, `STRECH` typo included — the port had shortened them to
    // SCALE_*, which reads as five members missing from the class.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayoutEntity.as::SCALE_TYPE_FIXED
    public static readonly SCALE_TYPE_FIXED: number = 0;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayoutEntity.as::SCALE_TYPE_MOVE
    public static readonly SCALE_TYPE_MOVE: number = 1;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayoutEntity.as::SCALE_TYPE_STRECH
    public static readonly SCALE_TYPE_STRECH: number = 2;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayoutEntity.as::SCALE_TYPE_TILED
    public static readonly SCALE_TYPE_TILED: number = 4;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayoutEntity.as::SCALE_TYPE_CENTER
    public static readonly SCALE_TYPE_CENTER: number = 8;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayoutEntity.as::COLORIZE_METHOD_MULTIPLY
    public static readonly COLORIZE_METHOD_MULTIPLY: string = 'multiply';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayoutEntity.as::COLORIZE_METHOD_HSV_LAYER
    public static readonly COLORIZE_METHOD_HSV_LAYER: string = 'hsv_layer';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayoutEntity.as::get id()
    public readonly id: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayoutEntity.as::get name()
    public readonly name: string;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayoutEntity.as::colorize
    public readonly colorize: boolean;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayoutEntity.as::color
    public readonly color: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayoutEntity.as::blend
    public readonly blend: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayoutEntity.as::scaleH
    public readonly scaleH: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayoutEntity.as::scaleV
    public readonly scaleV: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayoutEntity.as::region
    public readonly region: { x: number; y: number; width: number; height: number };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayoutEntity.as::colorizeMethod
    public colorizeMethod: string = SkinLayoutEntity.COLORIZE_METHOD_MULTIPLY;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayoutEntity.as::shade
    public shade: number = 0;

    constructor(
        id: number,
        name: string,
        colorize: boolean,
        color: number,
        blend: number,
        scaleH: number,
        scaleV: number,
        region: { x: number; y: number; width: number; height: number }
    )
    {
        this.id = id;
        this.name = name;
        this.colorize = colorize;
        this.color = color;
        this.blend = blend;
        this.scaleH = scaleH;
        this.scaleV = scaleV;
        this.region = {...region};
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayoutEntity.as::get tags()
    // AS3 returns null unconditionally — SkinLayoutEntity carries no tags, the
    // getter only exists to satisfy IChildEntity.
    public get tags(): string[] | null
    {
        return null;
    }

    private _disposed: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/SkinLayoutEntity.as::dispose()
    // AS3 drops the Rectangle (`region = null`). `region` is dereferenced by the
    // renderer, the parser and SkinLayout without a null test, so it is emptied
    // here instead of nulled: a use-after-dispose reads as a zero rect rather
    // than throwing halfway through a draw.
    public dispose(): void
    {
        if(this._disposed) return;

        this.region.x = 0;
        this.region.y = 0;
        this.region.width = 0;
        this.region.height = 0;

        this._disposed = true;
    }
}
