import type {IVariableFxAssetProvider} from './IVariableFxAssetProvider';
import type {VariableFxRendererFactory} from './IVariableFxRenderer';
import {VariableFxRendererMappingParser, type IVariableFxRendererMapping} from './VariableFxRendererMappingParser';
import {ArrowProgressBarRenderer} from './renderers/bar/ArrowProgressBarRenderer';
import {BlockProgressBarRenderer} from './renderers/bar/BlockProgressBarRenderer';
import {BossHealthBarRenderer} from './renderers/bar/BossHealthBarRenderer';
import {ClassicMiniProgressBarRenderer} from './renderers/bar/ClassicMiniProgressBarRenderer';
import {ClassicProgressBarRenderer} from './renderers/bar/ClassicProgressBarRenderer';
import {HealthProgressBarRenderer} from './renderers/bar/HealthProgressBarRenderer';
import {MaskedHeartFillRenderer} from './renderers/bar/MaskedHeartFillRenderer';
import {StripedProgressBarRenderer} from './renderers/bar/StripedProgressBarRenderer';
import {ThermometerHealthPointsRenderer} from './renderers/bar/ThermometerHealthPointsRenderer';
import {StackedHealthPointsRenderer} from './renderers/healthpoints/StackedHealthPointsRenderer';
import {LevelDetailsRenderer} from './renderers/level/LevelDetailsRenderer';
import {LevelWithProgressRenderer} from './renderers/level/LevelWithProgressRenderer';
import {BakedColorNumberDisplayRenderer} from './renderers/number/BakedColorNumberDisplayRenderer';
import {RecolorableNumberDisplayRenderer} from './renderers/number/RecolorableNumberDisplayRenderer';

/** One `(category, style)` entry of the fallback table. */
interface IVariableFxRendererBinding
{
    category: string;
    style: string | null;
    create: VariableFxRendererFactory;
}

/**
 * Which renderer class draws a given config, by two independent routes.
 *
 * The server's `rendererId` is tried first and is the normal answer. The `(category, style)` table
 * is the fallback for a config that carries no renderer id — and within it, an exact style match
 * wins over the category's catch-all entry, which is what lets a category declare a default and
 * then override it per style.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/VariableFxRendererRegistry.as
 */
export class VariableFxRendererRegistry
{
    // AS3: .../variablefx/VariableFxRendererRegistry.as::_bindings (name derived)
    private _bindings: IVariableFxRendererBinding[] = [];

    // AS3: .../variablefx/VariableFxRendererRegistry.as::_rendererFactories
    private _rendererFactories: Map<string, VariableFxRendererFactory> = new Map();

    // AS3: .../variablefx/VariableFxRendererRegistry.as::_serverRendererFactories
    private _serverRendererFactories: Map<number, VariableFxRendererFactory> = new Map();

    /**
     * The registry the client actually runs with: all 14 renderer classes, the fallback table, and
     * the server's own id mapping bound on top.
     *
     * The order is load-bearing. Factories are registered by CLASS NAME first, because both of the
     * things that follow look them up by name — the `(category, style)` table below, and
     * `registerRendererMappings()`, which is what turns the server's numeric renderer ids into
     * factories. Registering a binding before its factory exists would silently bind nothing.
     *
     * `rendererMappingsXml` is normally null and the mapping is fetched from the asset library; the
     * parameter exists so a test can supply one without an asset provider.
     */
    // AS3: .../variablefx/VariableFxRendererRegistry.as::createDefault()
    static createDefault(
        assetProvider: IVariableFxAssetProvider,
        rendererMappingsXml: Document | null = null
    ): VariableFxRendererRegistry
    {
        const registry = new VariableFxRendererRegistry();

        registry.registerRendererFactory('ArrowProgressBarRenderer', (c) => new ArrowProgressBarRenderer(c));
        registry.registerRendererFactory('BakedColorNumberDisplayRenderer', (c) => new BakedColorNumberDisplayRenderer(c));
        registry.registerRendererFactory('BlockProgressBarRenderer', (c) => new BlockProgressBarRenderer(c));
        registry.registerRendererFactory('BossHealthBarRenderer', (c) => new BossHealthBarRenderer(c));
        registry.registerRendererFactory('ClassicMiniProgressBarRenderer', (c) => new ClassicMiniProgressBarRenderer(c));
        registry.registerRendererFactory('ClassicProgressBarRenderer', (c) => new ClassicProgressBarRenderer(c));
        registry.registerRendererFactory('HealthProgressBarRenderer', (c) => new HealthProgressBarRenderer(c));
        registry.registerRendererFactory('LevelDetailsRenderer', (c) => new LevelDetailsRenderer(c));
        registry.registerRendererFactory('LevelWithProgressRenderer', (c) => new LevelWithProgressRenderer(c));
        registry.registerRendererFactory('MaskedHeartFillRenderer', (c) => new MaskedHeartFillRenderer(c));
        registry.registerRendererFactory('RecolorableNumberDisplayRenderer', (c) => new RecolorableNumberDisplayRenderer(c));
        registry.registerRendererFactory('StackedHealthPointsRenderer', (c) => new StackedHealthPointsRenderer(c));
        registry.registerRendererFactory('StripedProgressBarRenderer', (c) => new StripedProgressBarRenderer(c));
        registry.registerRendererFactory('ThermometerHealthPointsRenderer', (c) => new ThermometerHealthPointsRenderer(c));

        // Three bars serve two categories each: `progress_bar` and `status_bar` differ in what the
        // wired variable means, not in how it is drawn.
        registry.register('progress_bar', 'classic_progress', registry.getRendererFactory('ClassicProgressBarRenderer'));
        registry.register('progress_bar', 'classic_mini_progress', registry.getRendererFactory('ClassicMiniProgressBarRenderer'));
        registry.register('progress_bar', 'block_progress', registry.getRendererFactory('BlockProgressBarRenderer'));
        registry.register('progress_bar', 'striped_progress', registry.getRendererFactory('StripedProgressBarRenderer'));
        registry.register('progress_bar', 'arrow_progress', registry.getRendererFactory('ArrowProgressBarRenderer'));
        registry.register('status_bar', 'block_progress', registry.getRendererFactory('BlockProgressBarRenderer'));
        registry.register('status_bar', 'striped_progress', registry.getRendererFactory('StripedProgressBarRenderer'));
        registry.register('status_bar', 'arrow_progress', registry.getRendererFactory('ArrowProgressBarRenderer'));
        registry.register('health_points', 'health_progress', registry.getRendererFactory('HealthProgressBarRenderer'));
        registry.register('health_points', 'masked_heart_fill', registry.getRendererFactory('MaskedHeartFillRenderer'));
        registry.register('health_points', 'stacked_health_points', registry.getRendererFactory('StackedHealthPointsRenderer'));
        registry.register('health_points', 'thermometer_health_points', registry.getRendererFactory('ThermometerHealthPointsRenderer'));
        registry.register('levelling_progress', 'level_with_progress', registry.getRendererFactory('LevelWithProgressRenderer'));
        registry.register('levelling_progress', 'level_with_bar_and_numerical_progress', registry.getRendererFactory('LevelDetailsRenderer'));
        registry.register('boss_bar', 'boss_health_bar', registry.getRendererFactory('BossHealthBarRenderer'));
        registry.register('number_display', 'number_recolorable', registry.getRendererFactory('RecolorableNumberDisplayRenderer'));
        registry.register('number_display', 'number_baked_colors', registry.getRendererFactory('BakedColorNumberDisplayRenderer'));

        const xml = rendererMappingsXml ?? assetProvider.getXml('variablefx_renderer_mapping');

        registry.registerRendererMappings(VariableFxRendererMappingParser.parse(xml));

        return registry;
    }

    // AS3: .../variablefx/VariableFxRendererRegistry.as::register()
    register(category: string, style: string | null, create: VariableFxRendererFactory | null): void
    {
        // AS3 pushes whatever `_rendererFactories[name]` gave it, undefined included, and a binding
        // with no factory would then resolve to one. Dropped here instead.
        if(create === null) return;

        this._bindings.push({category, style, create});
    }

    // AS3: .../variablefx/VariableFxRendererRegistry.as::registerRendererFactory()
    registerRendererFactory(rendererClass: string, create: VariableFxRendererFactory): void
    {
        this._rendererFactories.set(rendererClass, create);
    }

    // AS3: .../variablefx/VariableFxRendererRegistry.as::getRendererFactory() (name derived)
    //   AS3 reads `_rendererFactories[name]` inline at each call site; one accessor says it once.
    getRendererFactory(rendererClass: string): VariableFxRendererFactory | null
    {
        return this._rendererFactories.get(rendererClass) ?? null;
    }

    /**
     * Binds each server renderer id to the factory its class name names.
     *
     * Throws on a class this build has no factory for, exactly as AS3 does. That is deliberate and
     * worth keeping: the mapping has already been filtered by
     * `VariableFxRendererMappingParser.parse()` to ids this client knows, so reaching here with an
     * unregistered class means the registry itself is incomplete — a build problem, not a data one.
     */
    // AS3: .../variablefx/VariableFxRendererRegistry.as::registerRendererMappings()
    registerRendererMappings(mappings: IVariableFxRendererMapping[]): void
    {
        for(const mapping of mappings)
        {
            const create = this._rendererFactories.get(mapping.rendererClass);

            if(create === undefined)
            {
                throw new Error(`No Variable FX renderer factory registered for class '${mapping.rendererClass}'.`);
            }

            this._serverRendererFactories.set(mapping.rendererId, create);
        }
    }

    // AS3: .../variablefx/VariableFxRendererRegistry.as::resolve()
    resolve(category: string, style: string | null = null): VariableFxRendererFactory | null
    {
        if(style !== null)
        {
            for(const binding of this._bindings)
            {
                if(binding.category === category && binding.style === style) return binding.create;
            }
        }

        // The category's catch-all, reached both when no style was asked for and when the asked-for
        // style has no entry of its own.
        for(const binding of this._bindings)
        {
            if(binding.category === category && binding.style === null) return binding.create;
        }

        return null;
    }

    // AS3: .../variablefx/VariableFxRendererRegistry.as::resolveByServerRenderer()
    resolveByServerRenderer(rendererId: number): VariableFxRendererFactory | null
    {
        return this._serverRendererFactories.get(rendererId) ?? null;
    }
}
