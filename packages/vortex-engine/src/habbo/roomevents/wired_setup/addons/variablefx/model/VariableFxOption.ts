/**
 * One choice in an editor dropdown: the id the wire carries, the key the label is looked up by, and
 * the name the renderer wants.
 *
 * Three values rather than two because the three namespaces genuinely differ. The wire says `6`,
 * the localization says `wiredfurni.params.variablefx.color.cyan`, and the renderer wants `CYAN`.
 * `runtimeValue` defaults to `key` for the options where those last two coincide.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/roomevents/wired_setup/addons/variablefx/model/VariableFxOption.as
 */
export class VariableFxOption
{
    // AS3: .../addons/variablefx/model/VariableFxOption.as::id
    id: number;

    // AS3: .../addons/variablefx/model/VariableFxOption.as::key
    key: string;

    // AS3: .../addons/variablefx/model/VariableFxOption.as::runtimeValue
    runtimeValue: string;

    // AS3: .../addons/variablefx/model/VariableFxOption.as::VariableFxOption()
    constructor(id: number, key: string, runtimeValue: string | null = null)
    {
        this.id = id;
        this.key = key;
        this.runtimeValue = runtimeValue ?? key;
    }
}
