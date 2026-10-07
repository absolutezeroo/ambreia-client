import {getIIDName, type IID} from './IID';
import type {IAttachInstanceOptions, IContext, InterfaceCallback, IUpdateReceiver} from './IContext';
import type {ComponentDependency} from './ComponentDependency';
import type {ICoreConfiguration} from './ICoreConfiguration';
import type {ILinkEventTracker} from './events/ILinkEventTracker';
import {Component, ComponentEvents, ComponentFlags} from './Component';
import {Logger} from '@ambreia/common/utils/Logger';

const log = Logger.getLogger('core.runtime.ComponentContext');

/**
 * Interface queue entry
 */
interface IInterfaceQueue<T = unknown>
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/runtime/ComponentContext.as::iid
    iid: IID<T>;
    callbacks: InterfaceCallback<T>[];
}

/**
 * Update receiver entry
 */
interface IUpdateReceiverEntry
{
    receiver: IUpdateReceiver;
    priority: number;
}

/**
 * Component Context
 *
 * Based on AS3: com.sulake.core.runtime.ComponentContext
 *
 * The main container that manages components and their dependencies.
 * Handles interface queuing, component lifecycle, and update distribution.
 *
 * @example
 * ```typescript
 * // Create context
 * const context = new ComponentContext();
 *
 * // Create and attach a component
 * const navigator = new NavigatorManager(context);
 * context.attachComponent(navigator, [IID_Navigator, IID_NewNavigator]);
 *
 * // Other components can now request these interfaces
 * context.queueInterface(IID_Navigator, (iid, nav) => {
 *     console.log('Navigator is ready:', nav);
 * });
 * ```
 */
export class ComponentContext extends Component implements IContext
{
    private readonly _attachedComponents: Component[] = [];
    private readonly _interfaceQueues: Map<symbol, IInterfaceQueue> = new Map();
    private readonly _updateReceivers: IUpdateReceiverEntry[] = [];
    private _updateReceiversDirty: boolean = false;
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_56.as::_linkEventTrackers
    private readonly _linkEventTrackers: ILinkEventTracker[] = [];
    private readonly _unlockHandlers: Map<Component, () => void> = new Map();

    constructor(parentContext?: IContext)
    {
        // Pass self as context if no parent, otherwise pass parent
        // Note: We need to construct Component with a valid context
        // For root context, we'll set it up specially
        super(parentContext ?? (null as unknown as IContext), ComponentFlags.CONTEXT);

        // For root context, we are our own context
        if(!parentContext)
        {
            // @ts-expect-error - Accessing private field for root context setup
            this._context = this;
        }
    }

    private _configuration: ICoreConfiguration | null = null;

    /**
	 * Configuration manager
	 */
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_56.as::get configuration()
    get configuration(): ICoreConfiguration | null
    {
        return this._configuration;
    }

    // AS3: .../src/com/sulake/core/runtime/_SafeCls_56.as::set configuration()
    set configuration(value: ICoreConfiguration | null)
    {
        this._configuration = value;
    }

    /**
	 * Get the root context
	 */
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_56.as::get root()
    get root(): IContext
    {
        if(!this.context || this.context === this)
        {
            return this;
        }
        return this.context.root;
    }

    /**
	 * Request an interface from this context
	 */
    override queueInterface<T>(iid: IID<T>, callback?: InterfaceCallback<T>): T | null
    {
        // First check if a component provides this interface
        for(const component of this._attachedComponents)
        {
            if(component.disposed || component.locked) continue;

            const interfaces = component.getProvidedInterfaces();

            if(interfaces.includes(iid))
            {
                const instance = component.queueInterface(iid, callback);

                if(instance)
                {
                    return instance;
                }
            }
        }

        // Not found - queue the callback
        if(callback)
        {
            this.addToQueue(iid, callback);

            // If we have a parent context, also queue there
            if(this.context && this.context !== this)
            {
                this.context.queueInterface(iid, (resolvedIid, instance) =>
                {
                    this.announceInterfaceAvailability(resolvedIid, instance);
                });
            }
        }

        return null;
    }

    /**
	 * Attach a component to this context
	 */
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_56.as::attachComponent()
    // `instance` is TS-only: see attachInstance().
    /** The attached components, in attach order, with what they provide and whether they wait. */
    // TS-only: boot introspection (J5).
    describeAttached(): Array<{name: string; interfaces: string[]; locked: boolean}>
    {
        return this._attachedComponents.filter(component => !component.disposed).map(component => ({
            name: component.constructor.name,
            interfaces: component.getProvidedInterfaces().map(getIIDName),
            locked: component.locked
        }));
    }

    /** Every IID something in this context provides: its own and its attached components'. */
    // TS-only: the kernel's dependency check (J5).
    providedInterfaces(): Set<IID>
    {
        const provided = new Set<IID>(this.getProvidedInterfaces());

        for(const component of this._attachedComponents)
        {
            if(!component.disposed) for(const iid of component.getProvidedInterfaces()) provided.add(iid);
        }

        return provided;
    }

    attachComponent(component: Component, interfaces: IID[], instance?: unknown): void
    {
        if(this.disposed) return;

        if(this._attachedComponents.includes(component))
        {
            log.warn(`Component ${component} already attached`);

            return;
        }

        // Check if this is a proper Component with registerInterface
        const isProperComponent = typeof component.registerInterface === 'function';

        if(!isProperComponent)
        {
            log.warn('Object does not extend Component, skipping interface registration:', component);
            // Still store it for basic lookup, but can't use full Component features
            return;
        }

        this._attachedComponents.push(component);

        // Register interfaces
        for(const iid of interfaces)
        {
            component.registerInterface(iid, instance ?? component);
        }

        // Listen for unlock event
        if(component.locked)
        {
            const unlockHandler = () =>
            {
                this._unlockHandlers.delete(component);
                this.onComponentUnlocked(component, interfaces);
            };
            this._unlockHandlers.set(component, unlockHandler);
            component.events.once(ComponentEvents.INTERNAL_UNLOCKED, unlockHandler);
        }
        else
        {
            // Component is ready - announce interfaces
            for(const iid of interfaces)
            {
                if(this._interfaceQueues.has(iid))
                {
                    this.announceInterfaceAvailability(iid, component);
                }
            }
        }
    }

    /**
	 * Detach a component from this context
	 */
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_56.as::detachComponent()
    detachComponent(component: Component): void
    {
        const index = this._attachedComponents.indexOf(component);

        if(index > -1)
        {
            this._attachedComponents.splice(index, 1);

            const unlockHandler = this._unlockHandlers.get(component);

            if(unlockHandler)
            {
                component.events.off(ComponentEvents.INTERNAL_UNLOCKED, unlockHandler);
                this._unlockHandlers.delete(component);
            }
        }
    }

    /**
	 * Every component in this context and its child contexts that is still locked, with the
	 * required dependency IIDs it is waiting on.
	 *
	 * A hard dependency on an IID nothing ever provides is this DI container's worst failure mode
	 * precisely because it is not a failure: the component is constructed, attached, and then waits
	 * forever. `initComponent()` never runs, no exception is thrown, nothing is logged, and the
	 * feature it owns is simply absent — which is how the friend bar went missing with a clean
	 * console. Listing the survivors after boot is the whole diagnosis.
	 */
    // TS-only: no AS3 counterpart; diagnostic, see CoreComponentContext's boot-time report.
    describeLockedComponents(): {name: string; pending: string[]}[]
    {
        const locked: {name: string; pending: string[]}[] = [];

        for(const component of this._attachedComponents)
        {
            if(component.locked)
            {
                locked.push({ name: component.constructor.name, pending: component.pendingDependencyIids });
            }

            // A context is itself a component, so a child context's own attached components are
            // not in `_attachedComponents` here. Without this, everything below the root is
            // invisible to the report.
            if(component instanceof ComponentContext)
            {
                locked.push(...component.describeLockedComponents());
            }
        }

        return locked;
    }

    /**
	 * Register an update receiver
	 */
    registerUpdateReceiver(receiver: IUpdateReceiver, priority: number): void
    {
        // Check if already registered
        const existing = this._updateReceivers.find(e => e.receiver === receiver);

        if(existing)
        {
            existing.priority = priority;
        }
        else
        {
            this._updateReceivers.push({receiver, priority});
        }

        this._updateReceiversDirty = true;
    }

    /**
	 * Remove an update receiver
	 */
    removeUpdateReceiver(receiver: IUpdateReceiver): void
    {
        const index = this._updateReceivers.findIndex(e => e.receiver === receiver);

        if(index > -1)
        {
            this._updateReceivers.splice(index, 1);
        }
    }

    /**
	 * Update all receivers
	 */
    update(deltaTime: number): void
    {
        if(this._updateReceiversDirty)
        {
            this._updateReceivers.sort((a, b) => a.priority - b.priority);
            this._updateReceiversDirty = false;
        }

        for(const entry of this._updateReceivers)
        {
            if(!entry.receiver.disposed)
            {
                try
                {
                    entry.receiver.update(deltaTime);
                }
                catch (e)
                {
                    log.error('Update error:', e);
                }
            }
        }
    }

    /**
	 * Add a link event tracker
	 *
	 * @see source_as_win63/core/runtime/ComponentContext.as lines 509-515
	 */
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_56.as::addLinkEventTracker()
    addLinkEventTracker(tracker: ILinkEventTracker): void
    {
        if(this._linkEventTrackers.indexOf(tracker) < 0)
        {
            this._linkEventTrackers.push(tracker);
        }
    }

    /**
	 * Remove a link event tracker
	 *
	 * @see source_as_win63/core/runtime/ComponentContext.as lines 517-524
	 */
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_56.as::removeLinkEventTracker()
    removeLinkEventTracker(tracker: ILinkEventTracker): void
    {
        const index = this._linkEventTrackers.indexOf(tracker);

        if(index > -1)
        {
            this._linkEventTrackers.splice(index, 1);
        }
    }

    /**
	 * Create a link event, routing it to all matching trackers
	 *
	 * @see source_as_win63/core/runtime/ComponentContext.as lines 526-536
	 */
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_56.as::createLinkEvent()
    createLinkEvent(link: string): void
    {
        for(const tracker of this._linkEventTrackers)
        {
            if(tracker.linkPattern.length > 0)
            {
                if(link.substring(0, tracker.linkPattern.length) === tracker.linkPattern)
                {
                    tracker.linkReceived(link);
                }
            }
            else
            {
                tracker.linkReceived(link);
            }
        }
    }

    /**
	 * Log an error.
	 *
	 * @returns whether the error was handled by tearing the context down; always false here, only
	 * CoreComponentContext can return true.
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/runtime/ComponentContext.as::error()
    error(message: string, fatal: boolean = false, code: number = -1, error?: Error): boolean
    {
        this._lastError = message;

        log.error(`Error: ${message}`, error);

        this.events.emit(ComponentEvents.ERROR, {message, fatal, code, error});

        return false;
    }

    /**
	 * Log a warning
	 */
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_56.as::warning()
    warning(message: string): void
    {
        this._lastWarning = message;

        log.warn(message);

        this.events.emit(ComponentEvents.WARNING, message);
    }

    /**
	 * Log a debug message
	 */
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_56.as::debug()
    debug(message: string): void
    {
        this._lastDebug = message;

        this.events.emit(ComponentEvents.DEBUG, message);
    }

    /**
	 * Dispose of this context and all attached components
	 */
    override dispose(): void
    {
        if(this.disposed) return;

        // Dispose all attached components
        while(this._attachedComponents.length > 0)
        {
            const component = this._attachedComponents.pop();

            component?.dispose();
        }

        // Clear queues
        this._interfaceQueues.clear();

        // Clear update receivers
        this._updateReceivers.length = 0;

        // Clear link event trackers
        this._linkEventTrackers.length = 0;

        super.dispose();
    }

    /**
	 * Purge all components
	 */
    override purge(): void
    {
        super.purge();

        for(const component of this._attachedComponents)
        {
            if(component !== this)
            {
                component.purge();
            }
        }
    }

    /**
	 * The last message handed to `debug()`
	 *
	 * AS3 keeps one of each severity so a caller that reacts to `COMPONENT_EVENT_DEBUG` and
	 * friends can read what caused it — the events themselves carry no payload there.
	 */
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_56.as::getLastDebugMessage()
    getLastDebugMessage(): string
    {
        return this._lastDebug;
    }

    // AS3: .../src/com/sulake/core/runtime/_SafeCls_56.as::getLastWarningMessage()
    getLastWarningMessage(): string
    {
        return this._lastWarning;
    }

    // AS3: .../src/com/sulake/core/runtime/_SafeCls_56.as::getLastErrorMessage()
    getLastErrorMessage(): string
    {
        return this._lastError;
    }

    // AS3: .../src/com/sulake/core/runtime/_SafeCls_56.as::get linkEventTrackers()
    get linkEventTrackers(): readonly ILinkEventTracker[]
    {
        return this._linkEventTrackers;
    }

    /**
	 * Hands a manifest to the context's own asset library
	 *
	 * AS3 takes `(XML, Class)` — the second being the embedded resource class the manifest names
	 * assets inside. The port's library takes the parsed manifest and whatever resource the
	 * caller has, which is the same pair one layer of Flash embedding down.
	 */
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_56.as::prepareAssetLibrary()
    prepareAssetLibrary(manifest: object, resourceData: unknown): boolean
    {
        return this.assets?.loadFromResource(manifest, resourceData) ?? false;
    }

    // DEVIATION: not exposed. AS3 returns the `Sprite` every component in the context draws into.
    //   There is no Flash display list here — the port renders through PixiJS off the window
    //   system — so an accessor would have to invent something to return.
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_56.as::get displayObjectContainer()

    // DEVIATION: none of these exist here, because runtime code loading does not. AS3's
    //   loadFromFile(), loadReadyHandler(), loadErrorHandler(), loadDebugHandler(),
    //   removeLibraryLoader() and prepareComponent() pull a component out of a SWF through
    //   `flash.display.Loader` and an `ApplicationDomain`, read its `[Component]` metadata to
    //   register it, and keep the open loaders in `_loaders`. This port's components are imported
    //   and registered by `Vortex.bootstrap()`; there is no SWF and no loader to track.
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_56.as::loadFromFile()

    /**
     * The whole context as an XML fragment: its own interfaces, then every attached component's.
     *
     * AS3 reads its interfaces out of `getInterfaceStructList(this).mapStructsByImplementor()`.
     * The context is a Component here too, so `super.toXMLString()` produces exactly that half —
     * and it walks `_attachedComponents` for the rest, skipping itself as AS3 does.
     */
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_56.as::toXMLString()
    override toXMLString(indent: number = 0): string
    {
        const pad = '\t'.repeat(indent);

        let xml = `${pad}<context class="${this.constructor.name}">\n`;

        // The context's own interfaces, in the <component> wrapper the base emits.
        xml += super.toXMLString(indent + 1);

        for(const component of this._attachedComponents)
        {
            if(component !== (this as unknown as Component)) xml += component.toXMLString(indent + 1);
        }

        return `${xml}${pad}</context>\n`;
    }

    // DEVIATION: `_queuees`, `addQueueeForInterface()`, `hasQueueForInterface()` and
    //   `getQueueForInterface()` are AS3's interface-queue storage. This port keeps the same
    //   information in `_interfaceQueues` (a Map keyed by IID) and reaches it through addToQueue()
    //   below — a different shape of the same mechanism, not missing behaviour.
    // AS3: .../src/com/sulake/core/runtime/_SafeCls_56.as::_queuees

    /**
	 * Get all attached components
	 */
    getAttachedComponents(): readonly Component[]
    {
        return this._attachedComponents;
    }

    /**
	 * Add a callback to the interface queue
	 */
    private addToQueue<T>(iid: IID<T>, callback: InterfaceCallback<T>): void
    {
        let queue = (this._interfaceQueues.get(iid) ?? null) as IInterfaceQueue<T> | null;

        if(!queue)
        {
            queue = {
                iid,
                callbacks: [],
            };
            this._interfaceQueues.set(iid, queue as IInterfaceQueue);
        }

        queue.callbacks.push(callback);
    }

    /**
	 * Called when a component unlocks (all its dependencies resolved)
	 */
    private onComponentUnlocked(component: Component, interfaces: IID[]): void
    {
        if(this.disposed || component.disposed) return;

        // Announce all interfaces this component provides
        for(const iid of interfaces)
        {
            if(this._interfaceQueues.has(iid))
            {
                this.announceInterfaceAvailability(iid, component);
            }
        }

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_56.as::unlockEventHandler()
        // Notify root context - the public COMPONENT_EVENT_UNLOCKED, distinct from the
        // per-component INTERNAL_UNLOCKED signal this handler was itself invoked by.
        this.root.events.emit(ComponentEvents.UNLOCKED, component);
    }

    /**
	 * Announce that an interface is now available
	 */
    // TS-only: the DI wrapper of an engine package (spec §3 rule 1). The package's object is a plain
    //   class; a bare carrier Component holds it under `iid`, and every request receives the object
    //   (announceInterfaceAvailability() reads it back through the carrier's queueInterface()).
    attachInstance<T>(iid: IID<T>, instance: T, options: IAttachInstanceOptions = {}): void
    {
        const dependencies = options.dependencies ?? [];

        // Component reads `dependencies` in its constructor, before a subclass field exists, so the
        // carrier's class captures the list itself. With dependencies the carrier starts locked and
        // the instance is announced once they resolve, exactly like a Component's own interfaces.
        const Carrier = class extends Component
        {
            protected override get dependencies(): Array<ComponentDependency<any>>
            {
                return dependencies;
            }
        };
        const carrier = new Carrier(this);

        // Registered before attachComponent() adds its own unlock listener, so `ready` runs first:
        // the instance is initialised before anyone receives it.
        if(options.ready)
        {
            if(carrier.locked) carrier.events.once(ComponentEvents.INTERNAL_UNLOCKED, options.ready);
            else options.ready();
        }

        this.attachComponent(carrier, [iid], instance);

        if(!options.update) return;

        const update = options.update;
        const receiver: IUpdateReceiver = {
            get disposed(): boolean
            {
                return carrier.disposed;
            },
            dispose: (): void => undefined,
            update: (deltaTime: number): void => update(deltaTime)
        };
        const start = (): void => this.registerUpdateReceiver(receiver, options.updatePriority ?? 0);

        if(carrier.locked) carrier.events.once(ComponentEvents.INTERNAL_UNLOCKED, start);
        else start();
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/runtime/ComponentContext.as::announceInterfaceAvailability()
    private announceInterfaceAvailability<T>(iid: IID<T>, provider: Component | T): void
    {
        const queue = (this._interfaceQueues.get(iid) ?? null) as IInterfaceQueue<T> | null;

        if(!queue) return;

        // AS3 pops receivers one at a time and re-queries the provider on each pass, because an
        // earlier receiver can be what makes the interface available to the next. It never clears
        // the queue up-front, and — crucially — it still calls the receiver when the instance is
        // null, after logging. Returning early there strands the receivers: the waiting component
        // never has its dependency resolved and stays locked for the rest of the session.
        const count = queue.callbacks.length;

        for(let i = 0; i < count; i++)
        {
            const instance = provider instanceof Component
                ? provider.queueInterface(iid)
                : provider;

            if(!instance)
            {
                this.error(`Interface ${getIIDName(iid)} still unavailable!`, true, 6);
            }

            const callback = queue.callbacks.pop();

            if(!callback) break;

            try
            {
                callback(iid, instance as T);
            }
            catch (e)
            {
                log.error('Callback error:', e);
            }
        }
    }
}
