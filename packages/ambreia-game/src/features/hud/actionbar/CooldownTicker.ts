import type {IIntervalTimers} from './IIntervalTimers';

/** How often a running cooldown's seconds are redrawn. */
const COOLDOWN_TICK_MS = 250;

const BROWSER_TIMERS: IIntervalTimers = {
    every: (run, ms) => setInterval(run, ms),
    stop: handle => clearInterval(handle as ReturnType<typeof setInterval>)
};

/** The cooldowns count down every tick while one runs; nothing ticks when none runs. */
export class CooldownTicker
{
    private _handle: unknown = null;

    /** @param tick - redraws the cooldowns; true while one still runs */
    constructor(private readonly _tick: () => boolean, private readonly _timers: IIntervalTimers = BROWSER_TIMERS) {}

    /** Starts ticking when a cooldown runs, stops when none does. */
    sync(running: boolean): void
    {
        if(!running)
        {
            this.stop();

            return;
        }

        if(this._handle !== null) return;

        this._handle = this._timers.every(() =>
        {
            if(!this._tick()) this.stop();
        }, COOLDOWN_TICK_MS);
    }

    stop(): void
    {
        if(this._handle !== null) this._timers.stop(this._handle);
        this._handle = null;
    }
}
