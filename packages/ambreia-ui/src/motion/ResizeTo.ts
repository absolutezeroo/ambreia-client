import type {IWindow} from '../IWindow';
import {Interval} from './Interval';

/**
 * Motion that resizes a window to a target width and height.
 *
 * On start, records the window's current dimensions and computes deltas.
 * On each update, linearly interpolates between start and target sizes.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/motion/ResizeTo.as
 */
export class ResizeTo extends Interval
{
    protected _startWidth: number = 0;
    protected _startHeight: number = 0;
    protected _targetWidth: number;
    protected _targetHeight: number;
    protected _deltaWidth: number = 0;
    protected _deltaHeight: number = 0;

    constructor(target: IWindow, duration: number, targetWidth: number, targetHeight: number)
    {
        super(target, duration);
        this._targetWidth = targetWidth;
        this._targetHeight = targetHeight;
    }

    public override start(): void
    {
        super.start();
        this._startWidth = this._target!.width;
        this._startHeight = this._target!.height;
        this._deltaWidth = this._targetWidth - this._startWidth;
        this._deltaHeight = this._targetHeight - this._startHeight;
    }

    public override update(progress: number): void
    {
        this._target!.width = this._startWidth + (this._deltaWidth * progress);
        this._target!.height = this._startHeight + (this._deltaHeight * progress);
    }
}
