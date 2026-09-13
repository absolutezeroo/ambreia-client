import type {IVariableFxAssetProvider} from './IVariableFxAssetProvider';
import type {VariableFxConfigData} from './VariableFxConfigData';
import type {VariableFxStatusData} from './VariableFxStatusData';
import type {VariableFxRendererRegistry} from './VariableFxRendererRegistry';

/**
 * Everything a renderer is given for one draw: where to get artwork, what to draw, and the value
 * already reduced to the 0..1 the bars and fills actually use.
 *
 * Rebuilt rather than mutated on every status change — `VariableFxVisualizer.updateData()` makes a
 * new one — so a renderer may hold onto it for the duration of a draw without copying.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/VariableFxRendererContext.as
 */
export class VariableFxRendererContext
{
    // AS3: .../variablefx/VariableFxRendererContext.as::assetProvider
    assetProvider: IVariableFxAssetProvider;

    // AS3: .../variablefx/VariableFxRendererContext.as::config
    config: VariableFxConfigData;

    // AS3: .../variablefx/VariableFxRendererContext.as::status
    status: VariableFxStatusData;

    /**
     * The bounds actually in force — the status's overrides when it has finite ones, the config's
     * defaults otherwise. Resolved by the visualizer so no renderer repeats the decision.
     */
    // AS3: .../variablefx/VariableFxRendererContext.as::minValue
    //   Name RECOVERED, not derived: the AS3 field is `_SafeStr_8525`, and
    //   `VariableFxVisualizer.createContext()` passes the resolved minimum into this position.
    minValue: number;

    // AS3: .../variablefx/VariableFxRendererContext.as::maxValue
    //   Name RECOVERED — same call site, the resolved maximum.
    maxValue: number;

    // AS3: .../variablefx/VariableFxRendererContext.as::progress
    progress: number;

    /**
     * Present so a renderer can build another renderer — the level ones nest a progress bar inside
     * themselves through `cloneForRenderer()`.
     */
    // AS3: .../variablefx/VariableFxRendererContext.as::registry
    //   Name RECOVERED: the AS3 field is `_SafeStr_7190`, and the visualizer passes its
    //   `_registry` into this position.
    registry: VariableFxRendererRegistry | null;

    // AS3: .../variablefx/VariableFxRendererContext.as::VariableFxRendererContext()
    constructor(
        assetProvider: IVariableFxAssetProvider,
        config: VariableFxConfigData,
        status: VariableFxStatusData,
        minValue: number,
        maxValue: number,
        progress: number,
        registry: VariableFxRendererRegistry | null = null
    )
    {
        this.assetProvider = assetProvider;
        this.config = config;
        this.status = status;
        this.minValue = minValue;
        this.maxValue = maxValue;
        this.progress = progress;
        this.registry = registry;
    }
}
