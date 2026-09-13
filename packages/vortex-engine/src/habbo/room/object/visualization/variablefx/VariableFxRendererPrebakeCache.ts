import type {IVariableFxRendererPrebake} from './IVariableFxRendererPrebake';
import type {VariableFxConfigData} from './VariableFxConfigData';

/**
 * One prebake per config, created on first use and stored on the config itself.
 *
 * The config is the cache — which is what makes the sharing work: every object in the room showing
 * the same effect holds the same `VariableFxConfigData`, so they bake the artwork once between
 * them rather than once each. It is also why `VariableFxVisualizer` compares prebake identity to
 * decide it has gone stale: replacing the config's prebake invalidates every renderer built from
 * it, at once.
 *
 * Class name derived: the AS3 class is obfuscated (`_SafeCls_3616`). Both its methods are readable.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/_SafeCls_3616.as
 */
export class VariableFxRendererPrebakeCache
{
    // AS3: .../variablefx/_SafeCls_3616.as::getOrCreate()
    static getOrCreate(config: VariableFxConfigData, create: () => IVariableFxRendererPrebake): IVariableFxRendererPrebake
    {
        if(config.prebake !== null) return config.prebake;

        config.prebake = create();

        return config.prebake;
    }

    // AS3: .../variablefx/_SafeCls_3616.as::disposeConfigPrebake()
    static disposeConfigPrebake(config: VariableFxConfigData): void
    {
        if(config.prebake !== null)
        {
            config.prebake.dispose();
            config.prebake = null;
        }
    }
}
