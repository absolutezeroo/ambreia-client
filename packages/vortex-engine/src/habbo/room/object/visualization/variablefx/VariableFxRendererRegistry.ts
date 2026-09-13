import type {VariableFxRendererFactory} from './IVariableFxRenderer';
import type {IVariableFxRendererMapping} from './VariableFxRendererMappingParser';

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
