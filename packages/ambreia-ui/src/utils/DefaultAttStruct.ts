/**
 * Default attribute struct for window type+style defaults.
 *
 * Stores default blend, threshold, background, color, and optional rect limits
 * that are applied when a window of a given type+style is created.
 *
 * @see sources/win63_version/core/window/utils/DefaultAttStruct.as
 */
// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/DefaultAttStruct.as::DefaultAttStruct
export class DefaultAttStruct
{
    private static readonly INT_MIN: number = -2147483648;
    private static readonly INT_MAX: number = 2147483647;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/DefaultAttStruct.as::useRectLimits
    public static useRectLimits: boolean = true;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/DefaultAttStruct.as::blend
    public blend: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/DefaultAttStruct.as::threshold
    public threshold: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/DefaultAttStruct.as::background
    public background: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/DefaultAttStruct.as::color
    public color: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/DefaultAttStruct.as::width_min
    public width_min: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/DefaultAttStruct.as::width_max
    public width_max: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/DefaultAttStruct.as::height_min
    public height_min: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/DefaultAttStruct.as::height_max
    public height_max: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/DefaultAttStruct.as::DefaultAttStruct()
    constructor(
        blend: number = 1,
        threshold: number = 10,
        background: boolean = false,
        color: number = 0xFFFFFF,
        widthMin: number = DefaultAttStruct.INT_MIN,
        widthMax: number = DefaultAttStruct.INT_MAX,
        heightMin: number = DefaultAttStruct.INT_MIN,
        heightMax: number = DefaultAttStruct.INT_MAX
    )
    {
        this.blend = blend;
        this.threshold = threshold;
        this.background = background;
        this.color = color;
        this.width_min = widthMin;
        this.width_max = widthMax;
        this.height_min = heightMin;
        this.height_max = heightMax;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/DefaultAttStruct.as::hasRectLimits()
    public hasRectLimits(): boolean
    {
        return DefaultAttStruct.useRectLimits
			&& (this.width_min > DefaultAttStruct.INT_MIN
				|| this.height_min > DefaultAttStruct.INT_MIN
				|| this.width_max < DefaultAttStruct.INT_MAX
				|| this.height_max < DefaultAttStruct.INT_MAX);
    }
}