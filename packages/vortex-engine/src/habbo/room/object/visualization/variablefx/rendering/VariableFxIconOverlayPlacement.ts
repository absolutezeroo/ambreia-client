/**
 * Where one icon goes inside the frame. A bar can have two — the `double` alignment puts one at
 * each end.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/rendering/VariableFxIconOverlayPlacement.as
 */
export class VariableFxIconOverlayPlacement
{
    // AS3: .../variablefx/rendering/VariableFxIconOverlayPlacement.as::x
    x: number;

    // AS3: .../variablefx/rendering/VariableFxIconOverlayPlacement.as::y
    y: number;

    // AS3: .../variablefx/rendering/VariableFxIconOverlayPlacement.as::VariableFxIconOverlayPlacement()
    constructor(x: number = 0, y: number = 0)
    {
        this.x = x | 0;
        this.y = y | 0;
    }
}
