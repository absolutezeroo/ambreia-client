/**
 * An integer rectangle limiting where a composer draw lands.
 *
 * Separate from the engine's `Rectangle` because AS3 keeps it separate: it is a clip instruction,
 * not a shape, and the composer is the only thing that turns one into a real rectangle.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/rendering/VariableFxClipRect.as
 */
export class VariableFxClipRect
{
    // AS3: .../variablefx/rendering/VariableFxClipRect.as::x
    x: number;

    // AS3: .../variablefx/rendering/VariableFxClipRect.as::y
    y: number;

    // AS3: .../variablefx/rendering/VariableFxClipRect.as::width
    width: number;

    // AS3: .../variablefx/rendering/VariableFxClipRect.as::height
    height: number;

    // AS3: .../variablefx/rendering/VariableFxClipRect.as::VariableFxClipRect()
    constructor(x: number = 0, y: number = 0, width: number = 0, height: number = 0)
    {
        this.x = x | 0;
        this.y = y | 0;
        this.width = width | 0;
        this.height = height | 0;
    }
}
