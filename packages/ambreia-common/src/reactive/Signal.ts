import type {IDependencySource} from './Effect';
import {Computation, getCurrentComputation, getCurrentScope} from './Effect';

// No `AS3:` traces in this file: nothing here was ported. The reactive layer is
// TS-only infrastructure (see docs/REACTIVE-UI.md).

// TS-only: reader half of a signal or computed.
export type SignalReader<T> = () => T;
// TS-only: writer half of a signal.
export type SignalWriter<T> = (value: T) => void;

class SignalNode<T> implements IDependencySource
{
    public readonly observers: Set<Computation> = new Set();
    public value: T;

    constructor(initial: T)
    {
        this.value = initial;
    }
}

/**
 * A reactive value. Reads inside an effect or computed subscribe it; writes
 * mark dependents and enqueue affected effects — nothing user-visible executes
 * inside the setter (docs/REACTIVE-UI.md §4).
 *
 * Equality is `Object.is`: a same-value write is a no-op.
 */
// TS-only: the state primitive of the reactive layer.
export function signal<T>(initial: T): [SignalReader<T>, SignalWriter<T>]
{
    const node = new SignalNode(initial);

    const read = (): T =>
    {
        getCurrentComputation()?.track(node);

        return node.value;
    };

    const write = (value: T): void =>
    {
        if(Object.is(node.value, value))
        {
            return;
        }

        node.value = value;

        for(const observer of [...node.observers])
        {
            observer.invalidate();
        }
    };

    return [read, write];
}

class ComputedNode<T> extends Computation implements IDependencySource
{
    public readonly observers: Set<Computation> = new Set();

    private readonly _fn: () => T;
    private _value!: T;
    private _stale: boolean = true;

    constructor(fn: () => T)
    {
        super();
        this._fn = fn;
    }

    // TS-only: staleness cascades to observers exactly once per dirtying.
    public invalidate(): void
    {
        if(this._stale)
        {
            return;
        }

        this._stale = true;

        for(const observer of [...this.observers])
        {
            observer.invalidate();
        }
    }

    // TS-only: pull-based — recomputes only when read while stale.
    public read(): T
    {
        getCurrentComputation()?.track(this);

        if(this._stale && !this.disposed)
        {
            this._value = this.runTracked(this._fn);
            this._stale = false;
        }

        return this._value;
    }
}

/**
 * A cached derivation. Lazy: marked stale on dependency writes, recomputed on
 * the next read. Diamond dependencies therefore cost one recompute per flush,
 * and effects observe a consistent final state.
 *
 * Owned by the ambient scope, like an effect.
 */
// TS-only: the derivation primitive of the reactive layer.
export function computed<T>(fn: () => T): SignalReader<T>
{
    const node = new ComputedNode(fn);

    getCurrentScope()?.own(node);

    return () => node.read();
}
