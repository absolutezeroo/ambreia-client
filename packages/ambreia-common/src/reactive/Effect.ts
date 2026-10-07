import {Scheduler} from './Scheduler';
import {Logger} from '../utils/Logger';

const log = Logger.getLogger('core.reactive.Effect');

// No `AS3:` traces in this file: nothing here was ported. The reactive layer is
// TS-only infrastructure (see docs/REACTIVE-UI.md).

/**
 * Anything a computation can subscribe to: a signal or a computed.
 */
// TS-only: the dependency edge of the reactive graph.
export interface IDependencySource
{
    readonly observers: Set<Computation>;
}

let currentComputation: Computation | null = null;
let currentScope: Scope | null = null;

// TS-only: read by signal()/computed() to record the running subscriber.
export function getCurrentComputation(): Computation | null
{
    return currentComputation;
}

// TS-only: read by effect()/onCleanup() to find the owning scope.
export function getCurrentScope(): Scope | null
{
    return currentScope;
}

/**
 * Runs `fn` without subscribing the current computation to anything it reads.
 */
// TS-only: escape hatch for reads that must not create dependencies.
export function untrack<T>(fn: () => T): T
{
    const previous = currentComputation;

    currentComputation = null;

    try
    {
        return fn();
    }
    finally
    {
        currentComputation = previous;
    }
}

/**
 * Base of everything that tracks dependencies: effects and computeds.
 *
 * Dependencies are re-collected from scratch on every run (so conditional
 * reads work), and cleanups registered during a run execute before the next
 * run and on disposal.
 */
// TS-only: the subscriber node of the reactive graph.
export abstract class Computation
{
    private readonly _sources: IDependencySource[] = [];
    private readonly _cleanups: (() => void)[] = [];

    private _disposed: boolean = false;

    // TS-only: checked by the scheduler before running a queued effect.
    public get disposed(): boolean
    {
        return this._disposed;
    }

    /** Called by a source whose value changed. */
    // TS-only: effects enqueue themselves; computeds cascade staleness.
    public abstract invalidate(): void;

    /** Records a subscription for teardown on the next run. */
    // TS-only: called from signal/computed reads.
    public track(source: IDependencySource): void
    {
        source.observers.add(this);
        this._sources.push(source);
    }

    /** Runs cleanup before the next execution and at disposal. */
    // TS-only: backs onCleanup() inside effects.
    public addCleanup(fn: () => void): void
    {
        this._cleanups.push(fn);
    }

    /** Detaches from every source, runs cleanups, then runs `fn` tracked. */
    protected runTracked<T>(fn: () => T): T
    {
        this.detach();

        const previous = currentComputation;

        // The ambient-tracking pattern: reads during `fn` find their subscriber
        // through this module variable. Not an alias kept around — restored in
        // the finally.
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        currentComputation = this;

        try
        {
            return fn();
        }
        finally
        {
            currentComputation = previous;
        }
    }

    private detach(): void
    {
        for(let i = this._cleanups.length - 1; i >= 0; i--)
        {
            try
            {
                this._cleanups[i]();
            }
            catch (error)
            {
                log.warn('cleanup threw:', error);
            }
        }

        this._cleanups.length = 0;

        for(const source of this._sources)
        {
            source.observers.delete(this);
        }

        this._sources.length = 0;
    }

    // TS-only: dispose() last, disposed-guarded, per the port's conventions.
    public dispose(): void
    {
        if(!this._disposed)
        {
            this._disposed = true;
            this.detach();
        }
    }
}

/**
 * A side-effecting computation. Never runs synchronously — writes enqueue it
 * and the scheduler runs it at the frame boundary (docs/REACTIVE-UI.md §5).
 */
// TS-only: the executable node the scheduler drains.
export class EffectComputation extends Computation
{
    private readonly _fn: () => void;

    constructor(fn: () => void)
    {
        super();
        this._fn = fn;
    }

    // TS-only: a dirtied effect just queues; execution is the scheduler's.
    public invalidate(): void
    {
        if(!this.disposed)
        {
            Scheduler.enqueue(this);
        }
    }

    /** Executes once. Only the scheduler calls this. */
    // TS-only: runs with dependency tracking; prior deps and cleanups reset.
    public run(): void
    {
        if(!this.disposed)
        {
            this.runTracked(this._fn);
        }
    }

    public override dispose(): void
    {
        if(!this.disposed)
        {
            Scheduler.dequeue(this);
            super.dispose();
        }
    }
}

/**
 * Ownership node: computations and child scopes created under `run()` are
 * disposed with the scope — children first, then owned computations, then the
 * scope's own cleanups, mirroring the port's dispose ordering.
 */
// TS-only: the lifetime container bindings and effects register into.
export class Scope
{
    private readonly _parent: Scope | null;
    private readonly _children: Scope[] = [];
    private readonly _owned: Computation[] = [];
    private readonly _cleanups: (() => void)[] = [];

    private _disposed: boolean = false;

    constructor(parent: Scope | null = null)
    {
        this._parent = parent;
        parent?._children.push(this);
    }

    // TS-only: read by the scheduler-adjacent code and by consumers.
    public get disposed(): boolean
    {
        return this._disposed;
    }

    /** Registers a computation for disposal with this scope. */
    // TS-only: called by effect()/computed() via the ambient scope.
    public own(computation: Computation): void
    {
        this._owned.push(computation);
    }

    /** Registers teardown to run at disposal. */
    // TS-only: backs onCleanup() outside effects.
    public addCleanup(fn: () => void): void
    {
        this._cleanups.push(fn);
    }

    /** Makes this the ambient scope for everything `fn` creates. */
    // TS-only: the ownership boundary.
    public run<T>(fn: () => T): T
    {
        const previous = currentScope;

        // Ambient ownership, same pattern as runTracked() above.
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        currentScope = this;

        try
        {
            return fn();
        }
        finally
        {
            currentScope = previous;
        }
    }

    // TS-only: dispose() last, disposed-guarded.
    public dispose(): void
    {
        if(this._disposed)
        {
            return;
        }

        this._disposed = true;

        for(let i = this._children.length - 1; i >= 0; i--)
        {
            this._children[i].dispose();
        }

        this._children.length = 0;

        for(const computation of this._owned)
        {
            computation.dispose();
        }

        this._owned.length = 0;

        for(let i = this._cleanups.length - 1; i >= 0; i--)
        {
            try
            {
                this._cleanups[i]();
            }
            catch (error)
            {
                log.warn('scope cleanup threw:', error);
            }
        }

        this._cleanups.length = 0;

        if(this._parent && !this._parent._disposed)
        {
            const index = this._parent._children.indexOf(this);

            if(index >= 0)
            {
                this._parent._children.splice(index, 1);
            }
        }
    }
}

/**
 * Creates an effect owned by the ambient scope. It first runs at the next
 * flush — never synchronously, including at creation.
 *
 * @param fn - Re-runs whenever a signal or computed it read changes
 * @returns A disposer for the effect alone
 */
// TS-only: the reactive layer's unit of work.
export function effect(fn: () => void): () => void
{
    const computation = new EffectComputation(fn);

    getCurrentScope()?.own(computation);
    Scheduler.enqueue(computation);

    return () => computation.dispose();
}

/**
 * Registers teardown with the running computation, or with the ambient scope
 * when called outside one. Dropped (with a warning) when neither exists.
 */
// TS-only: cleanup registration for both effects and scope setup code.
export function onCleanup(fn: () => void): void
{
    if(currentComputation !== null)
    {
        currentComputation.addCleanup(fn);
    }
    else if(currentScope !== null)
    {
        currentScope.addCleanup(fn);
    }
    else
    {
        log.warn('onCleanup() outside any computation or scope — the cleanup will never run');
    }
}
