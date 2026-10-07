import type {IWindow} from '../../IWindow';
import type {GradientController} from '../../components/GradientController';
import {SkinRenderer} from './SkinRenderer';

/**
 * Draws a two-color gradient fill.
 *
 * The AS3 original always calls `beginGradientFill("radial", ...)` regardless of the controller's
 * `mode` property, so `mode` is dead in the real client too. That is preserved, not "fixed": a
 * `<gradient>` authored with `mode="linear"` renders radial here exactly as it does in Flash.
 *
 * What the gradient matrix does and does not cover is the part that is easy to get wrong.
 * `createGradientBox(w, h, angle, x, y)` builds the *paint* space — a radial fill becomes the
 * ellipse inscribed in the rect, rotated by `angle`. The *geometry* is untouched: AS3 then calls
 * a plain `drawRect(x, y, w, h)`. This port previously filled `(-1, -1, 2, 2)` while the canvas
 * transform was still applied, which paints a `w × h` area rotated by `angle` — for a non-square
 * rect that leaves part of the rect unpainted (a 141 × 72 box with `direction="down"` was painted
 * 72 wide, missing 69px). The fill area below is the preimage of the rect instead, with the clip
 * trimming the overhang, so the whole rect is covered at every angle and aspect ratio.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/GradientSkinRenderer.as
 */
export class GradientSkinRenderer extends SkinRenderer
{
    constructor(name: string)
    {
        super(name);
    }

    /**
     * AS3 pipes the argument through `GradientController.normalizeDirection()` first. The switch
     * below is equivalent without that call: normalizeDirection() maps anything unrecognised to
     * `down`, and `down`'s angle is what `default` already returns.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/GradientSkinRenderer.as::angleForDirection()
    public static angleForDirection(direction: string): number
    {
        switch(direction)
        {
            case 'right':
                return 0;
            case 'down':
                return Math.PI / 2;
            case 'left':
                return Math.PI;
            case 'up':
                return -Math.PI / 2;
            case 'down_right':
                return Math.PI / 4;
            case 'down_left':
                return (3 * Math.PI) / 4;
            case 'up_left':
                return (-3 * Math.PI) / 4;
            case 'up_right':
                return -Math.PI / 4;
            default:
                return Math.PI / 2;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/GradientSkinRenderer.as::rgbFromColor()
    public static rgbFromColor(color: number): number
    {
        return color & 0xFFFFFF;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/GradientSkinRenderer.as::alphaFromColor()
    public static alphaFromColor(color: number): number
    {
        const alphaByte = (color >>> 24) & 0xFF;

        return alphaByte === 0 ? 1 : alphaByte / 255;
    }

    private static toCss(color: number): string
    {
        const rgb = GradientSkinRenderer.rgbFromColor(color);
        const a = GradientSkinRenderer.alphaFromColor(color);
        const r = (rgb >> 16) & 0xFF;
        const g = (rgb >> 8) & 0xFF;
        const b = rgb & 0xFF;

        return `rgba(${r},${g},${b},${a})`;
    }

    /**
     * @param _mode - accepted for signature fidelity and ignored, exactly as AS3 ignores it
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/GradientSkinRenderer.as::drawGradient()
    public static drawGradient(
        ctx: OffscreenCanvasRenderingContext2D,
        rect: { x: number; y: number; width: number; height: number },
        color1: number,
        color2: number,
        _mode: string,
        direction: string
    ): void
    {
        if(rect.width <= 0 || rect.height <= 0)
        {
            return;
        }

        const angle = GradientSkinRenderer.angleForDirection(direction);
        const halfWidth = rect.width / 2;
        const halfHeight = rect.height / 2;
        const centerX = rect.x + halfWidth;
        const centerY = rect.y + halfHeight;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        // AS3 draws the shape onto a BitmapData that it first wipes with `fillRect(rect, 0)`, so
        // the gradient replaces what was there instead of compositing over it. Same convention as
        // ShapeSkinRenderer and StrokeSkinRenderer in this directory.
        ctx.clearRect(rect.x, rect.y, rect.width, rect.height);

        // Preimage of the rect under translate -> rotate -> scale, i.e. how far the fill has to
        // reach in the transformed space to still cover every corner of the rect. Corner d maps
        // back through R^-1 then S^-1: (dx*cos + dy*sin) / halfWidth, (dy*cos - dx*sin) / halfHeight.
        let extentX = 0;
        let extentY = 0;

        const corners: readonly (readonly [number, number])[] = [
            [rect.x, rect.y],
            [rect.x + rect.width, rect.y],
            [rect.x, rect.y + rect.height],
            [rect.x + rect.width, rect.y + rect.height],
        ];

        for(const [cornerX, cornerY] of corners)
        {
            const dx = cornerX - centerX;
            const dy = cornerY - centerY;

            extentX = Math.max(extentX, Math.abs((dx * cos + dy * sin) / halfWidth));
            extentY = Math.max(extentY, Math.abs((dy * cos - dx * sin) / halfHeight));
        }

        ctx.save();
        ctx.beginPath();
        ctx.rect(rect.x, rect.y, rect.width, rect.height);
        ctx.clip();

        ctx.translate(centerX, centerY);
        ctx.rotate(angle);
        ctx.scale(halfWidth, halfHeight);

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);

        gradient.addColorStop(0, GradientSkinRenderer.toCss(color1));
        gradient.addColorStop(1, GradientSkinRenderer.toCss(color2));

        ctx.fillStyle = gradient;
        ctx.fillRect(-extentX, -extentY, extentX * 2, extentY * 2);
        ctx.restore();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/GradientSkinRenderer.as::draw()
    public override draw(
        window: IWindow,
        ctx: OffscreenCanvasRenderingContext2D,
        rect: { x: number; y: number; width: number; height: number },
        _state: number,
        _colorize: boolean
    ): void
    {
        const gradientWindow = window as unknown as GradientController;

        if(!gradientWindow || !rect || rect.width <= 0 || rect.height <= 0)
        {
            return;
        }

        GradientSkinRenderer.drawGradient(ctx, rect, gradientWindow.color1, gradientWindow.color2, gradientWindow.mode, gradientWindow.direction);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/GradientSkinRenderer.as::isStateDrawable()
    public override isStateDrawable(_state: number): boolean
    {
        return true;
    }
}
