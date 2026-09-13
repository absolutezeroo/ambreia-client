import {VariableFxClipRect} from './VariableFxClipRect';
import {VariableFxColorTransform} from './VariableFxColorTransform';
import {toCanvasBlendMode} from './VariableFxBlendMode';

/** The integer box a draw is allowed to touch, after clamping to the target and any clip. */
interface ITargetBounds
{
    left: number;
    top: number;
    right: number;
    bottom: number;
}

/** Anything Canvas2D will `drawImage()`: the artwork from the asset provider, or a scratch canvas. */
export type VariableFxDrawable = ImageBitmap | OffscreenCanvas;

/**
 * Every pixel a VariableFx renderer puts down goes through here.
 *
 * AS3 composites with `BitmapData.draw()`, `copyPixels()` and `copyChannel()`; this is the same
 * eleven operations against a Canvas2D context. Three translations are worth knowing, because they
 * are where a faithful-looking line would be wrong:
 *
 *   - `ColorTransform` has no Canvas equivalent. An alpha-only one is `globalAlpha`, which is free.
 *     A tint is not: it needs the source multiplied by a colour and its alpha put back, which is a
 *     three-step composite on a scratch canvas. {@link applyColorTransform} is that, and it is the
 *     only expensive thing in the file.
 *   - `copyChannel(mask, …, RED, ALPHA)` takes the mask's RED into the destination's ALPHA. Canvas
 *     masking (`destination-in`) uses the mask's *alpha* instead, which for artwork that is opaque
 *     everywhere — as these masks are — masks nothing at all. So the red channel is lifted into
 *     alpha explicitly, with a pixel pass.
 *   - AS3 truncates every coordinate to an int before drawing. Canvas does not, and a half-pixel
 *     offset turns crisp 1px bar edges into a blur, so the same truncation is applied here.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/rendering/VariableFxBitmapComposer.as
 */
export class VariableFxBitmapComposer
{
    // AS3: .../rendering/VariableFxBitmapComposer.as::_bitmapData
    private _bitmapData: OffscreenCanvas;
    private _context: OffscreenCanvasRenderingContext2D;

    // AS3: .../rendering/VariableFxBitmapComposer.as::VariableFxBitmapComposer()
    constructor(bitmapData: OffscreenCanvas)
    {
        this._bitmapData = bitmapData;

        const context = bitmapData.getContext('2d');

        if(context === null) throw new Error('VariableFxBitmapComposer needs a 2d context');

        this._context = context;
    }

    // AS3: .../rendering/VariableFxBitmapComposer.as::get bitmapData()
    get bitmapData(): OffscreenCanvas
    {
        return this._bitmapData;
    }

    // AS3: .../rendering/VariableFxBitmapComposer.as::clampOpacity()
    private static clampOpacity(opacity: number): number
    {
        if(!Number.isFinite(opacity)) return 255;

        return Math.max(0, Math.min(255, opacity));
    }

    // AS3: .../rendering/VariableFxBitmapComposer.as::clear()
    clear(color: number): void
    {
        this.fillRect(0, 0, this._bitmapData.width, this._bitmapData.height, color);
    }

    /**
     * AS3's `fillRect` REPLACES the pixels, alpha included — it is not a paint. A fully transparent
     * colour therefore erases, which is how every renderer starts its frame, so this uses
     * `clearRect` plus a `copy`-composited fill rather than a plain `fillRect`.
     */
    // AS3: .../rendering/VariableFxBitmapComposer.as::fillRect()
    fillRect(x: number, y: number, width: number, height: number, color: number): void
    {
        const bounds = this.getTargetBounds(x, y, width, height);

        if(bounds.left >= bounds.right || bounds.top >= bounds.bottom) return;

        const w = bounds.right - bounds.left;
        const h = bounds.bottom - bounds.top;

        this._context.save();
        this._context.globalCompositeOperation = 'copy';
        this._context.globalAlpha = 1;
        this._context.fillStyle = VariableFxBitmapComposer.toCssColor(color);
        this._context.fillRect(bounds.left, bounds.top, w, h);
        this._context.restore();
    }

    // AS3: .../rendering/VariableFxBitmapComposer.as::drawLayer()
    drawLayer(
        source: VariableFxDrawable,
        x: number,
        y: number,
        blendMode: string = 'normal',
        opacity: number = 255,
        clipRect: VariableFxClipRect | null = null
    ): void
    {
        this.drawBitmap(source, x, y, blendMode, opacity, clipRect);
    }

    // AS3: .../rendering/VariableFxBitmapComposer.as::drawTintedLayer()
    drawTintedLayer(
        source: VariableFxDrawable,
        x: number,
        y: number,
        tint: number,
        blendMode: string = 'normal',
        opacity: number = 255,
        clipRect: VariableFxClipRect | null = null
    ): void
    {
        const tinted = this.applyColorTransform(source, VariableFxBitmapComposer.createTintColorTransform(tint, opacity));

        if(tinted === null) return;

        // Opacity is already inside the tint transform, as in AS3 — passing it again here would
        // square it.
        this.blit(tinted, x | 0, y | 0, blendMode, 255, clipRect);
    }

    /**
     * Draws `source` through `mask`, where the mask's RED channel is the coverage.
     *
     * The intersection is computed first and nothing outside it is touched — a mask smaller than
     * the source hides the rest of it, rather than leaving it unmasked.
     */
    // AS3: .../rendering/VariableFxBitmapComposer.as::drawMaskedLayer()
    drawMaskedLayer(
        source: VariableFxDrawable,
        mask: VariableFxDrawable,
        sourceX: number,
        sourceY: number,
        maskX: number,
        maskY: number,
        blendMode: string,
        opacity: number,
        clipRect: VariableFxClipRect | null = null
    ): void
    {
        const target = this.getTargetBounds(sourceX, sourceY, source.width, source.height, clipRect);

        const left = Math.max(target.left, maskX | 0);
        const top = Math.max(target.top, maskY | 0);
        const right = Math.min(target.right, (maskX | 0) + mask.width);
        const bottom = Math.min(target.bottom, (maskY | 0) + mask.height);

        const width = right - left;
        const height = bottom - top;

        if(width <= 0 || height <= 0) return;

        const scratch = new OffscreenCanvas(width, height);
        const context = scratch.getContext('2d');

        if(context === null) return;

        context.drawImage(source, (sourceX | 0) - left, (sourceY | 0) - top);

        const coverage = VariableFxBitmapComposer.redChannelAsAlpha(mask, left - (maskX | 0), top - (maskY | 0), width, height);

        if(coverage !== null)
        {
            context.globalCompositeOperation = 'destination-in';
            context.drawImage(coverage, 0, 0);
        }

        this.drawBitmap(scratch, left, top, blendMode, opacity);
    }

    // AS3: .../rendering/VariableFxBitmapComposer.as::drawSourceRegion()
    drawSourceRegion(
        source: VariableFxDrawable,
        sourceX: number,
        sourceY: number,
        width: number,
        height: number,
        destX: number,
        destY: number,
        blendMode: string,
        opacity: number,
        clipRect: VariableFxClipRect | null = null,
        colorTransform: VariableFxColorTransform | null = null
    ): void
    {
        this.drawSourceRegionWithTransform(
            source, sourceX, sourceY, width, height, destX, destY, blendMode, clipRect,
            VariableFxBitmapComposer.composeColorTransformWithOpacity(colorTransform, opacity)
        );
    }

    // AS3: .../rendering/VariableFxBitmapComposer.as::drawBitmap()
    private drawBitmap(
        source: VariableFxDrawable,
        x: number,
        y: number,
        blendMode: string,
        opacity: number,
        clipRect: VariableFxClipRect | null = null
    ): void
    {
        const alpha = VariableFxBitmapComposer.clampOpacity(opacity);
        const clip = VariableFxBitmapComposer.createClipRectangle(clipRect);

        if(alpha <= 0 || (clip !== null && (clip.width <= 0 || clip.height <= 0))) return;

        this.blit(source, x | 0, y | 0, blendMode, alpha, clipRect);
    }

    // AS3: .../rendering/VariableFxBitmapComposer.as::drawSourceRegionWithTransform()
    private drawSourceRegionWithTransform(
        source: VariableFxDrawable,
        sourceX: number,
        sourceY: number,
        width: number,
        height: number,
        destX: number,
        destY: number,
        blendMode: string,
        clipRect: VariableFxClipRect | null,
        colorTransform: VariableFxColorTransform | null
    ): void
    {
        const bounds = this.getTargetBounds(destX, destY, width, height, clipRect);
        const clip = VariableFxBitmapComposer.boundsToClipRect(bounds);

        if(clip.width <= 0 || clip.height <= 0 || width <= 0 || height <= 0) return;

        const transformed = colorTransform === null || colorTransform.isAlphaOnly
            ? source
            : this.applyColorTransform(source, colorTransform);

        if(transformed === null) return;

        const alpha = colorTransform === null ? 255 : colorTransform.alphaMultiplier * 255;

        // The source rect is expressed as an offset, exactly as AS3's translation matrix does it:
        // the clip is what selects the region, not a source rectangle.
        this.blit(transformed, (destX | 0) - (sourceX | 0), (destY | 0) - (sourceY | 0), blendMode, alpha, clip);
    }

    /**
     * The one place a draw actually happens. Everything above resolves its arguments and calls this.
     */
    // TS-only: AS3 reaches `BitmapData.draw()` directly from each method; Canvas needs the state
    //   (composite op, alpha, clip) saved and restored around every draw, which is worth saying once.
    private blit(
        source: VariableFxDrawable,
        x: number,
        y: number,
        blendMode: string,
        opacity: number,
        clipRect: VariableFxClipRect | null
    ): void
    {
        const alpha = VariableFxBitmapComposer.clampOpacity(opacity);

        if(alpha <= 0) return;

        this._context.save();
        this._context.globalCompositeOperation = toCanvasBlendMode(blendMode);
        this._context.globalAlpha = alpha / 255;

        if(clipRect !== null)
        {
            this._context.beginPath();
            this._context.rect(clipRect.x, clipRect.y, Math.max(0, clipRect.width), Math.max(0, clipRect.height));
            this._context.clip();
        }

        this._context.drawImage(source, x, y);
        this._context.restore();
    }

    /**
     * Multiplies `source` by the transform's RGB and returns a new canvas.
     *
     * Three passes, because Canvas has no channel multiply: the source, then the colour at
     * `multiply`, then the source again at `destination-in` to restore the alpha the multiply pass
     * flattened. The alpha multiplier is deliberately NOT applied here — it is `globalAlpha` at the
     * final draw, where it composes with the destination instead of being baked in.
     */
    // TS-only: AS3 hands a ColorTransform to `BitmapData.draw()`; Canvas2D has no such parameter.
    private applyColorTransform(source: VariableFxDrawable, transform: VariableFxColorTransform): OffscreenCanvas | null
    {
        const scratch = new OffscreenCanvas(source.width, source.height);
        const context = scratch.getContext('2d');

        if(context === null) return null;

        context.drawImage(source, 0, 0);

        context.globalCompositeOperation = 'multiply';
        context.fillStyle = `rgb(${Math.round(transform.redMultiplier * 255)} ${Math.round(transform.greenMultiplier * 255)} ${Math.round(transform.blueMultiplier * 255)})`;
        context.fillRect(0, 0, source.width, source.height);

        context.globalCompositeOperation = 'destination-in';
        context.drawImage(source, 0, 0);

        return scratch;
    }

    /**
     * The mask's red channel, as an alpha-only image the caller can `destination-in` with.
     */
    // TS-only: AS3 does this with `copyChannel(..., RED, ALPHA)`, which Canvas has no form of.
    private static redChannelAsAlpha(
        mask: VariableFxDrawable,
        sourceX: number,
        sourceY: number,
        width: number,
        height: number
    ): OffscreenCanvas | null
    {
        const scratch = new OffscreenCanvas(width, height);
        const context = scratch.getContext('2d');

        if(context === null) return null;

        context.drawImage(mask, -sourceX, -sourceY);

        const image = context.getImageData(0, 0, width, height);
        const pixels = image.data;

        for(let i = 0; i < pixels.length; i += 4)
        {
            pixels[i + 3] = pixels[i]!;
        }

        context.putImageData(image, 0, 0);

        return scratch;
    }

    // AS3: .../rendering/VariableFxBitmapComposer.as::createAlphaColorTransform()
    private static createAlphaColorTransform(opacity: number): VariableFxColorTransform | null
    {
        const alpha = VariableFxBitmapComposer.clampOpacity(opacity);

        return alpha >= 255 ? null : new VariableFxColorTransform(1, 1, 1, alpha / 255);
    }

    // AS3: .../rendering/VariableFxBitmapComposer.as::composeColorTransformWithOpacity()
    private static composeColorTransformWithOpacity(
        transform: VariableFxColorTransform | null,
        opacity: number
    ): VariableFxColorTransform | null
    {
        const alpha = VariableFxBitmapComposer.clampOpacity(opacity);

        if(transform === null) return VariableFxBitmapComposer.createAlphaColorTransform(alpha);

        return new VariableFxColorTransform(
            transform.redMultiplier,
            transform.greenMultiplier,
            transform.blueMultiplier,
            transform.alphaMultiplier * (alpha / 255)
        );
    }

    // AS3: .../rendering/VariableFxBitmapComposer.as::createClipRectangle()
    private static createClipRectangle(clipRect: VariableFxClipRect | null): VariableFxClipRect | null
    {
        if(clipRect === null) return null;

        return new VariableFxClipRect(clipRect.x, clipRect.y, Math.max(0, clipRect.width), Math.max(0, clipRect.height));
    }

    /**
     * A colour's channels as RGB multipliers, with its own alpha folded into the opacity.
     *
     * The `/ 65025` is `255 * 255`: the colour's alpha byte and the opacity byte are multiplied
     * together and normalised in one go.
     */
    // AS3: .../rendering/VariableFxBitmapComposer.as::createTintColorTransform()
    private static createTintColorTransform(color: number, opacity: number): VariableFxColorTransform
    {
        const alpha = VariableFxBitmapComposer.clampOpacity(opacity);

        return new VariableFxColorTransform(
            ((color >>> 16) & 0xFF) / 255,
            ((color >>> 8) & 0xFF) / 255,
            (color & 0xFF) / 255,
            ((color >>> 24) & 0xFF) * alpha / 65025
        );
    }

    // AS3: .../rendering/VariableFxBitmapComposer.as::boundsToClipRect()
    private static boundsToClipRect(bounds: ITargetBounds): VariableFxClipRect
    {
        return new VariableFxClipRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);
    }

    /**
     * Where a draw may land: the requested box, clamped to the target bitmap and then to the clip.
     */
    // AS3: .../rendering/VariableFxBitmapComposer.as::getTargetBounds()
    private getTargetBounds(
        x: number,
        y: number,
        width: number,
        height: number,
        clipRect: VariableFxClipRect | null = null
    ): ITargetBounds
    {
        const originX = x | 0;
        const originY = y | 0;

        let left = Math.max(0, originX);
        let top = Math.max(0, originY);
        let right = Math.min(this._bitmapData.width, originX + Math.max(0, width | 0));
        let bottom = Math.min(this._bitmapData.height, originY + Math.max(0, height | 0));

        if(clipRect !== null)
        {
            left = Math.max(left, clipRect.x);
            top = Math.max(top, clipRect.y);
            right = Math.min(right, clipRect.x + Math.max(0, clipRect.width));
            bottom = Math.min(bottom, clipRect.y + Math.max(0, clipRect.height));
        }

        return {left, top, right, bottom};
    }

    /** AS3 colours are 0xAARRGGBB uints; CSS wants the alpha last and normalised. */
    // TS-only: AS3 hands the uint straight to `fillRect()`.
    private static toCssColor(color: number): string
    {
        const a = ((color >>> 24) & 0xFF) / 255;
        const r = (color >>> 16) & 0xFF;
        const g = (color >>> 8) & 0xFF;
        const b = color & 0xFF;

        return `rgb(${r} ${g} ${b} / ${a})`;
    }
}
