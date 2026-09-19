import type {Texture} from 'pixi.js';

/**
 * `averageColor()` and `colorize()`, the two members of AS3's `Canvas` this port needs.
 *
 * The room-photo payload cannot carry pixels, so for the sprites whose appearance is a *downloaded
 * image* — a wall photo, a group badge, a skewed thumbnail — it carries the average colour of that
 * image instead, and the renderer on the other side fills a rectangle with it. Without this those
 * sprites serialise as whatever tint the sprite carries, which for an untinted photo is white.
 *
 * The other two public members stay out, and the claim below is checkable in the primary tree:
 *
 * - `drawQuad()` and `fillTriangle()` have **no call site anywhere** — `grep -rn "drawQuad\|
 *   fillTriangle" com/sulake/` finds only `drawQuad` calling `fillTriangle` inside this file.
 *   They are a software rasteriser for a textured quad, written against `BitmapData.setPixel()`
 *   per pixel, and nothing in the client ever asked for one.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/Canvas.as
 */
export class Canvas
{
    /** AS3's return when there is nothing to average: opaque white. */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/Canvas.as::averageColor()
    private static readonly NO_PIXELS: number = 0xFFFFFF;

    /**
     * `color` multiplied per channel by `tint`, the tint acting as a 0..1 factor per channel.
     *
     * The one caller is `RoomPlane.blend()`, which masks the result with `0xFFFFFF` — so the alpha
     * byte AS3 carries through is discarded before anyone reads it. That matters because AS3's own
     * last line is `(param1 && 0xFF000000) | ...`, a **logical** and, not a bitwise one: it yields
     * `0xFF000000` for any non-zero colour and `0` for black, which is not what "keep the source
     * alpha" would produce. All three source trees agree on the `&&`, so it is the original code
     * and not a decompiler slip; it is reproduced here and then thrown away by the caller exactly
     * as it is there.
     *
     * The three channel products are `uint` in AS3, so the division truncates toward zero.
     *
     * @param color - `0xAARRGGBB` (or `0xRRGGBB`) to tint
     * @param tint - `0xAARRGGBB` whose RGB bytes are the per-channel factors; `0xFFFFFFFF` is a no-op
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/Canvas.as::colorize()
    public static colorize(color: number, tint: number): number
    {
        if(tint === 0xFFFFFFFF) return color;

        const red = Math.trunc((color >>> 16 & 0xFF) * (tint >>> 16 & 0xFF) / 0xFF);
        const green = Math.trunc((color >>> 8 & 0xFF) * (tint >>> 8 & 0xFF) / 0xFF);
        const blue = Math.trunc((color & 0xFF) * (tint & 0xFF) / 0xFF);

        return ((color ? 0xFF000000 : 0) | red << 16 | green << 8 | blue) >>> 0;
    }

    /**
     * The mean RGB of every pixel with a non-zero alpha.
     *
     * Fully transparent pixels are skipped rather than averaged as black — that is what stops a
     * badge on a large transparent canvas from coming back nearly black.
     *
     * DEVIATION: AS3 reads a `BitmapData` with `getPixel32()` per pixel. A PixiJS `Texture` is on
     *   the GPU and has no such accessor; the pixels are read back by drawing the texture's own
     *   source into a scratch 2D canvas once and taking its `ImageData`, which is the same walk
     *   with one upload instead of `width * height` calls. A source that is not drawable — a
     *   compressed or render texture — cannot be read this way and returns the same white AS3
     *   returns for a null bitmap.
     *
     * @param texture - The sprite's texture, or null
     * @returns `0xRRGGBB`, or white when there is nothing to measure
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/Canvas.as::averageColor()
    public static averageColor(texture: Texture | null): number
    {
        const pixels = Canvas.readPixels(texture);

        if(pixels === null) return Canvas.NO_PIXELS;

        let red = 0;
        let green = 0;
        let blue = 0;
        let counted = 0;

        for(let i = 0; i < pixels.length; i += 4)
        {
            if(pixels[i + 3] === 0) continue;

            red += pixels[i];
            green += pixels[i + 1];
            blue += pixels[i + 2];
            counted++;
        }

        if(counted === 0) return Canvas.NO_PIXELS;

        return ((red / counted) << 16) | ((green / counted) << 8) | (blue / counted);
    }

    /**
     * The texture's pixels, or null when its source cannot be drawn into a 2D context.
     *
     * Only the texture's own frame is read: an atlas page would otherwise average every sprite on
     * it.
     */
    // TS-only: AS3 reads the BitmapData directly; a GPU texture has to be drawn to be read.
    private static readPixels(texture: Texture | null): Uint8ClampedArray | null
    {
        if(texture === null) return null;

        const source = (texture.source?.resource ?? null) as CanvasImageSource | null;

        if(source === null) return null;

        const frame = texture.frame;
        const width = Math.max(1, Math.round(frame.width));
        const height = Math.max(1, Math.round(frame.height));

        try
        {
            const scratch = new OffscreenCanvas(width, height);
            const context = scratch.getContext('2d', {willReadFrequently: true});

            if(context === null) return null;

            context.drawImage(source, frame.x, frame.y, width, height, 0, 0, width, height);

            return context.getImageData(0, 0, width, height).data;
        }
        catch
        {
            // A source `drawImage` refuses — a compressed texture, or one whose resource is a
            // WebGL handle rather than an image — is AS3's null bitmap case.
            return null;
        }
    }
}
