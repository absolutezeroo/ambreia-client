/**
 * One icon from `variablefx_icon_metadata`: its name, the asset that draws it, and the nudge that
 * centres its artwork on the bar.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/rendering/VariableFxIconDefinition.as
 */
export class VariableFxIconDefinition
{
    // AS3: .../variablefx/rendering/VariableFxIconDefinition.as::name
    name: string;

    // AS3: .../variablefx/rendering/VariableFxIconDefinition.as::assetName
    assetName: string;

    // AS3: .../variablefx/rendering/VariableFxIconDefinition.as::offsetX
    offsetX: number;

    // AS3: .../variablefx/rendering/VariableFxIconDefinition.as::offsetY
    offsetY: number;

    // AS3: .../variablefx/rendering/VariableFxIconDefinition.as::VariableFxIconDefinition()
    constructor(name: string, assetName: string, offsetX: number = 0, offsetY: number = 0)
    {
        this.name = name;
        this.assetName = assetName;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
    }
}
