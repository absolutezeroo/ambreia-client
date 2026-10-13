import type {IScopedTimer} from '@ambreia/kernel/feature/FeatureScope';

/** Runs `run` every `ms` while something moves (a cast bar, an effect's time left), and not otherwise. */
export class WhileTicker
{
    private _timer: IScopedTimer | null = null;

    constructor(private readonly _interval: (run: () => void, ms: number) => IScopedTimer, private readonly _run: () => void, private readonly _ms: number) {}

    sync(active: boolean): void
    {
        if(active && this._timer === null) this._timer = this._interval(this._run, this._ms);
        else if(!active) this.stop();
    }

    stop(): void
    {
        this._timer?.clear();
        this._timer = null;
    }
}
