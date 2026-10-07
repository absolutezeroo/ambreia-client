import type {IWindow} from '../IWindow';
import {Interval} from './Interval';

/**
 * Motion that drops a window and bounces it to its original Y position.
 *
 * On start, offsets the window upward by the bounce height. During update,
 * applies a standard bounce easing function to animate back down.
 * On stop, restores the original Y position.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/motion/DropBounce.as
 */
export class DropBounce extends Interval
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/motion/DropBounce.as::_height
    private _height: number;
    // AS3: .../src/com/sulake/core/window/motion/DropBounce.as::_offset
    private _offset: number = 0;

    constructor(target: IWindow, duration: number, height: number)
    {
        super(target, duration);
        this._height = height;
    }

    public override start(): void
    {
        super.start();
        this._offset = this._target!.y;
        this._target!.y = this._offset - this._height;
    }

    public override update(progress: number): void
    {
        super.update(progress);
        this._target!.y = (this._offset - this._height) + (this.getBounceOffset(progress) * this._height);
    }

    public override stop(): void
    {
        if(this._target)
        {
            this._target.y = this._offset;
        }

        super.stop();
    }

    // AS3: .../src/com/sulake/core/window/motion/DropBounce.as::getBounceOffset()
    protected getBounceOffset(t: number): number
    {
        if(t < 0.364)
        {
            return (7.5625 * t) * t;
        }

        if(t < 0.727)
        {
            t = t - 0.545;
            return ((7.5625 * t) * t) + 0.75;
        }

        if(t < 0.909)
        {
            t = t - 0.9091;
            return ((7.5625 * t) * t) + 0.9375;
        }

        t = t - 0.955;
        return ((7.5625 * t) * t) + 0.984375;
    }
}
