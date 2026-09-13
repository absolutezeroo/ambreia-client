import {AddonCodes} from '../AddonCodes';
import {VariableFxAddonBase} from './VariableFxAddonBase';

/**
 * The status-bar family — 22 of the 38 preview styles live here.
 *
 * Name derived from its code: the AS3 class is `_SafeCls_4378`.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/roomevents/wired_setup/addons/variablefx/_SafeCls_4378.as
 */
export class VariableFxStatusBarAddon extends VariableFxAddonBase
{
    // AS3: .../addons/variablefx/_SafeCls_4378.as::get code()
    override get code(): number
    {
        return AddonCodes.VARIABLE_FX_STATUS_BAR;
    }

    // AS3: .../addons/variablefx/_SafeCls_4378.as::get categoryId()
    protected override get categoryId(): number
    {
        return 3;
    }
}
