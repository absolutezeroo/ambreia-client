import {Motion} from './Motion';

/**
 * Motion that executes a callback function and then completes immediately.
 *
 * The callback receives a reference to this motion instance. After
 * invocation, the callback reference is cleared and the motion is no
 * longer considered running.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/motion/Callback.as
 */
export class Callback extends Motion
{
    // AS3: .../src/com/sulake/core/window/motion/Callback.as::_callback
    protected _callback: ((motion: Motion) => void) | null;

    constructor(callback: (motion: Motion) => void)
    {
        super(null);
        this._callback = callback;
    }

    public override get running(): boolean
    {
        return this._running && this._callback !== null;
    }

    public override tick(timestamp: number): void
    {
        super.tick(timestamp);

        if(this._callback !== null)
        {
            this._callback(this);
            this._callback = null;
        }
    }
}
