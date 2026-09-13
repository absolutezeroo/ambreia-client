import {AddonCodes} from '../AddonCodes';
import {VariableFxAddonBase} from './VariableFxAddonBase';

/**
 * The wide boss bar.
 *
 * Name derived from its code: the AS3 class is `_SafeCls_4450`.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/roomevents/wired_setup/addons/variablefx/_SafeCls_4450.as
 */
export class VariableFxBossBarAddon extends VariableFxAddonBase
{
    // AS3: .../addons/variablefx/_SafeCls_4450.as::get code()
    override get code(): number
    {
        return AddonCodes.VARIABLE_FX_BOSS_BAR;
    }

    // AS3: .../addons/variablefx/_SafeCls_4450.as::get categoryId()
    protected override get categoryId(): number
    {
        return 4;
    }
}
