import {AddonCodes} from '../AddonCodes';
import {VariableFxAddonBase} from './VariableFxAddonBase';

/**
 * A plain progress bar between two values.
 *
 * Name derived from its code: the AS3 class is `_SafeCls_4492`.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/roomevents/wired_setup/addons/variablefx/_SafeCls_4492.as
 */
export class VariableFxProgressBarAddon extends VariableFxAddonBase
{
    // AS3: .../addons/variablefx/_SafeCls_4492.as::get code()
    override get code(): number
    {
        return AddonCodes.VARIABLE_FX_PROGRESS_BAR;
    }

    // AS3: .../addons/variablefx/_SafeCls_4492.as::get categoryId()
    protected override get categoryId(): number
    {
        return 1;
    }
}
