import type {IAnimatable} from './IAnimatable';

/**
 * A delayed function call that implements IAnimatable.
 *
 * Accumulates time via advanceTime() and invokes its callback
 * once the specified delay has elapsed. Supports repeat counts
 * for recurring calls.
 *
 * @see source_as_win63/habbo/utils/animation/DelayedCall.as
 */
export class DelayedCall implements IAnimatable
{
    public static readonly REMOVE_FROM_JUGGLER: string = 'REMOVE_FROM_JUGGLER';

    private _callback: ((...args: unknown[]) => void) | null;
    private _args: unknown[];
    private _complete: boolean = false;

    /**
	 * Create a new DelayedCall.
	 *
	 * @param callback The function to call when the delay elapses
	 * @param delay The delay in seconds before the callback is invoked
	 * @param args Optional arguments to pass to the callback
	 */
    constructor(callback: (...args: unknown[]) => void, delay: number, args: unknown[] = [])
    {
        this._callback = callback;
        this._args = args;
        this._currentTime = 0;
        this._totalTime = Math.max(delay, 0.0001);
        this._repeatCount = 1;
    }

    private _currentTime: number;

    /**
	 * The current accumulated time in seconds.
	 */
    // AS3: .../src/com/sulake/habbo/utils/animation/DelayedCall.as::get currentTime()
    get currentTime(): number
    {
        return this._currentTime;
    }

    private _totalTime: number;

    /**
	 * The total delay time in seconds.
	 */
    // AS3: .../src/com/sulake/habbo/utils/animation/DelayedCall.as::get totalTime()
    get totalTime(): number
    {
        return this._totalTime;
    }

    private _repeatCount: number;

    /**
	 * The number of times the callback will be invoked.
	 * 0 means infinite repeats.
	 */
    // AS3: .../src/com/sulake/habbo/utils/animation/DelayedCall.as::get repeatCount()
    get repeatCount(): number
    {
        return this._repeatCount;
    }

    // AS3: .../src/com/sulake/habbo/utils/animation/DelayedCall.as::set repeatCount()
    set repeatCount(value: number)
    {
        this._repeatCount = value;
    }

    private _onRemove: (() => void) | null = null;

    /**
	 * Set the callback to invoke when this delayed call should be removed from its juggler.
	 *
	 * @param callback The removal callback
	 */
    set onRemove(callback: (() => void) | null)
    {
        this._onRemove = callback;
    }

    /**
	 * Whether this delayed call has completed.
	 */
    // AS3: .../src/com/sulake/habbo/utils/animation/DelayedCall.as::get isComplete()
    get isComplete(): boolean
    {
        return this._repeatCount === 1 && this._currentTime >= this._totalTime;
    }

    /**
	 * Reset this delayed call with new parameters.
	 *
	 * @param callback The function to call
	 * @param delay The delay in seconds
	 * @param args Optional arguments
	 * @returns This instance for chaining
	 */
    // AS3: .../src/com/sulake/habbo/utils/animation/DelayedCall.as::reset()
    reset(callback: (...args: unknown[]) => void, delay: number, args: unknown[] = []): DelayedCall
    {
        this._currentTime = 0;
        this._totalTime = Math.max(delay, 0.0001);
        this._callback = callback;
        this._args = args;
        this._repeatCount = 1;
        this._complete = false;

        return this;
    }

    /**
	 * Advance the timer by the given time delta.
	 * Invokes the callback when the delay has been reached.
	 *
	 * @param time The time delta in seconds
	 */
    // AS3: .../src/com/sulake/habbo/utils/animation/DelayedCall.as::advanceTime()
    advanceTime(time: number): void
    {
        const previousTime = this._currentTime;
        this._currentTime += time;

        if(this._currentTime > this._totalTime)
        {
            this._currentTime = this._totalTime;
        }

        if(previousTime < this._totalTime && this._currentTime >= this._totalTime)
        {
            if(this._repeatCount === 0 || this._repeatCount > 1)
            {
                if(this._callback)
                {
                    this._callback.apply(null, this._args);
                }

                if(this._repeatCount > 0)
                {
                    this._repeatCount -= 1;
                }

                this._currentTime = 0;
                this.advanceTime(previousTime + time - this._totalTime);
            }
            else
            {
                const callback = this._callback;
                const args = this._args;

                this._complete = true;

                if(this._onRemove)
                {
                    this._onRemove();
                }

                if(callback)
                {
                    callback(...args);
                }
            }
        }
    }

    /**
	 * Immediately complete this delayed call,
	 * advancing time to trigger the callback.
	 */
    // AS3: .../src/com/sulake/habbo/utils/animation/DelayedCall.as::complete()
    complete(): void
    {
        const remaining = this._totalTime - this._currentTime;

        if(remaining > 0)
        {
            this.advanceTime(remaining);
        }
    }
}
