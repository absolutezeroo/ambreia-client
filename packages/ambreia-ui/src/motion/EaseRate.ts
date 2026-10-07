import {Ease} from './Ease';
import type {Interval} from './Interval';

/**
 * Ease motion with a configurable rate exponent.
 *
 * The rate value controls the strength of the easing curve.
 * Subclasses like EaseOut apply `Math.pow(progress, 1/rate)`.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/motion/EaseRate.as
 */
export class EaseRate extends Ease
{
    protected _rate: number;

    constructor(inner: Interval, rate: number)
    {
        super(inner);
        this._rate = rate;
    }
}
