import type {IAnimatable} from './IAnimatable';
import {DelayedCall} from './DelayedCall';

/**
 * Animation coordinator that manages and advances multiple IAnimatable objects.
 *
 * The Juggler maintains a list of animatable objects and advances them
 * all by a given time delta each frame. It also provides convenience
 * methods for delayed and repeated function calls.
 *
 * @see source_as_win63/habbo/utils/animation/Juggler.as
 */
export class Juggler implements IAnimatable
{
    // AS3: .../src/com/sulake/habbo/utils/animation/Juggler.as::REMOVE_FROM_JUGGLER
    public static readonly REMOVE_FROM_JUGGLER: string = 'REMOVE_FROM_JUGGLER';

    private _animatables: (IAnimatable | null)[] = [];
    private _animatableSet: Set<IAnimatable> = new Set();
    private _elapsedTime: number = 0;

    /**
	 * The total elapsed time since this juggler was created.
	 */
    // AS3: .../src/com/sulake/habbo/utils/animation/Juggler.as::get elapsedTime()
    get elapsedTime(): number
    {
        return this._elapsedTime;
    }

    /**
	 * Add an animatable object to the juggler.
	 * If the object is already added, this is a no-op.
	 *
	 * @param animatable The animatable object to add
	 */
    // AS3: .../src/com/sulake/habbo/utils/animation/Juggler.as::add()
    add(animatable: IAnimatable | null): void
    {
        if(animatable && !this._animatableSet.has(animatable))
        {
            this._animatableSet.add(animatable);
            this._animatables[this._animatables.length] = animatable;

            if(animatable instanceof DelayedCall)
            {
                animatable.onRemove = () => this.remove(animatable);
            }
        }
    }

    /**
	 * Check if the juggler contains a given animatable.
	 *
	 * @param animatable The animatable to check
	 * @returns True if the animatable is in the juggler
	 */
    // AS3: .../src/com/sulake/habbo/utils/animation/Juggler.as::contains()
    contains(animatable: IAnimatable): boolean
    {
        return this._animatableSet.has(animatable);
    }

    /**
	 * Remove an animatable object from the juggler.
	 *
	 * @param animatable The animatable to remove
	 */
    // AS3: .../src/com/sulake/habbo/utils/animation/Juggler.as::remove()
    remove(animatable: IAnimatable | null): void
    {
        if(animatable === null)
        {
            return;
        }

        if(animatable instanceof DelayedCall)
        {
            animatable.onRemove = null;
        }

        if(!this._animatableSet.delete(animatable))
        {
            return;
        }

        const index = this._animatables.indexOf(animatable);

        if(index !== -1)
        {
            this._animatables[index] = null;
        }
    }

    /**
	 * Remove all animatable objects from the juggler.
	 */
    // AS3: .../src/com/sulake/habbo/utils/animation/Juggler.as::purge()
    purge(): void
    {
        for(let i = this._animatables.length - 1; i >= 0; i--)
        {
            const animatable = this._animatables[i];

            if(animatable instanceof DelayedCall)
            {
                animatable.onRemove = null;
            }

            this._animatables[i] = null;
        }

        this._animatableSet.clear();
    }

    /**
	 * Schedule a delayed function call.
	 *
	 * @param callback The function to call after the delay
	 * @param delay The delay in seconds
	 * @param args Additional arguments to pass to the callback
	 * @returns The created DelayedCall, or null if callback is null
	 */
    // AS3: .../src/com/sulake/habbo/utils/animation/Juggler.as::delayCall()
    delayCall(callback: ((...args: unknown[]) => void) | null, delay: number, ...args: unknown[]): DelayedCall | null
    {
        if(callback === null)
        {
            return null;
        }

        const delayedCall = new DelayedCall(callback, delay, args);
        this.add(delayedCall);

        return delayedCall;
    }

    /**
	 * Schedule a repeated function call.
	 *
	 * @param callback The function to call at each interval
	 * @param interval The interval in seconds between calls
	 * @param count The number of repetitions (0 = infinite)
	 * @param args Additional arguments to pass to the callback
	 * @returns The created DelayedCall, or null if callback is null
	 */
    // AS3: .../src/com/sulake/habbo/utils/animation/Juggler.as::repeatCall()
    repeatCall(callback: ((...args: unknown[]) => void) | null, interval: number, count: number = 0, ...args: unknown[]): DelayedCall | null
    {
        if(callback === null)
        {
            return null;
        }

        const delayedCall = new DelayedCall(callback, interval, args);
        delayedCall.repeatCount = count;
        this.add(delayedCall);

        return delayedCall;
    }

    /**
	 * Advance all contained animatables by the given time delta.
	 * Null entries (removed animatables) are compacted during this call.
	 *
	 * @param time The time delta in seconds
	 */
    // AS3: .../src/com/sulake/habbo/utils/animation/Juggler.as::advanceTime()
    advanceTime(time: number): void
    {
        let i: number;
        let numObjects = this._animatables.length;
        let currentIndex = 0;

        this._elapsedTime += time;

        if(numObjects === 0)
        {
            return;
        }

        i = 0;

        while(i < numObjects)
        {
            const animatable = this._animatables[i];

            if(animatable)
            {
                if(currentIndex !== i)
                {
                    this._animatables[currentIndex] = animatable;
                    this._animatables[i] = null;
                }

                animatable.advanceTime(time);
                currentIndex++;
            }

            i++;
        }

        if(currentIndex !== i)
        {
            numObjects = this._animatables.length;

            while(i < numObjects)
            {
                this._animatables[currentIndex++] = this._animatables[i++];
            }

            this._animatables.length = currentIndex;
        }
    }
}
