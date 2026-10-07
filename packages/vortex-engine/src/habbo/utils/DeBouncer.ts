import type {IDisposable} from '@ambreia/common/IDisposable';

/**
 * DeBouncer — coalesces rapid trigger() calls into a single deferred callback. trigger() fires the
 * callback immediately when forced, or when enough idle time has passed since the last execution
 * (tolerateImmediateTimeout); otherwise it (re)arms a one-shot timer for `delay` ms so a burst of
 * triggers collapses to one call at the end.
 *
 * Port note: AS3 backs this with a flash.utils.Timer(delay, 1) + getTimer(). The port uses the
 * browser's setTimeout/clearTimeout for the one-shot timer and performance.now() for getTimer() (the
 * established getTimer equivalent). AS3's dispose() has a dead removeEventListener('timerComplete',
 * execute) — the listener was actually added as onTimerComplete, so it never detached; the port has
 * no such listener so the issue does not arise.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/DeBouncer.as
 */
export class DeBouncer implements IDisposable
{
    // AS3: DeBouncer.as::_SafeStr_7985 (name derived: last execution timestamp, ms)
    private _lastExecuteTime: number = 0;

    // AS3: DeBouncer.as::_tolerateImmediateTimeout
    private _tolerateImmediateTimeout: number;

    // AS3: DeBouncer.as::_disposed
    private _disposed: boolean = false;

    // AS3: DeBouncer.as::_SafeStr_4902 (name derived: the one-shot timer, here a setTimeout handle)
    private _timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    // AS3: DeBouncer.as::_delay (the Timer's delay, ms)
    private _delay: number;

    // AS3: DeBouncer.as::_callback
    private _callback: (() => void) | null;

    // AS3: DeBouncer.as::DeBouncer()
    constructor(delay: number, tolerateImmediateTimeout: number, callback: () => void)
    {
        this._delay = delay;
        this._tolerateImmediateTimeout = tolerateImmediateTimeout;
        this._callback = callback;
    }

    // AS3: DeBouncer.as::trigger()
    trigger(force: boolean = false): void
    {
        if(force || this._lastExecuteTime < performance.now() - this._tolerateImmediateTimeout)
        {
            this.reset();
            this.execute();
            return;
        }

        this.reset();
        this._timeoutHandle = setTimeout(() => this.execute(), this._delay);
    }

    // AS3: DeBouncer.as::_SafeStr_4902.reset() (Timer.reset() — stop + clear)
    private reset(): void
    {
        if(this._timeoutHandle !== null)
        {
            clearTimeout(this._timeoutHandle);
            this._timeoutHandle = null;
        }
    }

    // AS3: DeBouncer.as::execute()
    private execute(): void
    {
        this._lastExecuteTime = performance.now();
        this._callback?.();
    }

    // AS3: DeBouncer.as::dispose()
    dispose(): void
    {
        if(this._disposed)
        {
            return;
        }

        this.reset();
        this._callback = null;
        this._tolerateImmediateTimeout = 0;
        this._lastExecuteTime = 0;
        this._disposed = true;
    }

    // AS3: DeBouncer.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }
}
