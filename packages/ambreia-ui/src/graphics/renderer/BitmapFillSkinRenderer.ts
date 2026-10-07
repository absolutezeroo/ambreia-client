import type {IWindow} from '../../IWindow';
import type {BitmapFillController} from '../../components/BitmapFillController';
import {SkinRenderer} from './SkinRenderer';

type CanvasImage = ImageBitmap | OffscreenCanvas;

/**
 * Draws a bitmap fill in stretch/tile/center/cover/contain modes, with
 * optional greyscale + tint and tile spacing.
 *
 * The AS3 original rasterizes into an intermediate `BitmapData` using
 * `Matrix`/`Graphics.beginBitmapFill`; this port uses `drawImage()` for the
 * scaled modes and a small repeating tile canvas (`CanvasPattern`) for the
 * "tile" mode, which is the direct Canvas2D equivalent of a bitmap-fill
 * `Graphics` shape. The processed (greyscale/tinted) bitmap and the tile
 * cell are cached per-renderer and only rebuilt when their inputs change,
 * matching the AS3 caching fields.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/BitmapFillSkinRenderer.as
 */
export class BitmapFillSkinRenderer extends SkinRenderer
{
    private _processedBitmap: OffscreenCanvas | null = null;
    private _processedSource: CanvasImage | null = null;
    private _processedGreyscale: boolean | null = null;
    private _processedTint: boolean | null = null;
    private _processedColor: number | null = null;

    private _tileCanvas: OffscreenCanvas | null = null;
    private _tileSource: CanvasImage | null = null;
    private _tileScaleX: number | null = null;
    private _tileScaleY: number | null = null;
    private _tileSpacing: number | null = null;

    constructor(name: string)
    {
        super(name);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/BitmapFillSkinRenderer.as::scaleForMode()
    public static scaleForMode(fillMode: string, srcW: number, srcH: number, dstW: number, dstH: number): number
    {
        if(srcW <= 0 || srcH <= 0 || dstW <= 0 || dstH <= 0)
        {
            return 1;
        }

        const scaleX = dstW / srcW;
        const scaleY = dstH / srcH;

        if(fillMode === 'contain')
        {
            return Math.min(scaleX, scaleY);
        }

        return Math.max(scaleX, scaleY);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/BitmapFillSkinRenderer.as::tileStep()
    public static tileStep(size: number, scale: number, spacing: number): number
    {
        if(Number.isNaN(size) || size <= 0)
        {
            size = 1;
        }

        if(Number.isNaN(scale) || scale === 0)
        {
            scale = 1;
        }

        const normalizedSpacing = Number.isNaN(spacing) ? 0 : Math.max(0, spacing);

        return Math.max(1, size * Math.abs(scale) + normalizedSpacing);
    }

    // AS3: .../src/com/sulake/core/window/graphics/renderer/BitmapFillSkinRenderer.as::normalizedZoom()
    private static normalizedZoom(zoom: number): number
    {
        return Number.isNaN(zoom) || zoom === 0 ? 1 : Math.abs(zoom);
    }

    // AS3: .../src/com/sulake/core/window/graphics/renderer/BitmapFillSkinRenderer.as::isFlippedX()
    private static isFlippedX(controller: BitmapFillController): boolean
    {
        return (controller.zoomX < 0) !== controller.flipX;
    }

    // AS3: .../src/com/sulake/core/window/graphics/renderer/BitmapFillSkinRenderer.as::isFlippedY()
    private static isFlippedY(controller: BitmapFillController): boolean
    {
        return (controller.zoomY < 0) !== controller.flipY;
    }

    // AS3: .../src/com/sulake/core/window/graphics/renderer/BitmapFillSkinRenderer.as::scaleXForController()
    private static scaleXForController(controller: BitmapFillController): number
    {
        return BitmapFillSkinRenderer.normalizedZoom(controller.zoomX) * (BitmapFillSkinRenderer.isFlippedX(controller) ? -1 : 1);
    }

    // AS3: .../src/com/sulake/core/window/graphics/renderer/BitmapFillSkinRenderer.as::scaleYForController()
    private static scaleYForController(controller: BitmapFillController): number
    {
        return BitmapFillSkinRenderer.normalizedZoom(controller.zoomY) * (BitmapFillSkinRenderer.isFlippedY(controller) ? -1 : 1);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/BitmapFillSkinRenderer.as::xForPivot()/yForPivot()
    // Pivot values are a 3x3 grid (see PivotPoint enum): column = pivot % 3 (left/center/right),
    // row = floor(pivot / 3) (top/middle/bottom) — identical numbering in AS3 and TS.
    private static xForPivot(rect: { x: number; width: number }, size: number, pivot: number): number
    {
        switch(pivot % 3)
        {
            case 1:
                return rect.x + (rect.width - size) / 2;
            case 2:
                return rect.x + rect.width - size;
            default:
                return rect.x;
        }
    }

    // AS3: .../src/com/sulake/core/window/graphics/renderer/BitmapFillSkinRenderer.as::yForPivot()
    private static yForPivot(rect: { y: number; height: number }, size: number, pivot: number): number
    {
        switch(Math.floor(pivot / 3))
        {
            case 1:
                return rect.y + (rect.height - size) / 2;
            case 2:
                return rect.y + rect.height - size;
            default:
                return rect.y;
        }
    }

    private static clampByte(value: number): number
    {
        return value < 0 ? 0 : (value > 255 ? 255 : value);
    }

    public override dispose(): void
    {
        this._processedBitmap = null;
        this._processedSource = null;
        this._tileCanvas = null;
        this._tileSource = null;
        super.dispose();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/BitmapFillSkinRenderer.as::draw()
    public override draw(
        window: IWindow,
        ctx: OffscreenCanvasRenderingContext2D,
        rect: { x: number; y: number; width: number; height: number },
        _state: number,
        _colorize: boolean
    ): void
    {
        const controller = window as unknown as BitmapFillController;

        if(!controller || !rect || rect.width <= 0 || rect.height <= 0)
        {
            return;
        }

        ctx.clearRect(rect.x, rect.y, rect.width, rect.height);

        const source = controller.bitmapData;

        if(!source || source.width <= 0 || source.height <= 0)
        {
            return;
        }

        const prepared = this.prepareBitmapData(source, controller);

        switch(controller.fillMode)
        {
            case 'tile':
                this.drawTile(controller, ctx, rect, prepared);
                break;
            case 'center':
                this.drawScaled(
                    controller, ctx, rect, prepared,
                    BitmapFillSkinRenderer.scaleXForController(controller),
                    BitmapFillSkinRenderer.scaleYForController(controller)
                );
                break;
            case 'cover':
                this.drawFitted(controller, ctx, rect, prepared, 'cover');
                break;
            case 'contain':
                this.drawFitted(controller, ctx, rect, prepared, 'contain');
                break;
            default:
                this.drawStretch(controller, ctx, rect, prepared);
        }
    }

    // AS3: .../src/com/sulake/core/window/graphics/renderer/BitmapFillSkinRenderer.as::drawStretch()
    private drawStretch(
        controller: BitmapFillController,
        ctx: OffscreenCanvasRenderingContext2D,
        rect: { x: number; y: number; width: number; height: number },
        bitmap: CanvasImage
    ): void
    {
        const flippedX = BitmapFillSkinRenderer.isFlippedX(controller);
        const flippedY = BitmapFillSkinRenderer.isFlippedY(controller);

        ctx.save();
        ctx.translate(rect.x + (flippedX ? rect.width : 0), rect.y + (flippedY ? rect.height : 0));
        ctx.scale(flippedX ? -1 : 1, flippedY ? -1 : 1);
        ctx.drawImage(bitmap, 0, 0, rect.width, rect.height);
        ctx.restore();
    }

    // AS3: .../src/com/sulake/core/window/graphics/renderer/BitmapFillSkinRenderer.as::drawFitted()
    private drawFitted(
        controller: BitmapFillController,
        ctx: OffscreenCanvasRenderingContext2D,
        rect: { x: number; y: number; width: number; height: number },
        bitmap: CanvasImage,
        mode: 'cover' | 'contain'
    ): void
    {
        const zoomX = BitmapFillSkinRenderer.normalizedZoom(controller.zoomX);
        const zoomY = BitmapFillSkinRenderer.normalizedZoom(controller.zoomY);
        const fitScale = BitmapFillSkinRenderer.scaleForMode(mode, bitmap.width * zoomX, bitmap.height * zoomY, rect.width, rect.height);

        this.drawScaled(
            controller, ctx, rect, bitmap,
            BitmapFillSkinRenderer.scaleXForController(controller) * fitScale,
            BitmapFillSkinRenderer.scaleYForController(controller) * fitScale
        );
    }

    // AS3: .../src/com/sulake/core/window/graphics/renderer/BitmapFillSkinRenderer.as::drawScaled()
    private drawScaled(
        controller: BitmapFillController,
        ctx: OffscreenCanvasRenderingContext2D,
        rect: { x: number; y: number; width: number; height: number },
        bitmap: CanvasImage,
        scaleX: number,
        scaleY: number
    ): void
    {
        const width = bitmap.width * Math.abs(scaleX);
        const height = bitmap.height * Math.abs(scaleY);
        const x = BitmapFillSkinRenderer.xForPivot(rect, width, controller.pivotPoint);
        const y = BitmapFillSkinRenderer.yForPivot(rect, height, controller.pivotPoint);

        ctx.save();
        ctx.beginPath();
        ctx.rect(rect.x, rect.y, rect.width, rect.height);
        ctx.clip();
        ctx.translate(scaleX < 0 ? x + width : x, scaleY < 0 ? y + height : y);
        ctx.scale(scaleX < 0 ? -1 : 1, scaleY < 0 ? -1 : 1);
        ctx.drawImage(bitmap, 0, 0, bitmap.width * Math.abs(scaleX), bitmap.height * Math.abs(scaleY));
        ctx.restore();
    }

    // AS3: .../src/com/sulake/core/window/graphics/renderer/BitmapFillSkinRenderer.as::drawTile()
    private drawTile(
        controller: BitmapFillController,
        ctx: OffscreenCanvasRenderingContext2D,
        rect: { x: number; y: number; width: number; height: number },
        bitmap: CanvasImage
    ): void
    {
        const scaleX = BitmapFillSkinRenderer.scaleXForController(controller);
        const scaleY = BitmapFillSkinRenderer.scaleYForController(controller);
        const spacing = Math.max(0, controller.spacing);
        const stepX = BitmapFillSkinRenderer.tileStep(bitmap.width, scaleX, spacing);
        const stepY = BitmapFillSkinRenderer.tileStep(bitmap.height, scaleY, spacing);
        const originX = BitmapFillSkinRenderer.xForPivot(rect, stepX, controller.pivotPoint);
        const originY = BitmapFillSkinRenderer.yForPivot(rect, stepY, controller.pivotPoint);

        const tile = this.tileBitmapFor(bitmap, scaleX, scaleY, spacing, stepX, stepY);
        const pattern = ctx.createPattern(tile, 'repeat');

        if(!pattern)
        {
            return;
        }

        pattern.setTransform(new DOMMatrix().translate(originX, originY));

        ctx.save();
        ctx.fillStyle = pattern;
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        ctx.restore();
    }

    // AS3: .../src/com/sulake/core/window/graphics/renderer/BitmapFillSkinRenderer.as::tileBitmapFor()
    private tileBitmapFor(
        bitmap: CanvasImage,
        scaleX: number,
        scaleY: number,
        spacing: number,
        stepX: number,
        stepY: number
    ): OffscreenCanvas
    {
        const width = Math.ceil(stepX);
        const height = Math.ceil(stepY);

        if(
            this._tileCanvas
			&& this._tileSource === bitmap
			&& this._tileScaleX === scaleX
			&& this._tileScaleY === scaleY
			&& this._tileSpacing === spacing
			&& this._tileCanvas.width === width
			&& this._tileCanvas.height === height
        )
        {
            return this._tileCanvas;
        }

        const canvas = new OffscreenCanvas(width, height);
        const tctx = canvas.getContext('2d')!;

        tctx.save();
        tctx.translate(scaleX < 0 ? bitmap.width * Math.abs(scaleX) : 0, scaleY < 0 ? bitmap.height * Math.abs(scaleY) : 0);
        tctx.scale(scaleX, scaleY);
        tctx.drawImage(bitmap, 0, 0);
        tctx.restore();

        this._tileCanvas = canvas;
        this._tileSource = bitmap;
        this._tileScaleX = scaleX;
        this._tileScaleY = scaleY;
        this._tileSpacing = spacing;

        return canvas;
    }

    // AS3: .../src/com/sulake/core/window/graphics/renderer/BitmapFillSkinRenderer.as::prepareBitmapData()
    private prepareBitmapData(source: ImageBitmap, controller: BitmapFillController): CanvasImage
    {
        if(!controller.greyscale && !controller.tint)
        {
            this._processedBitmap = null;
            this._processedSource = null;

            return source;
        }

        const color = controller.tint ? controller.color : 0;

        if(
            this._processedBitmap
			&& this._processedSource === source
			&& this._processedGreyscale === controller.greyscale
			&& this._processedTint === controller.tint
			&& this._processedColor === color
        )
        {
            return this._processedBitmap;
        }

        const canvas = new OffscreenCanvas(source.width, source.height);
        const pctx = canvas.getContext('2d', {willReadFrequently: true})!;

        pctx.drawImage(source, 0, 0);

        const image = pctx.getImageData(0, 0, source.width, source.height);
        const data = image.data;

        if(controller.greyscale)
        {
            for(let i = 0; i < data.length; i += 4)
            {
                const lum = (data[i] * 0.212671) + (data[i + 1] * 0.71516) + (data[i + 2] * 0.072169);

                data[i] = BitmapFillSkinRenderer.clampByte(lum);
                data[i + 1] = BitmapFillSkinRenderer.clampByte(lum);
                data[i + 2] = BitmapFillSkinRenderer.clampByte(lum);
            }
        }

        if(controller.tint)
        {
            const rMult = ((color >> 16) & 0xFF) / 255;
            const gMult = ((color >> 8) & 0xFF) / 255;
            const bMult = (color & 0xFF) / 255;

            for(let i = 0; i < data.length; i += 4)
            {
                data[i] = BitmapFillSkinRenderer.clampByte(data[i] * rMult);
                data[i + 1] = BitmapFillSkinRenderer.clampByte(data[i + 1] * gMult);
                data[i + 2] = BitmapFillSkinRenderer.clampByte(data[i + 2] * bMult);
            }
        }

        pctx.putImageData(image, 0, 0);

        this._processedBitmap = canvas;
        this._processedSource = source;
        this._processedGreyscale = controller.greyscale;
        this._processedTint = controller.tint;
        this._processedColor = color;

        return canvas;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/BitmapFillSkinRenderer.as::isStateDrawable()
    public override isStateDrawable(_state: number): boolean
    {
        return true;
    }
}
