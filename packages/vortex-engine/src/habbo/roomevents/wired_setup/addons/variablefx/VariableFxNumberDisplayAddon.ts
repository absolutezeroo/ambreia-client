import type {Triggerable} from '@habbo/communication/messages/incoming/userdefinedroomevents/Triggerable';
import {AddonCodes} from '../AddonCodes';
import {VariableFxAddonBase} from './VariableFxAddonBase';
import type {VariableFxEditorState} from './model/VariableFxEditorState';

/**
 * A number over the object, optionally with an icon beside it.
 *
 * The only one of the six that uses the string param — it holds the icon's name — and it too takes a
 * 22nd int param, for which side of the number the icon sits on.
 *
 * Name derived from its code: the AS3 class is `_SafeCls_4415`.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/roomevents/wired_setup/addons/variablefx/_SafeCls_4415.as
 */
export class VariableFxNumberDisplayAddon extends VariableFxAddonBase
{
    // AS3: .../addons/variablefx/_SafeCls_4415.as::get code()
    override get code(): number
    {
        return AddonCodes.VARIABLE_FX_NUMBER_DISPLAY;
    }

    // AS3: .../addons/variablefx/_SafeCls_4415.as::get categoryId()
    protected override get categoryId(): number
    {
        return 5;
    }

    // AS3: .../addons/variablefx/_SafeCls_4415.as::readIntParams()
    protected override readIntParams(params: number[], state: VariableFxEditorState): void
    {
        super.readIntParams(params, state);

        state.iconAlignmentId = params[21] ?? 0;
    }

    // AS3: .../addons/variablefx/_SafeCls_4415.as::writeIntParams()
    protected override writeIntParams(params: number[], state: VariableFxEditorState): void
    {
        super.writeIntParams(params, state);

        params.push(state.iconAlignmentId);
    }

    // AS3: .../addons/variablefx/_SafeCls_4415.as::readStringParam()
    protected override readStringParam(def: Triggerable, state: VariableFxEditorState): void
    {
        state.icon = def.stringParam;
    }

    // AS3: .../addons/variablefx/_SafeCls_4415.as::writeStringParam()
    protected override writeStringParam(state: VariableFxEditorState): string
    {
        return state.icon;
    }
}
