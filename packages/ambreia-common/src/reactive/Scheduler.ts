import {Logger} from '../utils/Logger';

const log = Logger.getLogger('core.reactive.Scheduler');

// No `AS3:` traces in this file: nothing here was ported. The reactive layer is
// TS-only infrastructure (see docs/REACTIVE-UI.md) — AS3 has no equivalent, its
// views are hand-wired.

/**
 * The minimal emitter surface {@link ReactiveScheduler.attach} needs — kept
 * structural so the core depends on no event library.
 */
// TS-only: matches the DI component `events` emitter shape.
export interface IFlushEmitter
{
    on(type: string, listener: () => void): unknown;
}

/** Minimal surface the scheduler needs from an executable effect. */
export interface IScheduledEffect
{
    readonly disposed: boolean;

    run(): void;
}

/**
 * The reactive layer's single flush queue.
 *
 * Effects never run synchronously: writes enqueue them here, and the queue
 * drains at one point in the frame — `HabboWindowManager.update()` emits its
 * RENDER tracking event exactly between input dispatch and rendering, and
 * {@link attach} subscribes the flush to it. That boundary is what makes
 * disposal-during-dispatch and pooled-event retention structurally impossible;
 * see docs/REACTIVE-UI.md §5 for the full argument.
 *
 * {@link flushNow} exists for tests and for paths with no frame: a hidden
 * tab's rAF is paused while packets still arrive on `onmessage`.
 */
// TS-only: the frame-boundary scheduler of the reactive layer.
export class ReactiveScheduler
{
    /**
    * Iterations the flush loop may take before it declares the effect graph
    * non-convergent and drops the queue rather than hanging the frame.
    */
    // TS-only: convergence cap for effects that keep writing signals.
    private static readonly MAX_FLUSH_ITERATIONS: number = 100;

    private readonly _queue: Set<IScheduledEffect> = new Set();
    private _flushing: boolean = false;
    private _attached: boolean = false;

    /** Queues an effect for the next flush. Idempotent per flush. */
    // TS-only: called by signal writes and by effect creation.
    public enqueue(effect: IScheduledEffect): void
    {
        this._queue.add(effect);
    }

    /** Drops a disposed effect from the queue. */
    // TS-only: called by EffectComputation.dispose().
    public dequeue(effect: IScheduledEffect): void
    {
        this._queue.delete(effect);
    }

    /**
     * Subscribes the flush to the host's frame boundary. Called once by
     * whoever boots (GlazeBoot / client bootstrap) — never by ported code.
     *
     * @param emitter - The window manager's `events` emitter
     * @param eventType - The tracking event marking "input done, render next"
     */
    // TS-only: consumer-side wiring; no AS3-traced file is edited for this.
    public attach(emitter: IFlushEmitter, eventType: string): void
    {
        if(this._attached)
        {
            log.warn('attach() called twice — keeping the first boundary');

            return;
        }

        this._attached = true;
        emitter.on(eventType, () => this.flushNow());
    }

    /**
     * Drains the queue until stable. Re-entrant calls are no-ops (the running
     * flush already drains everything, including effects enqueued mid-flush).
     */
    // TS-only: the only place effects execute.
    public flushNow(): void
    {
        if(this._flushing)
        {
            return;
        }

        this._flushing = true;

        try
        {
            let iterations = 0;

            while(this._queue.size > 0)
            {
                if(++iterations > ReactiveScheduler.MAX_FLUSH_ITERATIONS)
                {
                    log.error(`effect queue failed to settle after ${ReactiveScheduler.MAX_FLUSH_ITERATIONS} iterations — dropping ${this._queue.size} queued effect(s)`);
                    this._queue.clear();
                    break;
                }

                const batch = [...this._queue];

                this._queue.clear();

                for(const effect of batch)
                {
                    if(effect.disposed)
                    {
                        continue;
                    }

                    try
                    {
                        effect.run();
                    }
                    catch (error)
                    {
                        log.error('effect threw during flush:', error);
                    }
                }
            }
        }
        finally
        {
            this._flushing = false;
        }
    }
}

// TS-only: the shared scheduler instance every signal write reaches.
export const Scheduler: ReactiveScheduler = new ReactiveScheduler();
