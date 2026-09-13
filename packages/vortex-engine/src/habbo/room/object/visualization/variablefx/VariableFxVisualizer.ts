import type {IVariableFxAssetProvider} from './IVariableFxAssetProvider';
import type {IVariableFxRenderer} from './IVariableFxRenderer';
import type {IVariableFxRendererPrebake} from './IVariableFxRendererPrebake';
import type {VariableFxConfigData} from './VariableFxConfigData';
import type {VariableFxFrame} from './VariableFxFrame';
import type {VariableFxRendererRegistry} from './VariableFxRendererRegistry';
import {VariableFxRendererContext} from './VariableFxRendererContext';
import type {VariableFxStatusData} from './VariableFxStatusData';

/**
 * One effect being drawn: binds a config and a live status to the renderer that draws them, and
 * owns the frame that comes out.
 *
 * The renderer is chosen once, at construction, and a config that names none is an error rather
 * than a blank — AS3 throws, and so does this, because a config arriving with an unknown renderer
 * is a client/server mismatch that silence would bury.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/VariableFxVisualizer.as
 */
export class VariableFxVisualizer
{
    // AS3: .../variablefx/VariableFxVisualizer.as::_assetProvider (name derived)
    private _assetProvider: IVariableFxAssetProvider;

    // AS3: .../variablefx/VariableFxVisualizer.as::_config
    private _config: VariableFxConfigData;

    // AS3: .../variablefx/VariableFxVisualizer.as::_status
    private _status: VariableFxStatusData;

    // AS3: .../variablefx/VariableFxVisualizer.as::_context
    private _context: VariableFxRendererContext;

    // AS3: .../variablefx/VariableFxVisualizer.as::_registry
    private _registry: VariableFxRendererRegistry;

    // AS3: .../variablefx/VariableFxVisualizer.as::_renderer (name derived)
    private _renderer: IVariableFxRenderer;

    /**
     * The prebake the renderer was built against. Kept for identity only — see
     * {@link isRendererPrebakeStale}.
     */
    // AS3: .../variablefx/VariableFxVisualizer.as::_prebake (name derived)
    private _prebake: IVariableFxRendererPrebake | null;

    // AS3: .../variablefx/VariableFxVisualizer.as::_requiresAnimationTick (name derived)
    private _requiresAnimationTick: boolean = true;

    // AS3: .../variablefx/VariableFxVisualizer.as::VariableFxVisualizer()
    constructor(
        config: VariableFxConfigData,
        status: VariableFxStatusData,
        time: number,
        assetProvider: IVariableFxAssetProvider,
        registry: VariableFxRendererRegistry
    )
    {
        this._config = config;
        this._status = status;
        this._assetProvider = assetProvider;
        this._registry = registry;
        this._context = this.createContext();

        const create = this.resolveRendererFactory(config);

        if(create === null) throw new Error(VariableFxVisualizer.createMissingRendererMessage(config));

        this._renderer = create(this._context);
        this._prebake = config.prebake;
        this._renderer.updateData(this._context, time);
    }

    // AS3: .../variablefx/VariableFxVisualizer.as::get frame()
    get frame(): VariableFxFrame
    {
        return this._renderer.frame;
    }

    // AS3: .../variablefx/VariableFxVisualizer.as::get requiresAnimationTick()
    get requiresAnimationTick(): boolean
    {
        return this._requiresAnimationTick;
    }

    // AS3: .../variablefx/VariableFxVisualizer.as::updateData()
    updateData(status: VariableFxStatusData, time: number): void
    {
        this._status = status;
        this._context = this.createContext();
        this._requiresAnimationTick = true;
        this._renderer.updateData(this._context, time);
    }

    // AS3: .../variablefx/VariableFxVisualizer.as::needsUpdate()
    needsUpdate(time: number): boolean
    {
        if(this.isRendererPrebakeStale())
        {
            this._requiresAnimationTick = false;

            return false;
        }

        const needed = this._renderer.needsUpdate(time);

        this._requiresAnimationTick = needed || this._renderer.isContinuous;

        return needed;
    }

    // AS3: .../variablefx/VariableFxVisualizer.as::update()
    update(time: number): boolean
    {
        if(this.isRendererPrebakeStale())
        {
            this._requiresAnimationTick = false;

            return false;
        }

        const updated = this._renderer.update(time);

        // Asks the renderer again after updating: a renderer that is neither continuous nor done
        // still gets ticked next frame.
        this._requiresAnimationTick = updated || this._renderer.isContinuous || this._renderer.needsUpdate(time);

        return updated;
    }

    /**
     * Resolves the bounds in force and reduces the value to the 0..1 the renderers draw.
     */
    // AS3: .../variablefx/VariableFxVisualizer.as::createContext()
    private createContext(): VariableFxRendererContext
    {
        const min = this._status.effectiveOverrideMinValue ?? this._config.defaultMinValue;
        const max = this._status.effectiveOverrideMaxValue ?? this._config.defaultMaxValue;

        return new VariableFxRendererContext(
            this._assetProvider,
            this._config,
            this._status,
            min,
            max,
            VariableFxVisualizer.calculateProgress(this._status.value, min, max),
            this._registry
        );
    }

    // AS3: .../variablefx/VariableFxVisualizer.as::resolveRendererFactory()
    private resolveRendererFactory(config: VariableFxConfigData): ReturnType<VariableFxRendererRegistry['resolveByServerRenderer']>
    {
        if(config.rendererId >= 0)
        {
            const byServer = this._registry.resolveByServerRenderer(config.rendererId);

            if(byServer !== null) return byServer;
        }

        return this._registry.resolve(config.category, config.renderer);
    }

    // AS3: .../variablefx/VariableFxVisualizer.as::createMissingRendererMessage()
    private static createMissingRendererMessage(config: VariableFxConfigData): string
    {
        if(config.rendererId >= 0)
        {
            return `No Variable FX renderer registered for server renderer id '${config.rendererId}'.`;
        }

        return `No Variable FX renderer registered for category '${config.category}' and renderer '${config.renderer}'.`;
    }

    /**
     * True once the config's prebaked artwork has been replaced under this visualizer — the
     * renderer is still holding the old one, so it must stop rather than draw from freed art. Only
     * meaningful when there was a prebake to begin with.
     */
    // AS3: .../variablefx/VariableFxVisualizer.as::isRendererPrebakeStale()
    private isRendererPrebakeStale(): boolean
    {
        return this._prebake !== null && this._config.prebake !== this._prebake;
    }

    /**
     * Guards every way the bounds can be unusable — non-finite, or equal, which would divide by
     * zero — and answers 0 rather than NaN, which would blank the effect silently.
     */
    // AS3: .../variablefx/VariableFxVisualizer.as::calculateProgress()
    private static calculateProgress(value: number, min: number, max: number): number
    {
        if(!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max) || max === min) return 0;

        return Math.max(0, Math.min(1, (value - min) / (max - min)));
    }

    // AS3: .../variablefx/VariableFxVisualizer.as::dispose()
    dispose(): void
    {
        this._renderer.dispose();
    }
}
