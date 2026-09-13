import type {IVariableFxRendererPrebake} from '../../IVariableFxRendererPrebake';
import type {VariableFxConfigData} from '../../VariableFxConfigData';
import {VariableFxRendererPrebakeCache} from '../../VariableFxRendererPrebakeCache';
import type {LevelBadgePainter} from './LevelBadgePainter';

/**
 * What a level-with-progress config owns: its badge painter, and the config it invents for the
 * progress bar nested inside it.
 *
 * That second one is the reason this class exists rather than the painter being stored directly.
 * The nested bar is a whole renderer with a whole config of its own, and its prebakes live in the
 * same global cache keyed by config — so the synthetic config has to be created ONCE and reused,
 * or every level badge in the room would seed a separate entry for a bar they all share. Disposing
 * it has to reach into the cache and drop that entry too, which is what the `disposeConfigPrebake`
 * call is for.
 *
 * `disposed` is public and checked by the renderer before every update: a renderer can outlive its
 * config prebake when a config is replaced mid-room, and drawing against a freed painter is the
 * failure that guard prevents.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/renderers/level/LevelWithProgressConfigPrebake.as
 */
export class LevelWithProgressConfigPrebake implements IVariableFxRendererPrebake
{
    // AS3: .../renderers/level/LevelWithProgressConfigPrebake.as::badgePainter
    badgePainter: LevelBadgePainter | null;

    // AS3: .../renderers/level/LevelWithProgressConfigPrebake.as::disposed
    disposed: boolean = false;

    // AS3: .../renderers/level/LevelWithProgressConfigPrebake.as::_progressRendererConfig
    private _progressRendererConfig: VariableFxConfigData | null = null;

    // AS3: .../renderers/level/LevelWithProgressConfigPrebake.as::LevelWithProgressConfigPrebake()
    constructor(badgePainter: LevelBadgePainter)
    {
        this.badgePainter = badgePainter;
    }

    // AS3: .../renderers/level/LevelWithProgressConfigPrebake.as::getOrCreateProgressRendererConfig()
    getOrCreateProgressRendererConfig(create: () => VariableFxConfigData): VariableFxConfigData
    {
        if(this._progressRendererConfig === null) this._progressRendererConfig = create();

        return this._progressRendererConfig;
    }

    // AS3: .../renderers/level/LevelWithProgressConfigPrebake.as::dispose()
    dispose(): void
    {
        if(this.disposed) return;

        this.disposed = true;

        if(this.badgePainter !== null) this.badgePainter.dispose();

        if(this._progressRendererConfig !== null)
        {
            VariableFxRendererPrebakeCache.disposeConfigPrebake(this._progressRendererConfig);

            this._progressRendererConfig = null;
        }
    }
}
