import {EventEmitter} from 'eventemitter3';
import {getIIDName, type IID} from './IID';
import type {IDisposable} from '@ambreia/common/IDisposable';
import type {IContext, InterfaceCallback, IUpdateReceiver} from './IContext';
import type {ComponentDependency} from './ComponentDependency';
import {LockEvent} from './events/LockEvent';
import type {AssetLoaderStruct} from '@ambreia/common/assets/AssetLoaderStruct';
import type {IAsset} from '@ambreia/common/assets/IAsset';
import type {IAssetLibrary} from '@ambreia/common/assets/IAssetLibrary';
import {Logger} from '@ambreia/common/utils/Logger';

const log = Logger.getLogger('core.runtime.Component');

/**
 * Helper to check if an object has an `events` property that is an EventEmitter
 */
function hasEvents(obj: unknown): obj is { events: EventEmitter }
{
    return obj !== null && typeof obj === 'object' && 'events' in obj && typeof (obj as {
        events: unknown
    }).events === 'object';
}

/**
 * Helper to check if an object has a `release` method
 */
function hasRelease(obj: unknown): obj is { release: (iid: IID) => void }
{
    return obj !== null && typeof obj === 'object' && 'release' in obj && typeof (obj as {
        release: unknown
    }).release === 'function';
}

/**
 * Component Events
 */
export const ComponentEvents = {
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_50.as::COMPONENT_EVENT_RUNNING
    RUNNING: 'component:running',
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_50.as::COMPONENT_EVENT_DISPOSING
    DISPOSING: 'component:disposing',
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_50.as::COMPONENT_EVENT_UNLOCKED
    // Public: re-dispatched on the root context (see ComponentContext.onComponentUnlocked()) when
    // ANY attached component unlocks - distinct from the per-component internal signal below.
    UNLOCKED: 'component:unlocked',
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_50.as::INTERNAL_EVENT_UNLOCKED
    // Protected: fired by unlock() on the component's own emitter only, consumed solely by the
    // context that attached it (ComponentContext.attachComponent()'s per-component listener). Kept
    // distinct from UNLOCKED above so a Component that is itself a nested Context does not
    // conflate "my parent unlocked me" with "one of my own children unlocked" on the same emitter.
    INTERNAL_UNLOCKED: 'component:internal-unlocked',
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_50.as::COMPONENT_EVENT_ERROR
    ERROR: 'component:error',
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_50.as::COMPONENT_EVENT_WARNING
    WARNING: 'component:warning',
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_50.as::COMPONENT_EVENT_DEBUG
    DEBUG: 'component:debug',
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_50.as::COMPONENT_EVENT_REBOOT
    // Only ever dispatched by the root context (CoreComponentContext) in AS3, though declared here
    // for API completeness. CoreComponentContext.ts uses its own locally-typed
    // CoreComponentContextEvents.REBOOT for the actual dispatch, not this constant.
    REBOOT: 'component:reboot',
} as const;

/**
 * Component Flags
 *
 * A bit set, not an enum: a context that owns disposable interfaces carries CONTEXT|DISPOSABLE.
 */
export const ComponentFlags = {
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_50.as::COMPONENT_FLAG_NULL
    NULL: 0,
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_50.as::COMPONENT_FLAG_INTERFACE
    INTERFACE: 1,
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_50.as::COMPONENT_FLAG_CONTEXT
    CONTEXT: 2,
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_50.as::COMPONENT_FLAG_DISPOSABLE
    DISPOSABLE: 4,
} as const;

/**
 * Interface struct for tracking provided interfaces
 */
interface IInterfaceStruct<T = unknown>
{
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_50.as::iid
    iid: IID<T>;
    instance: unknown;
    references: number;
}

/**
 * Component
 *
 * Based on AS3: com.sulake.core.runtime.Component
 *
 * Base class for all managers and services. Provides:
 * - Dependency injection via `dependencies` getter
 * - Lifecycle management (init, dispose)
 * - Lock/unlock mechanism for async dependency resolution
 * - Event emission
 *
 * @example
 * ```typescript
 * class NavigatorManager extends Component
 * {
 *     private _communicationManager: ICommunicationManager | null = null;
 *     private _configurationManager: IConfigurationManager | null = null;
 *
 *     protected get dependencies(): ComponentDependency[]
 *     {
 *         return [
 *             new ComponentDependency(
 *                 IID_CommunicationManager,
 *                 (m) => this._communicationManager = m,
 *                 true
 *             ),
 *             new ComponentDependency(
 *                 IID_ConfigurationManager,
 *                 (m) => this._configurationManager = m,
 *                 true
 *             ),
 *         ];
 *     }
 *
 *     protected initComponent(): void
 *     {
 *         // All dependencies are now available
 *         this._communicationManager!.addMessageEvent(...);
 *     }
 * }
 * ```
 */
export class Component implements IDisposable
{
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_50.as::_lastError
    protected _lastError: string = '';
    protected _lastWarning: string = '';
    protected _lastDebug: string = '';
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_50.as::_context
    private readonly _context: IContext;
    private readonly _events: EventEmitter;
    private readonly _interfaces: Map<symbol, IInterfaceStruct> = new Map();
    private readonly _cleanupFunctions: Array<() => void> = [];
    private _requiredDependenciesCount: number = 1; // Start at 1, decremented after all deps queued
    private _pendingDependencies: Set<string> = new Set();
    private _constructionComplete: boolean = false;
    /**
     * The required dependencies still unresolved, by IID name.
     *
     * Filled from `dependencies` while they are queued, and spliced as each one resolves — AS3
     * does exactly that in `allDependenciesRequested()`, which is why the getter's name says
     * "required" but its content shrinks. `pendingDependencyIids` below holds the same names in
     * a Set; both are kept because AS3 declares this one and callers may hold either.
     */
    // Name DERIVED: AS3's backing field is obfuscated; only the getter at l.351 is readable, so
    // the field is named after it.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_50.as::get requiredDependencyIids()
    private readonly _requiredDependencyIids: string[] = [];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_50.as::get requiredDependencyIids()
    get requiredDependencyIids(): string[]
    {
        return this._requiredDependencyIids;
    }

    // DEVIATION: AS3's `static getInterfaceStructList(component)` is not a debug accessor —
    //   ComponentContext reaches into each component's private list through it
    //   (insert/find/mapStructsByImplementor) as the real storage for interface registration.
    //   This port keeps that in ComponentContext's own `_interfaceQueues`, so there is no
    //   per-component list to hand out. `toXMLString()` below reads this component's own
    //   `_interfaces` map instead, which holds the same iid/reference pairs.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_50.as::getInterfaceStructList()

    /**
     * This component's registered interfaces as an XML fragment, for debugging.
     *
     * AS3 walks its InterfaceStructList; this walks the equivalent `_interfaces` map, which
     * carries the same iid and reference count per entry.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_50.as::toXMLString()
    toXMLString(indent: number = 0): string
    {
        const pad = '\t'.repeat(indent);

        let xml = `${pad}<component class="${this.constructor.name}">\n`;

        for(const struct of this._interfaces.values())
        {
            xml += `${pad}\t<interface iid="${getIIDName(struct.iid)}" refs="${struct.references}"/>\n`;
        }

        return `${xml}${pad}</component>\n`;
    }

    constructor(context: IContext, flags: number = 0, assetLibrary: IAssetLibrary | null = null)
    {
        this._context = context;
        this._flags = flags;
        this._events = new EventEmitter();
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_50.as::_SafeCls_50()
        // AS3 defaults to `param3 ?? new AssetLibrary('_internal_asset_library')`, so
        // `assets` is never null there. This port cannot default the same way: AssetLibrary extends
        // Component here (AS3's extends EventDispatcherWrapper directly, no such cycle), so
        // constructing one here would itself construct another for ITS OWN `_assets` field,
        // recursing forever. Left nullable deliberately; findAssetByName()/hasAsset()/
        // loadAssetFromFile() below already degrade to null/false rather than throw.
        this._assets = assetLibrary;

        // Allow null context for ComponentContext (CONTEXT flag), which sets itself as context after super()
        if(!this._context && !(flags & ComponentFlags.CONTEXT))
        {
            throw new Error(`[Component] IContext not provided to ${this.constructor.name}`);
        }

        // Get dependencies and set up injection
        const deps = this.dependencies;

        if(deps.length > 0)
        {
            this.lock();
        }

        // Queue all dependencies
        for(const dep of deps)
        {
            if(dep.required)
            {
                this._requiredDependenciesCount++;
                this._pendingDependencies.add(getIIDName(dep.identifier));
                this._requiredDependencyIids.push(getIIDName(dep.identifier));
            }

            this.injectDependency(dep);
        }

        // All dependencies have been queued
        this.onAllDependenciesQueued();

        // Mark construction as complete (subclass field initializers have NOT run yet, but will before microtask)
        this._constructionComplete = true;
    }

    // AS3: .../src/com/sulake/core/runtime/_SafeCls_50.as::_assets
    private _assets: IAssetLibrary | null = null;

    /**
	 * The asset library for this component
	 */
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_50.as::get assets()
    get assets(): IAssetLibrary | null
    {
        return this._assets;
    }

    protected _flags: number = 0;

    /**
	 * Component flags
	 */
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_50.as::get flags()
    get flags(): number
    {
        return this._flags;
    }

    // AS3: .../src/com/sulake/core/runtime/_SafeCls_50.as::_disposed
    protected _disposed: boolean = false;

    /**
	 * Whether the component has been disposed
	 */
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_50.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    private _locked: boolean = false;

    /**
	 * Whether the component is locked (waiting for dependencies)
	 */
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_50.as::get locked()
    get locked(): boolean
    {
        return this._locked;
    }

    /**
	 * The required dependency IIDs this component is still waiting on, by name.
	 *
	 * A component whose required dependency is never provided stays locked forever and logs
	 * nothing: `initComponent()` simply never runs, so the feature it owns never appears and there
	 * is no error to search for. This is the read side of the boot-time report in
	 * `ComponentContext.describeLockedComponents()`, which turns that silence into a warning.
	 *
	 * The same names `requiredDependencyIids` holds, in a Set rather than an array. Both are
	 * carried because AS3 declares that one and callers may hold either.
	 */
    // TS-only: no AS3 counterpart; diagnostic read of `_pendingDependencies`.
    get pendingDependencyIids(): string[]
    {
        return [...this._pendingDependencies];
    }

    /**
	 * The context this component belongs to
	 */
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_50.as::get context()
    get context(): IContext
    {
        return this._context;
    }

    /**
	 * Event emitter for this component
	 */
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_50.as::get events()
    get events(): EventEmitter
    {
        return this._events;
    }

    /**
	 * Override this to declare component dependencies.
	 * Called during construction.
	 */
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_50.as::get dependencies()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- variance: typed ComponentDependency<T> is contravariant in T
    protected get dependencies(): Array<ComponentDependency<any>>
    {
        return [];
    }

    /**
	 * Whether all required dependencies have been injected
	 */
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_50.as::get allRequiredDependenciesInjected()
    protected get allRequiredDependenciesInjected(): boolean
    {
        return this._requiredDependenciesCount === 0;
    }

    /**
	 * Find an asset by name
	 */
    findAssetByName(name: string): IAsset | null
    {
        return this._assets?.getAssetByName(name) ?? null;
    }

    /**
	 * Remove an asset
	 */
    removeAsset(asset: IAsset): IAsset | null
    {
        return this._assets?.removeAsset(asset) ?? null;
    }

    /**
	 * Load an asset from a file URL
	 */
    loadAssetFromFile(name: string, url: string, mimeType?: string, id: number = -1): AssetLoaderStruct | null
    {
        return this._assets?.loadAssetFromFile(name, url, mimeType, id) ?? null;
    }

    /**
	 * Check if an asset exists
	 */
    hasAsset(name: string): boolean
    {
        return this._assets?.hasAsset(name) ?? false;
    }

    /**
	 * Dispose of this component
	 */
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_50.as::dispose()
    dispose(): void
    {
        if(this._disposed) return;

        // Run cleanup functions
        for(const cleanup of this._cleanupFunctions)
        {
            try
            {
                cleanup();
            }
            catch (e)
            {
                log.error('Cleanup error:', e);
            }
        }
        this._cleanupFunctions.length = 0;

        // Emit disposing event
        this._events.emit(ComponentEvents.DISPOSING);

        // Clear interfaces
        this._interfaces.clear();

        // Clear events
        this._events.removeAllListeners();

        // Dispose assets
        if(this._assets)
        {
            this._assets.dispose();
            this._assets = null;
        }

        this._disposed = true;
        // sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_50.as::dispose()
        // AS3 also sets `_context = null` here. This port's `_context` field is `readonly`, and
        // widening it to `IContext | null` would ripple through every call site that reads
        // `this._context.x` without a null-check (the overwhelming majority) - a change out of
        // proportion to a GC-hygiene detail, especially since every such call site already gates on
        // `disposed` rather than on `_context == null`. Left as a documented deviation.
    }

    /**
	 * Purge cached data (override in subclass if needed)
	 */
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_50.as::purge()
    purge(): void
    {
        // Override in subclass
    }

    /**
	 * Request an interface from the context
	 */
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_50.as::queueInterface()
    queueInterface<T>(iid: IID<T>, callback?: InterfaceCallback<T>): T | null
    {
        // Check if we provide this interface ourselves
        const struct = this._interfaces.get(iid);

        if(struct)
        {
            if(this._disposed)
            {
                throw new Error(`[Component] Cannot queue interface on disposed component: ${this.constructor.name}`);
            }

            if(this._locked)
            {
                return null;
            }

            struct.references++;
            const instance = struct.instance as T;

            if(callback)
            {
                callback(iid, instance);
            }

            return instance;
        }

        // Delegate to context
        return this._context.queueInterface(iid, callback);
    }

    /**
	 * Release a reference to an interface
	 */
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_50.as::release()
    release(iid: IID): number
    {
        if(this._disposed) return 0;

        const struct = this._interfaces.get(iid);

        if(!struct)
        {
            throw new Error(`[Component] Attempting to release unknown interface: ${getIIDName(iid)}`);
        }

        struct.references--;

        // Auto-dispose if disposable flag set and no more references
        if((this._flags & ComponentFlags.DISPOSABLE) && struct.references === 0)
        {
            const totalRefs = Array.from(this._interfaces.values())
                .reduce((sum, s) => sum + s.references, 0);

            if(totalRefs === 0)
            {
                this._context.detachComponent(this);
                this.dispose();
            }
        }

        return struct.references;
    }

    // DEVIATION: AS3's component-wide `_references` counter is not reproduced, because it counts
    //   nothing: the field is reset to 0 in dispose() and printed by toString(), and nothing ever
    //   increments it. The count actually kept is per-interface (`IInterfaceStruct.references`),
    //   which is what the total above sums. A faithful field here would be a permanent zero.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_50.as::_references

    /**
	 * Register an interface that this component provides
	 */
    registerInterface<T>(iid: IID<T>, instance: T): void
    {
        this._interfaces.set(iid, {
            iid,
            instance,
            references: 0,
        });
    }

    /**
	 * Get all interfaces this component provides
	 */
    getProvidedInterfaces(): IID[]
    {
        return Array.from(this._interfaces.keys());
    }

    /**
	 * Check if a configuration property exists
	 */
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_50.as::propertyExists()
    propertyExists(key: string): boolean
    {
        return this._context.configuration?.propertyExists(key) ?? false;
    }

    /**
	 * Get a configuration property
	 */
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_50.as::getProperty()
    getProperty(key: string, params?: Record<string, string>): string
    {
        return this._context.configuration?.getProperty(key, params) ?? '';
    }

    /**
	 * Set a configuration property
	 */
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_50.as::setProperty()
    setProperty(key: string, value: string, persistent?: boolean, log?: boolean): void
    {
        this._context.configuration?.setProperty(key, value, persistent, log);
    }

    /**
	 * Get a boolean configuration property
	 */
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_50.as::getBoolean()
    getBoolean(key: string): boolean
    {
        return this._context.configuration?.getBoolean(key) ?? false;
    }

    /**
	 * Get an integer configuration property
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_50.as::getInteger()
    // AS3's fallback when configuration is absent is the fixed 0, not the caller's defaultValue
    // (same fixed-fallback shape as getBoolean()/getProperty() above) - defaultValue only applies
    // once configuration exists but the key itself is missing, inside getInteger() below.
    getInteger(key: string, defaultValue: number): number
    {
        return this._context.configuration?.getInteger(key, defaultValue) ?? 0;
    }

    /**
	 * Interpolate ${...} configuration references in a string
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_50.as::interpolate()
    interpolate(value: string): string
    {
        return this._context.configuration?.interpolate(value) ?? '';
    }

    /**
	 * Rewrite a URL's protocol via the configuration manager
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_50.as::updateUrlProtocol()
    updateUrlProtocol(url: string): string
    {
        return this._context.configuration?.updateUrlProtocol(url) ?? '';
    }

    /**
	 * Register this component to receive updates
	 */
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_50.as::registerUpdateReceiver()
    registerUpdateReceiver(receiver: IUpdateReceiver, priority: number): void
    {
        if(!this._disposed)
        {
            this._context.registerUpdateReceiver(receiver, priority);
        }
    }

    /**
	 * Remove this component from update receivers
	 */
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_50.as::removeUpdateReceiver()
    removeUpdateReceiver(receiver: IUpdateReceiver): void
    {
        if(!this._disposed)
        {
            this._context.removeUpdateReceiver(receiver);
        }
    }

    /**
	 * String representation
	 */
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_50.as::toString()
    toString(): string
    {
        return `[Component ${this.constructor.name}]`;
    }

    /**
	 * Called when all required dependencies have been injected.
	 * Override this to perform initialization that requires dependencies.
	 */
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_50.as::initComponent()
    protected initComponent(): void
    {
        // Override in subclass
    }

    /**
	 * Lock the component (waiting for dependencies)
	 */
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_50.as::lock()
    protected lock(): void
    {
        if(!this._locked)
        {
            this._locked = true;
        }
    }

    /**
	 * Unlock the component (all dependencies resolved)
	 */
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_50.as::unlock()
    protected unlock(): void
    {
        if(this._locked)
        {
            this._locked = false;

            // AS3 dispatches `new LockEvent("_INTERNAL_EVENT_UNLOCKED", this)`, and its context
            // reads the component back off `unknown`. This port's context closes over the component
            // instead, so the payload is the event AS3 sends *and* the component AS3's handler digs
            // out of it — both spellings work for a listener.
            this._events.emit(
                ComponentEvents.INTERNAL_UNLOCKED,
                this,
                new LockEvent(ComponentEvents.INTERNAL_UNLOCKED, this)
            );
        }
    }

    /**
	 * Inject a single dependency
	 */
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_50.as::injectDependency()
    private injectDependency(dep: ComponentDependency): void
    {
        const callback = this.createDependencyCallback(dep);

        this.queueInterface(dep.identifier, callback);
    }

    /**
	 * Create a callback for when a dependency is resolved
	 */
    private createDependencyCallback<T>(dep: ComponentDependency<T>): InterfaceCallback<T>
    {
        return (iid: IID<T>, instance: T) =>
        {
            // If called during construction (before field initializers run),
            // defer to a microtask. Otherwise field initializers will overwrite
            // the value we set here.
            if(!this._constructionComplete)
            {
                queueMicrotask(() => this.applyDependency(dep, iid, instance));
                return;
            }

            this.applyDependency(dep, iid, instance);
        };
    }

    /**
	 * Apply a resolved dependency
	 */
    private applyDependency<T>(dep: ComponentDependency<T>, iid: IID<T>, instance: T): void
    {
        if(this._disposed) return;

        // Call setter
        if(dep.setter)
        {
            dep.setter(instance);
        }

        // Attach event listeners
        if(dep.eventListeners && hasEvents(instance))
        {
            for(const listener of dep.eventListeners)
            {
                instance.events.on(listener.type, listener.callback);
            }
        }

        // Create cleanup function
        this._cleanupFunctions.push(
            this.createCleanupFunction(dep, instance)
        );

        // Track required dependency resolution
        if(dep.required)
        {
            const iidName = getIIDName(dep.identifier);
            this._pendingDependencies.delete(iidName);

            // AS3 splices the same name out of its own list here, inside
            // allDependenciesRequested() — see `requiredDependencyIids`.
            const index = this._requiredDependencyIids.indexOf(iidName);

            if(index > -1) this._requiredDependencyIids.splice(index, 1);

            this.onAllDependenciesQueued(iidName);
        }
    }

    /**
	 * Create a cleanup function for a dependency
	 */
    private createCleanupFunction<T>(dep: ComponentDependency<T>, instance: T): () => void
    {
        return () =>
        {
            // Remove event listeners
            if(dep.eventListeners && hasEvents(instance))
            {
                for(const listener of dep.eventListeners)
                {
                    instance.events.off(listener.type, listener.callback);
                }
            }

            // Clear setter
            if(dep.setter)
            {
                dep.setter(null);
            }

            // Release interface
            if(hasRelease(instance))
            {
                instance.release(dep.identifier);
            }
        };
    }

    /**
	 * Called when all dependencies have been queued or when a required dependency resolves
	 * @param _resolvedIidName Name of the resolved dependency (for debugging) - currently unused
	 */
    private onAllDependenciesQueued(_resolvedIidName: string = ''): void
    {
        this._requiredDependenciesCount--;

        if(this._requiredDependenciesCount === 0)
        {
            // If construction isn't complete yet, defer initComponent to allow
            // subclass field initializers to complete. In JS/TS, field initializers
            // run AFTER the parent constructor, so we must wait.
            // Note: Dependencies can resolve synchronously during constructor if the
            // provider is already available, which is why we check _constructionComplete.
            if(!this._constructionComplete)
            {
                queueMicrotask(() =>
                {
                    if(this._disposed) return;

                    try
                    {
                        this.initComponent();
                        this.unlock();
                    }
                    catch (e)
                    {
                        log.error(`Error in initComponent for ${this.constructor.name}:`, e);
                        throw e;
                    }
                });
            }
            else
            {
                // Construction is complete - fields are initialized, call synchronously
                try
                {
                    this.initComponent();

                    this.unlock();
                }
                catch (e)
                {
                    log.error(`Error in initComponent for ${this.constructor.name}:`, e);
                    throw e;
                }
            }
        }
    }
}
