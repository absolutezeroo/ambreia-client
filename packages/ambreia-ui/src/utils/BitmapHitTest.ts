/**
 * Per-pixel alpha hit testing over an `OffscreenCanvas`.
 *
 * TS-only: this is the web stand-in for `flash.display.BitmapData.hitTest()`,
 * which the window system calls on every mouse event through
 * `WindowController.testLocalPointHitAgainstAlpha()`. Flash gave the port a
 * native per-pixel test; Canvas2D gives `getImageData`, and nothing else in the
 * runtime provides the `hitTest(point, threshold, point)` shape AS3 expects.
 *
 * Semantics follow `BitmapData.hitTest(firstPoint, firstAlphaThreshold,
 * secondPoint)` as AS3 calls it here — always with `firstPoint` at the origin,
 * so the pixel sampled is `secondPoint` itself:
 *
 * - a point outside the buffer is a miss (Flash tests nothing there);
 * - a pixel counts as a hit when its alpha is **at or above** the threshold.
 *   Flash documents the bound loosely ("the highest alpha channel value that is
 *   considered opaque"); the distinction only bites at exactly the threshold,
 *   and every skin this client ships is either fully transparent (0) or fully
 *   opaque (255), where both readings agree.
 *
 * `getImageData` on a context that was not flagged `willReadFrequently` forces
 * a GPU readback per call, and this runs per window per mouse event, so the
 * contexts are cached per buffer and created with that flag set.
 */

// TS-only: 2D contexts keyed by buffer, so a mouse move does not re-acquire one
// per window per event. Weak so a disposed buffer takes its context with it.
const CONTEXTS: WeakMap<OffscreenCanvas, OffscreenCanvasRenderingContext2D | null> = new WeakMap();

// TS-only: resolves (and memoises) the readback context for a draw buffer.
function getReadbackContext(buffer: OffscreenCanvas): OffscreenCanvasRenderingContext2D | null
{
    let context = CONTEXTS.get(buffer);

    if(context === undefined)
    {
        context = buffer.getContext('2d', {willReadFrequently: true});
        CONTEXTS.set(buffer, context);
    }

    return context;
}

/**
 * Returns whether `buffer` is a canvas this module can sample.
 *
 * `WindowController` receives its draw buffer as `unknown` — AS3 typed it
 * `BitmapData` — so callers need a guard before sampling.
 */
// TS-only: narrows the `unknown` draw buffer AS3 typed as `BitmapData`.
export function isDrawBuffer(buffer: unknown): buffer is OffscreenCanvas
{
    return typeof OffscreenCanvas !== 'undefined' && buffer instanceof OffscreenCanvas;
}

/**
 * Tests the alpha of a single pixel against a threshold.
 *
 * @param buffer - The draw buffer to sample
 * @param x - Pixel column, in buffer space
 * @param y - Pixel row, in buffer space
 * @param alphaThreshold - Alpha at or above which the pixel counts as a hit
 * @returns `true` when the pixel is opaque enough, `false` otherwise
 */
// TS-only: stands in for flash.display.BitmapData.hitTest() — see module doc.
export function hitTestAlpha(buffer: OffscreenCanvas, x: number, y: number, alphaThreshold: number): boolean
{
    const px = Math.floor(x);
    const py = Math.floor(y);

    if(px < 0 || py < 0 || px >= buffer.width || py >= buffer.height)
    {
        return false;
    }

    const context = getReadbackContext(buffer);

    if(!context)
    {
        return false;
    }

    try
    {
        return context.getImageData(px, py, 1, 1).data[3] >= alphaThreshold;
    }
    catch
    {
        // A tainted or zero-sized buffer throws rather than reporting a miss;
        // treat it as "cannot tell" so the caller falls back to bounds.
        return false;
    }
}
