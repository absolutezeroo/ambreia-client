import type {IDisposable} from '@core/runtime/IDisposable';

/**
 * One sprite inside an {@link Animation} — it decides its own position, its own frame, and when it
 * is done.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/AnimationObject.as
 *
 * AS3 names it `AnimationObject`, without the `I` this port's naming convention requires
 * (ESLint naming-convention); the trace comments below carry the real member names.
 *
 * Every method takes the animation's elapsed time in milliseconds, so an object is free to start
 * late (`Twinkle` does) without the animation tracking per-object clocks.
 */
export interface IAnimationObject extends IDisposable
{
    // AS3: AnimationObject.as::getPosition()
    getPosition(elapsedMs: number): {x: number; y: number} | null;

    // AS3: AnimationObject.as::getBitmap()
    getBitmap(elapsedMs: number): ImageBitmap | null;

    // AS3: AnimationObject.as::isFinished()
    isFinished(elapsedMs: number): boolean;

    // AS3: AnimationObject.as::onAnimationStart()
    onAnimationStart(): void;
}
