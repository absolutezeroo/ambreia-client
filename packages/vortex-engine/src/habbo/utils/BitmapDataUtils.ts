/**
 * Downscaling that halves repeatedly instead of resizing once.
 *
 * A single `drawImage` from 4x to 1x samples four source pixels per destination pixel and throws
 * the rest away; halving three times averages all sixteen. The difference was visible on habbicon
 * previews, drawn at 0.5x — its only user until the RPG fork removed Habbicons; kept as the AS3
 * utility it ports.
 *
 * **The class name is unrecoverable from any tree** — `_SafeCls_2871` in the primary, `class_2495`
 * in `win63_version`, absent from PRODUCTION. The *method* name is real in both obfuscated trees;
 * only the class wrapping it is not, so this file is named for what it holds.
 *
 * `AvatarImage` carries its own private copy of the same algorithm, written before this file
 * existed. Left alone: it is private, correct, and merging the two is a refactor of the avatar
 * pipeline.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/_SafeCls_2871.as
 */
export class BitmapDataUtils
{
    /**
	 * AS3 fills the new bitmap with opaque white before drawing; on a canvas the equivalent is simply
	 * not clearing, and `drawImage` composites over transparent black. The alpha channel survives
	 * either way.
	 */
    // AS3: _SafeCls_2871.as::resizeBitmapData()
    private static resizeBitmap(source: ImageBitmap, scale: number): ImageBitmap
    {
        const width = Math.max(1, Math.round(source.width * scale));
        const height = Math.max(1, Math.round(source.height * scale));
        const canvas = new OffscreenCanvas(width, height);
        const context = canvas.getContext('2d');

        if(context === null) return source;

        context.imageSmoothingEnabled = true;
        context.drawImage(source, 0, 0, source.width, source.height, 0, 0, width, height);

        return canvas.transferToImageBitmap();
    }

    /**
	 * The loop condition is `!==`, so a scale that never lands exactly on the target would spin
	 * forever. It cannot: each pass either halves `current` or jumps it straight to `scale`, and the
	 * halving branch only runs while `scale` is still below half of `current`.
	 */
    // AS3: _SafeCls_2871.as::resampleBitmapData()
    static resampleBitmap(source: ImageBitmap, scale: number): ImageBitmap
    {
        if(scale >= 1) return BitmapDataUtils.resizeBitmap(source, scale);

        let result = source;
        let current = 1;

        do
        {
            if(scale < 0.5 * current)
            {
                result = BitmapDataUtils.resizeBitmap(result, 0.5);
                current = 0.5 * current;
            }
            else
            {
                result = BitmapDataUtils.resizeBitmap(result, scale / current);
                current = scale;
            }
        }
        while(current !== scale);

        return result;
    }
}
