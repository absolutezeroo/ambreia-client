/**
 * ColorData
 *
 * @see com.sulake.habbo.room.object.visualization.data.ColorData
 *
 * Array of colors per layer. DEFAULT_COLOR = 0xFFFFFF.
 */
export class ColorData
{
    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/ColorData.as::DEFAULT_COLOR
    public static readonly DEFAULT_COLOR: number = 0xFFFFFF;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/ColorData.as::_colors
    private _colors: number[];

    constructor(layerCount: number)
    {
        this._colors = [];

        for(let i = 0; i < layerCount; i++)
        {
            this._colors.push(ColorData.DEFAULT_COLOR);
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/ColorData.as::setColor()
    setColor(color: number, layerIndex: number): void
    {
        if(layerIndex < 0 || layerIndex >= this._colors.length)
        {
            return;
        }

        this._colors[layerIndex] = color;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/ColorData.as::getColor()
    getColor(layerIndex: number): number
    {
        if(layerIndex < 0 || layerIndex >= this._colors.length)
        {
            return ColorData.DEFAULT_COLOR;
        }

        return this._colors[layerIndex];
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/ColorData.as::dispose()
    dispose(): void
    {
        this._colors = [];
    }
}
