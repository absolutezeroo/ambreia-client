import type {IWindow} from '../IWindow';
import {Motion} from './Motion';

/**
 * Motion that disposes the target window on the first tick.
 *
 * Once ticked, the target window is disposed (if it exists and is not
 * already disposed) and the target reference is cleared.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/motion/Dispose.as
 */
export class Dispose extends Motion
{
    constructor(target: IWindow)
    {
        super(target);
    }

    public override tick(timestamp: number): void
    {
        super.tick(timestamp);

        if(this._target && !this._target.disposed)
        {
            this._target.dispose();
            this._target = null;
        }
    }
}
