import {Motion} from './Motion';

/**
 * Motion that executes a sequence of motions one after another.
 *
 * When started, the first motion in the queue begins. On each tick,
 * the current motion is ticked. When the current motion completes,
 * it is stopped and the next motion in the queue is started. The
 * queue itself completes when the last motion finishes.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/motion/Queue.as
 */
export class Queue extends Motion
{
    private _motions: Motion[];
    private _current: Motion;

    constructor(...motions: Motion[])
    {
        super(motions.length > 0 ? motions[0].target : null);
        this._motions = motions;
        this._current = motions[0];
        this._complete = this._current == null;
    }

    public override get running(): boolean
    {
        return this._running && this._current != null ? this._current.running : false;
    }

    public override start(): void
    {
        super.start();
        this._current.start();
    }

    public override update(progress: number): void
    {
        super.update(progress);

        if(this._current.running)
        {
            this._current.update(progress);
        }
    }

    public override stop(): void
    {
        super.stop();
        this._current.stop();
    }

    public override tick(timestamp: number): void
    {
        super.tick(timestamp);
        this._current.tick(timestamp);

        if(this._current.complete)
        {
            this._current.stop();

            const index = this._motions.indexOf(this._current);

            if(index < this._motions.length - 1)
            {
                this._current = this._motions[index + 1];
                this._target = this._current.target;
                this._current.start();
            }
            else
            {
                this._complete = true;
            }
        }
    }
}
