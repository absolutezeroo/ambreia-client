import type {IScopedTimer} from '@ambreia/kernel/feature/FeatureScope';

/**
 * The delayed effects of a zone. Each belongs to the zone it was fired in: a flight or a hit that
 * lands after a zone change would play on whatever object holds the same id in the next room. The
 * epoch changes when the zone is left, and a pending timer whose epoch is gone does nothing.
 */
export class ZoneTimers
{
    private _epoch = 0;
    private readonly _pending = new Set<IScopedTimer>();

    constructor(private readonly _timeout: (run: () => void, ms: number) => IScopedTimer) {}

    get epoch(): number
    {
        return this._epoch;
    }

    later(run: () => void, delayMs: number): void
    {
        const at = this._epoch;
        const handle = this._timeout(() =>
        {
            this._pending.delete(handle);
            if(this._epoch === at) run();
        }, delayMs);

        this._pending.add(handle);
    }

    /** The zone was left: nothing it fired plays any more. */
    endZone(): void
    {
        this._epoch++;
        for(const handle of this._pending) handle.clear();
        this._pending.clear();
    }

    dispose(): void
    {
        for(const handle of this._pending) handle.clear();
        this._pending.clear();
    }
}
