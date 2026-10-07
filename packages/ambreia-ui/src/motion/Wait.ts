import {Motion} from './Motion';

/**
 * Motion that waits for a specified duration before completing.
 *
 * Does nothing visually -- simply tracks elapsed time and marks itself
 * complete once the duration has passed. Useful for inserting delays
 * in a {@link Queue} of motions.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/motion/Wait.as
 */
export class Wait extends Motion
{
    private _duration: number;
    private _startTime: number = 0;

    constructor(duration: number)
    {
        super(null);
        this._duration = duration;
    }

    public override get running(): boolean
    {
        return this._running;
    }

    public override start(): void
    {
        super.start();
        this._complete = false;
        this._startTime = performance.now();
    }

    public override tick(timestamp: number): void
    {
        this._complete = (timestamp - this._startTime) >= this._duration;

        if(this._complete)
        {
            this.stop();
        }

        super.tick(timestamp);
    }
}
