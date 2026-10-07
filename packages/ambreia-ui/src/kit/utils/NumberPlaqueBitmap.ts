import type {IWindowManager} from '../IWindowManager';

/**
 * Renders a number as the little glyph strip on a rare's plaque — the serial number on a limited
 * edition, the contents count on a chest.
 *
 * Name DERIVED, not recovered: the class is `_SafeCls_4213` in the primary tree and does not exist
 * in the 2016 one. `createBitmap` and `GLYPH_ASSET_PREFIX` are real.
 *
 * The digits are not a font. Each is its own image, and they are proportional — "1" is 3px wide
 * where every other digit is 5 — which is why the strip is measured before it is drawn rather than
 * laid out on a fixed pitch. AS3's leading-zero suppression is written out as five nested tests
 * rather than a loop; the shape here is the same, just expressed as one.
 *
 * These ten names do not exist as files in the WIN63 dump. The manifest declares them as regions
 * inside `unique_item_label_number_glyphs.png`, and `tools/import-manifest-subassets.mjs` cuts them
 * out at build time, which is why an ordinary lookup finds them.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/_SafeCls_4213.as
 */
export class NumberPlaqueBitmap
{
    // AS3: _SafeCls_4213.as::GLYPH_ASSET_PREFIX
    private static readonly GLYPH_ASSET_PREFIX: string = 'unique_item_number_glyph_';

    /**
     * The strip, centred in a `width` x `height` transparent plate.
     *
     * Out of range gives an empty plate rather than a clamped number: a six-digit ceiling is what
     * the plaque has room for, and a wrong number is worse than none.
     */
    // AS3: _SafeCls_4213.as::createBitmap()
    public static createBitmap(
        windowManager: IWindowManager | null,
        value: number,
        width: number,
        height: number
    ): ImageBitmap | null
    {
        const canvas = new OffscreenCanvas(Math.max(1, width), Math.max(1, height));
        const ctx = canvas.getContext('2d');

        if(ctx === null) return null;

        if(value < 0 || value > 999999) return canvas.transferToImageBitmap();

        const digits: ImageBitmap[] = [];

        let started = false;
        let stripWidth = 0;

        // Highest place first, and every place below the first non-zero one is kept — the units
        // digit unconditionally, so 0 renders as "0" rather than as nothing.
        for(let place = 100000; place >= 1; place = place / 10)
        {
            const digit = Math.trunc(value / place) % 10;

            if(digit > 0) started = true;

            if(!started && place > 1) continue;

            const glyph = windowManager?.resourceManager?.getAsset(NumberPlaqueBitmap.GLYPH_ASSET_PREFIX + digit) ?? null;

            if(glyph === null) continue;

            digits.push(glyph);
            stripWidth += glyph.width;
        }

        if(digits.length === 0) return canvas.transferToImageBitmap();

        // AS3's own off-by-one: the measured width is reduced by 1 before centring, which nudges
        // the strip half a pixel right of true centre. Kept, because the plaque art was drawn
        // around it.
        let x = (width - (stripWidth - 1)) / 2;

        for(const glyph of digits)
        {
            ctx.drawImage(glyph, x, 0);
            x += glyph.width;
        }

        return canvas.transferToImageBitmap();
    }
}
