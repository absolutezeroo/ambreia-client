import type {IWindow} from '../IWindow';
import {Motion} from './Motion';

/**
 * Motion subclass with time-based interval progression.
 *
 * Tracks a start timestamp and duration, computing a normalized progress
 * value [0..1] on each tick. When progress reaches 1, the motion completes.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/motion/Interval.as
 */
export class Interval extends Motion
{
    private _startTime: number = 0;

    constructor(target: IWindow | null, duration: number)
    {
        super(target);
        this._complete = false;
        this._duration = duration;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/motion/Interval.as::_duration
    private _duration: number;

    // AS3: .../src/com/sulake/core/window/motion/Interval.as::get duration()
    public get duration(): number
    {
        return this._duration;
    }

    public override start(): void
    {
        super.start();
        this._complete = false;
        this._startTime = performance.now();
    }

    public override tick(timestamp: number): void
    {
        const progress = (timestamp - this._startTime) / this._duration;

        if(progress < 1)
        {
            this.update(progress);
        }
        else
        {
            this.update(1);
            this._complete = true;
        }
    }
}
