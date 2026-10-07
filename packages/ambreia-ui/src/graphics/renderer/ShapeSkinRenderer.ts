import type {IWindow} from '../../IWindow';
import type {ShapeController} from '../../components/ShapeController';
import {SkinRenderer} from './SkinRenderer';
import {HsvLayerColor} from './HsvLayerColor';

/**
 * Draws a vector shape (rectangle, round rectangle, ellipse, rhombus) with
 * an optional inset stroke, using canvas path drawing.
 *
 * The AS3 original rasterizes shapes pixel-by-pixel into a `BitmapData`;
 * this port uses native Canvas2D path fill/stroke, which is visually
 * equivalent and far cheaper under a canvas-based renderer.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ShapeSkinRenderer.as
 */
export class ShapeSkinRenderer extends SkinRenderer
{
    constructor(name: string)
    {
        super(name);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ShapeSkinRenderer.as::alphaFromColor()
    public static alphaFromColor(color: number): number
    {
        const alphaByte = (color >>> 24) & 0xFF;

        return alphaByte === 0 ? 1 : alphaByte / 255;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ShapeSkinRenderer.as::snappedThickness()
    private static snappedThickness(value: number): number
    {
        return Number.isNaN(value) || value <= 0 ? 0 : Math.max(1, Math.round(value));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ShapeSkinRenderer.as::snap()
    private static snap(value: number): number
    {
        return Number.isNaN(value) ? 0 : Math.round(value);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ShapeSkinRenderer.as::cornerRadius()
    private static cornerRadius(radius: number, width: number, height: number): number
    {
        if(Number.isNaN(radius) || Number.isNaN(width) || Number.isNaN(height) || radius <= 0 || width <= 0 || height <= 0)
        {
            return 0;
        }

        return Math.min(Math.round(radius), Math.floor(width / 2), Math.floor(height / 2));
    }

    /**
	 * Fills the enabled sides of a rectangular stroke as four separate strips.
	 *
	 * The strips are AS3's, snapping included: every edge is rounded to a whole
	 * pixel and the thickness to at least 1, so a 0.5px window rect cannot smear a
	 * border across two rows. Where AS3 writes them with fillPixelRect() into a
	 * BitmapData, this fills with the canvas — same rectangles.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ShapeSkinRenderer.as::drawRectStrokeSides()
    public static drawRectStrokeSides(
        ctx: OffscreenCanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        strokeThickness: number,
        color: number,
        top: boolean,
        right: boolean,
        bottom: boolean,
        left: boolean
    ): void
    {
        const x0 = ShapeSkinRenderer.snap(x);
        const y0 = ShapeSkinRenderer.snap(y);
        const x1 = ShapeSkinRenderer.snap(x + width);
        const y1 = ShapeSkinRenderer.snap(y + height);
        const thickness = ShapeSkinRenderer.snappedThickness(strokeThickness);

        if(thickness <= 0 || x1 <= x0 || y1 <= y0) return;

        ctx.fillStyle = ShapeSkinRenderer.toCss(color, ShapeSkinRenderer.alphaFromColor(color));

        if(top) ctx.fillRect(x0, y0, x1 - x0, thickness);
        if(right) ctx.fillRect(x1 - thickness, y0, thickness, y1 - y0);
        if(bottom) ctx.fillRect(x0, y1 - thickness, x1 - x0, thickness);
        if(left) ctx.fillRect(x0, y0, thickness, y1 - y0);
    }

    /**
	 * Strokes a rounded rectangle inset by half the thickness.
	 *
	 * AS3 rasterizes the ring pixel by pixel (roundRectContainsPixel() on the outer
	 * rect minus the inner one); this port strokes a Path2D instead, the same
	 * Canvas2D-over-BitmapData trade this class makes everywhere. The corner radius
	 * is clamped exactly as AS3's cornerRadius() does — rounded, then held to half
	 * the shorter side — so the two agree on the geometry even where the edges differ
	 * by anti-aliasing.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ShapeSkinRenderer.as::drawRoundRectStroke()
    public static drawRoundRectStroke(
        ctx: OffscreenCanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number,
        strokeThickness: number,
        color: number
    ): void
    {
        const x0 = ShapeSkinRenderer.snap(x);
        const y0 = ShapeSkinRenderer.snap(y);
        const x1 = ShapeSkinRenderer.snap(x + width);
        const y1 = ShapeSkinRenderer.snap(y + height);
        const thickness = ShapeSkinRenderer.snappedThickness(strokeThickness);

        if(thickness <= 0 || x1 <= x0 || y1 <= y0) return;

        const inset = thickness / 2;
        const clampedRadius = ShapeSkinRenderer.cornerRadius(radius, x1 - x0, y1 - y0);
        const path = new Path2D();

        path.roundRect(x0 + inset, y0 + inset, x1 - x0 - thickness, y1 - y0 - thickness, clampedRadius);

        ctx.strokeStyle = ShapeSkinRenderer.toCss(color, ShapeSkinRenderer.alphaFromColor(color));
        ctx.lineWidth = thickness;
        ctx.stroke(path);
    }

    private static toCss(color: number, alpha: number): string
    {
        const r = (color >> 16) & 0xFF;
        const g = (color >> 8) & 0xFF;
        const b = color & 0xFF;

        return `rgba(${r},${g},${b},${alpha})`;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ShapeSkinRenderer.as::draw()
    public override draw(
        window: IWindow,
        ctx: OffscreenCanvasRenderingContext2D,
        rect: { x: number; y: number; width: number; height: number },
        _state: number,
        _colorize: boolean
    ): void
    {
        const shapeWindow = window as unknown as ShapeController;

        if(!shapeWindow || !rect || rect.width <= 0 || rect.height <= 0)
        {
            return;
        }

        ctx.clearRect(rect.x, rect.y, rect.width, rect.height);

        const thickness = ShapeSkinRenderer.snappedThickness(shapeWindow.strokeThickness);
        const strokeColor = shapeWindow.strokeHsvShade !== 0
            ? HsvLayerColor.deriveColor(window.color, shapeWindow.strokeHsvShade)
            : shapeWindow.strokeColor;

        const fillAlpha = ShapeSkinRenderer.alphaFromColor(window.color);
        const strokeAlpha = ShapeSkinRenderer.alphaFromColor(strokeColor);

        ctx.fillStyle = ShapeSkinRenderer.toCss(window.color, fillAlpha);

        if(thickness > 0)
        {
            ctx.strokeStyle = ShapeSkinRenderer.toCss(strokeColor, strokeAlpha);
            ctx.lineWidth = thickness;
        }

        const path = ShapeSkinRenderer.buildPath(shapeWindow.shape, rect, thickness, shapeWindow.radius);

        ctx.fill(path);

        if(thickness > 0)
        {
            ctx.stroke(path);
        }
    }

    private static buildPath(
        shape: string,
        rect: { x: number; y: number; width: number; height: number },
        thickness: number,
        radius: number
    ): Path2D
    {
        const path = new Path2D();
        const inset = thickness / 2;

        switch(shape)
        {
            case 'round_rectangle':
            {
                const clampedRadius = Math.max(0, Math.min(rect.width / 2, rect.height / 2, radius));

                path.roundRect(rect.x + inset, rect.y + inset, rect.width - thickness, rect.height - thickness, clampedRadius);
                break;
            }
            case 'ellipse':
            {
                const cx = rect.x + rect.width / 2;
                const cy = rect.y + rect.height / 2;
                const rx = Math.max(0, rect.width / 2 - inset);
                const ry = Math.max(0, rect.height / 2 - inset);

                path.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
                break;
            }
            case 'rhombus':
            {
                const x = rect.x + inset;
                const y = rect.y + inset;
                const width = rect.width - thickness;
                const height = rect.height - thickness;
                const cx = x + width / 2;
                const cy = y + height / 2;

                path.moveTo(cx, y);
                path.lineTo(x + width, cy);
                path.lineTo(cx, y + height);
                path.lineTo(x, cy);
                path.closePath();
                break;
            }
            default:
                path.rect(rect.x + inset, rect.y + inset, rect.width - thickness, rect.height - thickness);
        }

        return path;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ShapeSkinRenderer.as::isStateDrawable()
    public override isStateDrawable(_state: number): boolean
    {
        return true;
    }
}
