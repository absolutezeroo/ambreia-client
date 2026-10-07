import {Motion} from './Motion';

/**
 * Motion that executes multiple motions in parallel.
 *
 * All motions are started simultaneously. On each tick, every running
 * motion is ticked. Completed motions are removed from the active set.
 * The combo itself completes when all motions have finished.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/motion/Combo.as
 */
export class Combo extends Motion
{
    private _motions: Motion[];
    private _completed: Motion[] = [];

    constructor(...motions: Motion[])
    {
        super(motions.length > 0 ? motions[0].target : null);
        this._motions = [...motions];
    }

    public override start(): void
    {
        super.start();

        for(const motion of this._motions)
        {
            motion.start();
        }
    }

    public override tick(timestamp: number): void
    {
        super.tick(timestamp);

        // Remove previously completed motions
        while(this._completed.length > 0)
        {
            const done = this._completed.pop()!;
            const index = this._motions.indexOf(done);

            if(index >= 0)
            {
                this._motions.splice(index, 1);
            }

            if(done.running)
            {
                done.stop();
            }
        }

        // Tick active motions and collect newly completed ones
        for(const motion of this._motions)
        {
            if(motion.running)
            {
                motion.tick(timestamp);
            }

            if(motion.complete)
            {
                this._completed.push(motion);
            }
        }

        if(this._motions.length > 0)
        {
            // Update target to the first non-disposed motion's target
            for(const motion of this._motions)
            {
                this._target = motion.target;

                if(this._target && !this._target.disposed)
                {
                    break;
                }
            }

            this._complete = false;
        }
        else
        {
            this._complete = true;
        }
    }
}
