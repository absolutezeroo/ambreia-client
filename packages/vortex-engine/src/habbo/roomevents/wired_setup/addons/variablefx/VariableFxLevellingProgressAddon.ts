import type {PresetManager} from '../../uibuilder/PresetManager';
import type {WiredUIPreset} from '../../uibuilder/presets/WiredUIPreset';
import {AddonCodes} from '../AddonCodes';
import {VariableFxAddonBase} from './VariableFxAddonBase';
import type {VariableFxEditorState} from './model/VariableFxEditorState';

/**
 * The level badge, and the only add-on of the six that explains itself at the top of the dialog.
 *
 * It also carries a 22nd int param: the level effect draws a second effect inside itself (the bar
 * under the badge), so it needs a renderer id for that one as well.
 *
 * Name derived from its code: the AS3 class is `_SafeCls_4456`.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/roomevents/wired_setup/addons/variablefx/_SafeCls_4456.as
 */
export class VariableFxLevellingProgressAddon extends VariableFxAddonBase
{
    // AS3: .../addons/variablefx/_SafeCls_4456.as::get code()
    override get code(): number
    {
        return AddonCodes.VARIABLE_FX_LEVELLING_PROGRESS;
    }

    // AS3: .../addons/variablefx/_SafeCls_4456.as::get categoryId()
    protected override get categoryId(): number
    {
        return 2;
    }

    // AS3: .../addons/variablefx/_SafeCls_4456.as::createTopInfoPreset()
    protected override createTopInfoPreset(presetManager: PresetManager): WiredUIPreset | null
    {
        return presetManager.createUsageInfoSection('${wiredfurni.params.variablefx.levelling_progress.info}');
    }

    // AS3: .../addons/variablefx/_SafeCls_4456.as::readIntParams()
    protected override readIntParams(params: number[], state: VariableFxEditorState): void
    {
        super.readIntParams(params, state);

        state.subRendererId = params[21] ?? 0;
    }

    // AS3: .../addons/variablefx/_SafeCls_4456.as::writeIntParams()
    protected override writeIntParams(params: number[], state: VariableFxEditorState): void
    {
        super.writeIntParams(params, state);

        params.push(state.subRendererId);
    }
}
