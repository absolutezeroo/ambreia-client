import {Logger} from '@ambreia/common/utils/Logger';
import {devHook} from '@ambreia/common/utils/BuildEnv';

const log = Logger.getLogger('kernel.feature.FeatureScope');

/** An emitter in eventemitter3's shape: `on(event, fn, context?)` undone by `off` with the same arguments. */
export interface IScopedEmitter
{
    on(...args: any[]): unknown;
    once?(...args: any[]): unknown;
    off(...args: any[]): unknown;
}

/** A DOM target, or `globalThis` in Node, where `addEventListener` may not exist. */
export interface IScopedTarget
{
    addEventListener?(type: string, listener: (event: any) => void, options?: unknown): void;
    removeEventListener?(type: string, listener: (event: any) => void, options?: unknown): void;
}

export interface IScopedTimer
{
    /** True until the timer fired its last time or was cleared. */
    readonly active: boolean;
    clear(): void;
}

/**
 * Everything a feature's create() hooks up, released in one call when the feature is disposed:
 * listeners on emitters and DOM targets, timers, the objects it owns, its console hooks. The
 * kernel hands one to every feature (IFeatureContext.scope) and releases it in dispose(), so a
 * feature that only ever listens needs no dispose of its own.
 *
 *     const on = scope.bind(session.events);   // typed like session.events.on
 *     on('message', message => …);
 *     scope.listen(globalThis, 'keydown', onKey);
 *     const ticker = scope.interval(render, 1000);
 *     scope.own(session).hook('inventory', {session});
 */
export class FeatureScope
{
    private readonly _releases = new Set<() => void>();
    private _released = false;

    public get released(): boolean
    {
        return this._released;
    }

    /** Something to undo on release; released scopes run it at once. */
    public add(release: () => void): this
    {
        this.track(release);

        return this;
    }

    /**
     * The emitter's `on`, typed as the emitter types it, with the listener taken off on release. A
     * null emitter (a slot not made) gives a function that registers nothing, like `emitter?.on`.
     */
    public bind<E extends IScopedEmitter>(emitter?: E | null): E['on']
    {
        return this.bound(emitter, 'on');
    }

    /** `bind()` for `once`: the listener is taken off on release when it has not fired. */
    public bindOnce<E extends IScopedEmitter>(emitter?: E | null): NonNullable<E['once']>
    {
        return this.bound(emitter, 'once') as NonNullable<E['once']>;
    }

    /** A DOM listener, removed on release; nothing happens where the target has no `addEventListener` (Node). */
    public listen(target: IScopedTarget | null, type: string, listener: (event: any) => void, options?: unknown): this
    {
        if(!target?.addEventListener) return this;

        target.addEventListener(type, listener, options);

        return this.add(() => target.removeEventListener?.(type, listener, options));
    }

    public interval(run: () => void, ms: number): IScopedTimer
    {
        const handle = setInterval(run, ms);
        const timer = {
            active: true,
            clear: (): void =>
            {
                if(!timer.active) return;

                timer.active = false;
                clearInterval(handle);
                untrack();
            }
        };
        const untrack = this.track(timer.clear);

        return timer;
    }

    /** A timer that fired, or was cleared, leaves nothing in the scope: a feature may start thousands in a session. */
    public timeout(run: () => void, ms: number): IScopedTimer
    {
        const timer = {
            active: true,
            clear: (): void =>
            {
                if(!timer.active) return;

                timer.active = false;
                clearTimeout(handle);
                untrack();
            }
        };
        const handle = setTimeout(() =>
        {
            timer.active = false;
            untrack();
            run();
        }, ms);
        const untrack = this.track(timer.clear);

        return timer;
    }

    /** An object the feature made and must dispose with itself (a session, a view). */
    public own(disposable?: {dispose(): void} | null): this
    {
        return disposable ? this.add(() => disposable.dispose()) : this;
    }

    /** `devHook()`, and the key gone on release. */
    public hook(name: string, value: unknown): this
    {
        if(!devHook(name, value)) return this;

        return this.add(() =>
        {
            const hooks = (globalThis as unknown as {__ambreia?: Record<string, unknown>}).__ambreia;

            if(hooks && hooks[name] === value) delete hooks[name];
        });
    }

    /** Undoes everything, last registered first; a release that throws does not stop the others. */
    public release(): void
    {
        if(this._released) return;

        this._released = true;

        for(const release of [...this._releases].reverse())
        {
            try
            {
                release();
            }
            catch (error)
            {
                log.error('A feature\'s release failed', error);
            }
        }

        this._releases.clear();
    }

    /** Registers a release and returns what forgets it (a timer that fired has nothing left to undo). */
    private track(release: () => void): () => void
    {
        if(this._released)
        {
            release();

            return () => undefined;
        }

        this._releases.add(release);

        return () => this._releases.delete(release);
    }

    private bound<E extends IScopedEmitter>(emitter: E | null | void, method: 'on' | 'once'): E['on']
    {
        const register = emitter?.[method];

        if(!emitter || !register) return (() => emitter) as E['on'];

        return ((...args: unknown[]) =>
        {
            register.apply(emitter, args);
            this.add(() => emitter.off(...args));

            return emitter;
        }) as E['on'];
    }
}
