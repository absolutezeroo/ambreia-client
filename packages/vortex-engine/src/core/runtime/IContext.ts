import type {EventEmitter} from 'eventemitter3';
import type {IID} from './IID';
import type {IDisposable} from '@ambreia/common/IDisposable';
import type {ICoreConfiguration} from './ICoreConfiguration';
import type {Component} from './Component';
import type {ComponentDependency} from './ComponentDependency';
import type {IAssetLibrary} from '@ambreia/common/assets/IAssetLibrary';
import type {ILinkEventTracker} from './events/ILinkEventTracker';

/**
 * Queue callback for interface resolution
 */
export type InterfaceCallback<T = unknown> = (iid: IID<T>, instance: T) => void;

/**
 * The central container that manages components and their dependencies: registration and
 * lifecycle, resolution through `queueInterface`, and event propagation between components.
 *
 * **Traced to `_SafeCls_54`, not to PRODUCTION's `IContext.as`.** The 2026 context interface is
 * `_SafeCls_57 extends _SafeCls_54, _SafeCls_49`, and `_SafeCls_54` is the half this port
 * mirrors — assets/events/root/configuration, attach/detachComponent, the update receivers, the
 * link-event trackers, and error/warning/debug. Every trace below pointed at the 2016 file until
 * 2026-08-27; the members are the same, but the primary tree is the current build.
 *
 * What `_SafeCls_57` adds on top is deliberately not ported — a `fileProxy` and its persistence
 * methods, `readConfigDocument`, `setProfilerMode`, the loader counters, `arguments`, and
 * `initialize`/`purge`/`hibernate`/`resume`. All of it is AIR plumbing with no caller anywhere in
 * the primary tree outside `core/runtime`, and a browser has no file proxy. See
 * docs/IMPLEMENTATION_STATUS.md → the FakeContext entry.
 *
 * Four members of `_SafeCls_54` are out: `loadFromFile`, `get displayObjectContainer`,
 * `toXMLString` and `prepareComponent`, all Flash display-list or SWF-loading entry points, each
 * carrying its own `DEVIATION:` on `ComponentContext`.
 *
 * The other four used to be listed here too, on the grounds that `Logger` owns the message history.
 * That was wrong twice over: `ComponentContext` implements all four anyway, and AS3 declares them
 * on this interface — so the only thing the omission achieved was hiding working code from every
 * caller holding an `IContext`. Restored 2026-09-01.
 */
export interface IContext extends IDisposable
{
    /**
	 * Event emitter for context-level events
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_54.as::get events()
    readonly events: EventEmitter;

    /**
	 * Root context (top of the hierarchy)
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_54.as::get root()
    readonly root: IContext;

    /**
	 * Configuration manager
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_54.as::get configuration()
    configuration: ICoreConfiguration | null;

    /**
	 * Asset library for this context
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_54.as::get assets()
    readonly assets: IAssetLibrary | null;

    /**
	 * Request an interface from the context.
	 *
	 * If the interface is available, returns the instance immediately.
	 * If not available yet, queues the callback to be called when it becomes available.
	 *
	 * @param iid Interface identifier to request
	 * @param callback Optional callback when interface becomes available
	 * @returns The interface instance if available, null if queued
	 */
    queueInterface<T>(iid: IID<T>, callback?: InterfaceCallback<T>): T | null;

    /**
	 * Attach a component to this context
	 *
	 * @param component The component to attach
	 * @param interfaces Array of interface IDs this component provides
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_54.as::attachComponent()
    attachComponent(component: Component, interfaces: IID[], instance?: unknown): void;

    // TS-only: registers a plain object (an engine package's class) under `iid`.
    attachInstance<T>(iid: IID<T>, instance: T, options?: IAttachInstanceOptions): void;

    /**
	 * Detach a component from this context
	 *
	 * @param component The component to detach
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_54.as::detachComponent()
    detachComponent(component: Component): void;

    /**
	 * Register an update receiver to be called each frame
	 *
	 * @param receiver Object with update method
	 * @param priority Update priority (lower = earlier)
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_54.as::registerUpdateReceiver()
    registerUpdateReceiver(receiver: IUpdateReceiver, priority: number): void;

    /**
	 * Remove an update receiver
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_54.as::removeUpdateReceiver()
    removeUpdateReceiver(receiver: IUpdateReceiver): void;

    /**
	 * Add a link event tracker
	 *
	 * @param tracker The tracker to add
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_54.as::addLinkEventTracker()
    addLinkEventTracker(tracker: ILinkEventTracker): void;

    /**
	 * Remove a link event tracker
	 *
	 * @param tracker The tracker to remove
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_54.as::removeLinkEventTracker()
    removeLinkEventTracker(tracker: ILinkEventTracker): void;

    /**
	 * Create a link event, routing it to matching trackers
	 *
	 * @param link The link string to route
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_54.as::createLinkEvent()
    createLinkEvent(link: string): void;

    /**
	 * The registered trackers, in registration order — `HTMLTextController` walks them to find the
	 * one whose `linkPattern` prefixes a clicked href. `ComponentContext` has always exposed this
	 * getter; only the interface omitted it, so the one caller reaches it through `IWindowContext`,
	 * which declares the same member off `WindowContext.as`.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_54.as::get linkEventTrackers()
    readonly linkEventTrackers: readonly ILinkEventTracker[];

    /**
	 * Log an error.
	 *
	 * @returns whether the error was handled by tearing the context down, so callers can stop
	 * whatever they were doing.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_54.as::error()
    error(message: string, fatal?: boolean, code?: number, error?: Error): boolean;

    /**
	 * Log a warning
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_54.as::warning()
    warning(message: string): void;

    /**
	 * Log a debug message
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_54.as::debug()
    debug(message: string): void;

    /**
	 * The last message of each severity handed to `error()` / `warning()` / `debug()`.
	 *
	 * AS3 keeps them because its `COMPONENT_EVENT_*` events carry no payload: a listener reacting
	 * to one reads the message back through these.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_54.as::getLastErrorMessage()
    getLastErrorMessage(): string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_54.as::getLastDebugMessage()
    getLastDebugMessage(): string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_54.as::getLastWarningMessage()
    getLastWarningMessage(): string;

    /**
	 * Hands a manifest to the context's own asset library. AS3 takes `(XML, Class)` — the second
	 * being the embedded resource class the manifest names assets inside; the port takes the parsed
	 * manifest and whatever resource the caller has, which is the same pair one Flash embedding
	 * layer down.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_54.as::prepareAssetLibrary()
    prepareAssetLibrary(manifest: object, resourceData: unknown): boolean;
}

/**
 * Update Receiver Interface
 *
 * Based on AS3: com.sulake.core.runtime.IUpdateReceiver
 */
// TS-only: see attachInstance().
export interface IAttachInstanceOptions
{
    /** Resolved before the instance is announced, like a Component's own dependencies. */
    dependencies?: Array<ComponentDependency<any>>;
    /** Called every frame through the context's update loop, once the dependencies are there. */
    update?: (deltaTime: number) => void;
    updatePriority?: number;
}

export interface IUpdateReceiver extends IDisposable
{
    /**
	 * Called each frame with delta time
	 */
    update(deltaTime: number): void;
}
