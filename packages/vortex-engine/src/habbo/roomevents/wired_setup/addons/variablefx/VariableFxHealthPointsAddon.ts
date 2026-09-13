import {AddonCodes} from '../AddonCodes';
import {VariableFxAddonBase} from './VariableFxAddonBase';

/**
 * Hearts over an avatar or a furni.
 *
 * Name derived from its code: the AS3 class is `_SafeCls_4422`.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/roomevents/wired_setup/addons/variablefx/_SafeCls_4422.as
 */
export class VariableFxHealthPointsAddon extends VariableFxAddonBase
{
    // AS3: .../addons/variablefx/_SafeCls_4422.as::get code()
    override get code(): number
    {
        return AddonCodes.VARIABLE_FX_HEALTH_POINTS;
    }

    // AS3: .../addons/variablefx/_SafeCls_4422.as::get categoryId()
    protected override get categoryId(): number
    {
        return 0;
    }
}
